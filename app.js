require('newrelic');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var mysql = require('./lib/mysqlDb');
var redis = require('./lib/redis');
var session = require('./lib/sessions');
var client = redis.client();

// redis session
app.use(session.Sessions(client, process.env.cookie_secret));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

var io = require('socket.io')(server);

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

server.listen(port, function() {
	console.log('Server is listening on http://localhost:' + port);
});

// set the view engine to html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// set the home page route
app.get('/', function(req, res) {
    // ejs render automatically looks in the views folder
    res.render('index.html');
});

var authorizeLogin = function(req, res, next) {
	var emailAddr = req.body.emailAddress;
	console.log('email logging in as: ' + emailAddr);

	var callback = function(err, user) {
		if (!user) {
			// no user found
			req.session.destroy();
			console.log('No user found');
			res.json({error: 'no user exists by that email address'});
		}
		else {
			if (user.coordinatorFlag == 1) {
				user.adminRole = 'warden';
			}
			else {
				user.adminRole = 'employee';
			}
			// adding user to session
			req.session.user = user;
			console.log('logged in as: ' + req.session.user.name);
			res.json(req.session.user);
		}
	};

	// get user data from mysql database
	mysql.find_user(callback, emailAddr);
};

var activeUser = function(req, res) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);
		res.json({user: req.session.user});
		// res.json(req.session.user);
	}
	else {
		console.log('no logged in user found in session');
		res.json({error: 'no active user found in session'});
	}
}

var requireEmployeeRole = function(req, res, next) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);

		if (req.session.user.coordinatorFlag != 1) {
			console.log('not a coordinator');
			res.json({error: 'unauthorized user'});
		}
		else {
			res.sendStatus(403);
		}
	}
	else {
		res.json({error: 'no user found in session'});
	}
}

var triggerAlert = function(req, res, next) {
	// update mysql db as of now
	mysql.update_company_status(req.session.user.companyId, 1);

	req.session.user.companyStatus = 1;
	return next();
};

var clearAlert = function(req, res, next) {
	// update mysql db as of now
	mysql.update_company_status(req.session.user.companyId, 0);

	// update all employees status to be not checked in
	mysql.update_all_employees_status(req.session.user.companyId, 0);

	req.session.user.companyStatus = 0;
	return next();
};

var getEmployeesData = function(req, res) {
	console.log('warden id: ' + req.query.coordinatorId);
	var wardenId = req.query.coordinatorId;

	var callback = function(err, results) {
		console.log('number of employees: ' + results.length);

		if (results.length !== 0) {
			res.json(results);
		}
		else {
			res.send(null);
		}
	}

	mysql.get_employees_data(callback, wardenId);
};

var getEmployeeData = function(req, res) {
	console.log('current information for employee id: ' + req.params.id);
	var employeeid = req.params.id;

	var callback = function(err, employeeData) {
		if (!employeeData) {
			res.send(null);
		}
		else {
			res.json(employeeData);
		}
	}

	mysql.get_employee_data(callback, employeeid);
};

var updateStatus = function(req, res) {
	if (req.session && req.session.user) {
		mysql.update_user_status(req.params.id, req.body.status);
		req.session.user.status = req.body.status;
		res.json({user: req.session.user});
	}
};

// routes
// user logging in from login page
app.post('/login', authorizeLogin);

// user updating status
app.put('/user/:id', updateStatus);

// check user session
app.get('/auth', activeUser);

// get employee data from mysql database and todo-insert into redis cache
app.get('/employees', requireWardenRole, getEmployeesData);

// get information for specific employee
app.get('/employee/:id', getEmployeeData);

// user triggering an alert
app.get('/triggerAlert', authorizeWarden, triggerAlert);

// user triggering an alert
app.get('/clearAlert', authorizeWarden, clearAlert);

// not found error
app.get('*', function(req, res) {
	res.render('404.html');
});

// socket io
var rooms = [];

// user connected
io.on('connection', function(socket){
	console.log('user connected');

	// user joining/creating the company's communication channel through the corresponding room
	socket.on('join', function(id, room, wardenFlag) {
		if (rooms.length === 0 || rooms.indexOf(room) === -1) {
			rooms.push(room);
			rooms.push(room + '-wardens');
			console.log('created room: ' + room);
			console.log('created room: ' + room + '-wardens');
		}
		if (wardenFlag) {
			socket.join(room + '-wardens');
			console.log('joined room: ' + room + '-wardens');
		}
		socket.join(room);
		console.log('joined room: ' + room);
	});

	// evac coordinator broadcasting a message to all employees or only evac coordinators
	socket.on('broadcast', function(name, message, room) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			console.log('message was broadcasted by: ' + name);
			message = 'Broadcast from ' + name + ': ' + message;
			socket.broadcast.to(room).emit('message_received', message);
		}
	});

	// user's status has been updated, send event to evac coordinator
	socket.on('update_status', function(id, room, status) {
		console.log('user ' + id + ' status updated to: ' + status);

		// emit event to wardens
		socket.broadcast.to(room + '-wardens').emit('employee_status_update', id, status);
	});

	socket.on('disconnect', function() {
		console.log('user disconnected');
	});

});

