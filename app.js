var express = require('express');
var app = express();
var server = require('http').createServer(app);

var redis = require("redis");
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);

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

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {

    // ejs render automatically looks in the views folder
    res.render('index.html');
});

// socket io

var rooms = [];

// user connected
io.on('connection', function(socket){
	console.log('user connected');

	// alert has been initiated, open lines of communication through rooms
	socket.on('create', function(id, room) {
		if (rooms.length === 0 || rooms.indexOf(room) === -1) {
			rooms.push(room);
			rooms.push(room + '-wardens');
			console.log('created room: ' + room);
			console.log('created room: ' + room + '-wardens');
		}
		socket.join(room);
		socket.join(room + 'wardens');
		console.log('joined room: ' + room);
		console.log('joined room: ' + room + '-wardens');

		client.hset(id, 'socketid', socket.id);
	});

	// user joining the company's communication channel through the corresponding room
	socket.on('join', function(id, room, wardenFlag) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			if (wardenFlag) {
				socket.join(room + '-wardens');
				console.log('joined room: ' + room + '-wardens');
			}
			socket.join(room);
			console.log('joined room: ' + room);
		}
	});

	// evac coordinator broadcasting a message to all employees or only evac coordinators
	socket.on('broadcast', function(message, room) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			console.log('message was broadcasted');
			socket.broadcast.to(room).emit('message_received', message);
		}
	});

	// user's status has been updated, send event to evac coordinator
	socket.on('update_status', function(id, status, wardenId) {
		console.log('user id ' + id + ' status updated to: ' + status);
		// emit to specific socket
		client.hgetall(wardenId, function(err, obj) {
			if (err) throw err;
			io.to(obj.socketid).emit('employee_status_update');
		});
	});

	socket.on('disconnect', function() {
		console.log('user disconnected');
	});

});

