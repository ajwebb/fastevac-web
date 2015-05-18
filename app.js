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
	console.log('email logging in as: ' + req.body.emailAddress);

	var callback = function(err, user) {
		if (!user) {
			// no user found
			req.session.destroy();
			console.log('No user found');
			res.send(null);
			// res.status(404).json('Invalid login: User not found');
		}
		else {
			// adding user to session
			req.session.user = user;
			console.log('logged in as: ' + req.session.user.name);
			return next();
		}
	};

	// get user data from mysql database
	mysql.find_user(callback, req.body.emailAddress);
};

var activeUser = function(req, res, next) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);
		return next();
	}
	else {
		req.session.destroy();
		res.send(null);
		// res.redirect('/');
	}
};

var authorizeWarden = function(req, res, next) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);

		if (req.session.user.coordinatorFlag != 1) {
			console.log('not a coordinator');
			res.send(null);
		}
		else {
			return next();
		}
	}
	else {
		res.send(null);
	}
}

var renderPage = function(req, res) {
	res.json(req.session.user);
};

var triggerAlert = function(req, res, next) {
	// update mysql db as of now
	mysql.update_company_status(req.session.user.companyId, 1);

	req.session.user.companyStatus = 1;
	return next();
};

var clearAlert = function(req, res, next) {
	// update mysql db as of now
	mysql.update_company_status(req.session.user.companyId, 0);

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

var updateStatus = function(req, res, next) {
	var newStatus = req.query.status;
	console.log('current company status: ' + req.session.user.companyStatus);
	mysql.update_user_status(req.session.user.id, newStatus);
	req.session.user.status = newStatus;
	return next();
};

// routes
// user logging in from login page
app.post('/login', authorizeLogin, renderPage);

// navigate to alert page
app.get('/alertPage', authorizeWarden, renderPage);

// user triggering an alert
app.get('/triggerAlert', authorizeWarden, triggerAlert, renderPage);

// user triggering an alert
app.get('/clearAlert', authorizeWarden, clearAlert, renderPage);

// navigate to dashboard
app.get('/dashboard', activeUser, renderPage);

// get employee data from mysql database and todo-insert into redis cache
app.get('/employees', getEmployeesData);

// get information for specific employee
app.get('/employees/:id', getEmployeeData);

// update employee status
app.get('/updateStatus', activeUser, updateStatus, renderPage);

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

