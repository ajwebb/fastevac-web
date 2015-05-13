var expressSession = require('express-session');
var RedisStore = require('connect-redis')(expressSession);

module.exports = {
	Sessions: function(client, secret) {
		var store = new RedisStore({ client: client });
	    var session = expressSession({
	    	secret: secret,
	    	store: store,
	    	resave: true,
	    	saveUninitialized: true
	    });

	    return session;
	}
}