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

	var callback = function(err, results) {
		console.log('results length is: ' + results.length);
		if (results.length === 0) {
			res.send(null);
			// res.status(404).json('User not found');
		}
		else {
			var userJsonData = results[0];

			// manually adding coordinates to json object, todo - add values from db/cache
			userJsonData.coordinates = [{"latitude": 33.870037, "longitude": -117.921696}, {"latitude": 33.870254, "longitude": -117.921957}, {"latitude": 33.869827, "longitude": -117.921457}];

			// testing sessions
			req.session.user = userJsonData;
			console.log('logged in as: ' + req.session.user.name);

			res.json(userJsonData);
		}
	};

	mysql.get_user_data(callback, req.body.emailAddress);
});

// get user information from session
app.get('/usersession', function(req, res) {
	if (req.session.user !== null) {
		console.log('logged in user: ' + req.session.user.name);
		var sessionUser = req.session.user;
		res.json(sessionUser);
	}
	else {
		// unable to current logged in user, force login again
		res.send(null);
	}
});

// get employee data from mysql database and insert into redis cache
app.get('/employees', function(req, res) {
	console.log('warden id: ' + req.query.coordinatorId);

	var callback = function(err, results) {
		console.log('number of employees: ' + results.length);
		res.json(results);
	}

	mysql.get_employees_data(callback, req.query.coordinatorId);
});

// get information for specific employee
app.get('/employees/:id', function(req, res) {
	console.log('current information for employee id: ' + req.params.id);
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
		socket.broadcast.to(room + '-wardens').emit('employee_status_update');
	});

	socket.on('disconnect', function() {
		console.log('user disconnected');
	});

});

