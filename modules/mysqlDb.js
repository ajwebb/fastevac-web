var mysql = require('mysql');
var connectionPool = mysql.createPool(process.env.CLEARDB_DATABASE_URL);

module.exports = {
	get_employees_data: function(callback, coordinatorId) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database");
	            return callback(err, null);
	        }

	        var columns = ['id', 'name', 'status', 'phoneNo'];
	        var query = connection.query('SELECT ?? FROM ?? WHERE coordinatorId = ?', [columns, 'employees', coordinatorId], function(err, results) {
				connection.destroy(); // release
	            if(!err) {
	            	return callback(null, results);
	            }
	            else {
	            	console.log('Error getting employee information from database for evacuation coordinator: ' + coordinatorId + ', Error: ' + err);
	            }         
			});

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);
	            return callback(err, null);     
	        });
  		});
	},

	get_user_data: function(callback, emailAddress) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database");
	            return callback(err, null);
	        }

	        console.log('connected to mysql as id ' + connection.threadId);

	        connection.query({
		    	sql: 'SELECT e.id, e.name, e.status, e.coordinatorFlag, c.id AS companyId, c.name AS companyName, c.status AS companyStatus, e.phoneNo, e.coordinatorId FROM employees e INNER JOIN company c ON c.id=e.companyId WHERE e.email = ?',
		    	timeout: 60000, // 60s 
		    	values: [emailAddress]
		    }, function(err, results) {
	            connection.destroy(); // release
	            if(!err) {
	                return callback(null, results);
	            }
	            else {
	            	console.log('Error executing user data query: ' + err);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);
	            return callback(err, null);     
	        });
  		});
	},

	get_coordinates_data: function(req, res) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database");
	            return;
	        }

	        connection.query({
		    	sql: 'SELECT latitude, longitude FROM coordinates WHERE companyId = ? ORDER BY coordinateType ASC',
		    	timeout: 60000, // 60s 
		    	values: [111111]
		    }, function(err, results) {
	            connection.destroy(); // release
	            if(!err) {
	            	console.log('returned ' + results.length + ' rows');
	            	res.json(results);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);
	            return;     
	        });
  		});
	}
};