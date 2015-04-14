var express = require('express');
var app = express();

var server = require('http').createServer(app);
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

// app.listen(port, function() {
//     console.log('Our app is running on http://localhost:' + port);
// });

// socket io

var rooms = [];

io.on('connection', function(client){
	console.log('client connected');

	client.on('create', function(room) {
		if (rooms.length === 0 || rooms.indexOf(room) === -1) {
			rooms.push(room);
			console.log('created room: ' + room);
		}
		client.join(room);
		console.log('joined room: ' + room);
	});

	client.on('join', function(room) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			client.join(room);
			console.log('joined room: ' + room);
		}
	});

	client.on('broadcast', function(message, room) {
		if (rooms.length > 0 && rooms.indexOf(room) != -1) {
			console.log('message was broadcasted');
			client.broadcast.to(room).emit('message_received', message);
		}
	});

});

