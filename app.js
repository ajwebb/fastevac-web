var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var mysql = require('./modules/mysqlDb');
var session = require('./modules/sessions');

// redis info
var redis = require("redis");
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);

// redis session store
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

// get user data from mysql database
app.post('/login', function(req, res) {
	console.log('email logging in as: ' + req.body.emailAddress);

	var callback = function(err, user) {
		if (!user) {
			// no user found
			console.log('No user found');
			// res.status(404).json('User not found');

			res.send(null);
		}
		else {
			// manually adding coordinates to json object, todo - add values from db
			user.coordinates = [{"latitude": 33.870037, "longitude": -117.921696}, {"latitude": 33.870254, "longitude": -117.921957}, {"latitude": 33.869827, "longitude": -117.921457}];

			// adding user to session
			req.session.user = user;
			console.log('logged in as: ' + req.session.user.name);

			res.json(user);
		}
	};

	mysql.find_user(callback, req.body.emailAddress);
});

// navigate to alert page
app.get('/alertpage', function(req, res) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);
		var sessionUser = req.session.user;
		res.json(sessionUser);
	}
	else {
		res.send(null);
	}
});

// trigger alert
app.get('/triggeralert', function(req, res) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);

		// update mysql db as of now
		// mysql.update_company_status(req.session.user.companyId, 1);

		req.session.user.companyStatus = 1;

		var sessionUser = req.session.user;
		res.json(sessionUser);
	}
	else {
		res.send(null);
	}
});

// navigate to dashboard
app.get('/dashboard', function(req, res) {
	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);
		var sessionUser = req.session.user;
		res.json(sessionUser);
	}
	else {
		res.send(null);
	}
});

// get employee data from mysql database and todo-insert into redis cache
app.get('/employees', function(req, res) {
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
});

// get information for specific employee
app.get('/employees/:id', function(req, res) {
	console.log('current information for employee id: ' + req.params.id);

	// example getting user info from redis cache
	// client.HGETALL('employee:' + req.params.id, function(err, object) {
	// 	console.log(object);
	// });
});

// update employee status
app.get('/updateStatus', function(req, res) {
	var newStatus = req.query.status;

	if (req.session && req.session.user) {
		console.log('logged in user: ' + req.session.user.name);

		// update user status in database
		mysql.update_user_status(req.session.user.id, newStatus);
		req.session.user.status = newStatus;

		var sessionUser = req.session.user;
		res.json(sessionUser);
	}
	else {
		res.send(null);
	}
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
	socket.on('broadcast', function(message, room) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			console.log('message was broadcasted');
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

