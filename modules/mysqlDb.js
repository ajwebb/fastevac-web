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
	            	return callback(err, null);
	            }         
			});

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);
	            return callback(err, null);     
	        });
  		});
	},

	find_user: function(callback, emailAddress) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database");
	            return callback(err, false);
	        }

	        connection.query({
		    	sql: 'SELECT e.id, e.name, e.status, e.coordinatorFlag, c.id AS companyId, c.name AS companyName, c.status AS companyStatus, e.phoneNo, e.coordinatorId FROM employees e INNER JOIN company c ON c.id=e.companyId WHERE e.email = ?', 
		    	timeout: 60000, // 60s 
		    	values: [emailAddress]
		    }, function(err, results) {
	            if(!err) {
	            	if (results.length === 0) {
	            		return callback(null, false);
	            	}
	            	else {
	            		var userJsonData = results[0];

	            		connection.query({
					    	sql: 'SELECT latitude, longitude FROM coordinates WHERE companyId = ? ORDER BY coordinateType ASC',
					    	timeout: 60000, // 60s 
					    	values: [userJsonData.companyId]
					    }, function(err, coordResults) {
				            connection.destroy(); // release
				            if(!err) {
				            	if (coordResults.length === 0) {
				            		console.log('No coordinates data found for companyId: ' + userJsonData.companyId);
				            		userJsonData.coordinates = null;
				            		return callback(null, userJsonData);
				            	}
				            	else {
				            		var coordinatesJsonData = JSON.parse(JSON.stringify(coordResults));
				            		userJsonData.coordinates = coordinatesJsonData;
				            		return callback(null, userJsonData);
				            	}
				            }
				            else {
				            	console.log('Error retrieving coordinate data from the database: ' + err);
				            	return null;
				            }   
				        });
	            	}
	            }
	            else {
	            	console.log('Error executing user data query: ' + err);
	            	return callback(err, false);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);
	            return callback(err, false);     
	        });
  		});
	},

	update_company_status: function(companyid, status) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database: " + err);
	        }

	        console.log('connected to mysql as id ' + connection.threadId);

	        connection.query({
		    	sql: 'UPDATE company SET status = ? WHERE id = ?',
		    	timeout: 60000, // 60s 
		    	values: [status, companyid]
		    }, function(err, results) {
	            connection.destroy(); // release
	            if(err) {
	            	console.log('Error executing query to update company status: ' + err);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);  
	        });
  		});
	},

	update_user_status: function(userid, status) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database: " + err);
	        }

	        console.log('connected to mysql as id ' + connection.threadId);

	        connection.query({
		    	sql: 'UPDATE employees SET status = ? WHERE id = ?',
		    	timeout: 60000, // 60s 
		    	values: [status, userid]
		    }, function(err, results) {
	            connection.destroy(); // release
	            if(err) {
	            	console.log('Error executing query to update user status: ' + err);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);  
	        });
  		});
	},

	update_all_employees_status: function(companyid, status) {
		connectionPool.getConnection(function(err, connection) {
	        if (err) {
	            connection.release();
	            console.log("Error connecting to mysql database: " + err);
	        }

	        console.log('connected to mysql as id ' + connection.threadId);

	        connection.query({
		    	sql: 'UPDATE employees SET status = ? WHERE companyId = ?',
		    	timeout: 60000, // 60s 
		    	values: [status, userid]
		    }, function(err, results) {
	            connection.destroy(); // release
	            if(err) {
	            	console.log('Error executing query to update user status: ' + err);
	            }           
	        });

	        connection.on('error', function(err) {    
	        	// change error message to handle different errors i.e. maximum queue length and connection pool timeout
	            console.log("Error connecting to mysql database: " + err);  
	        });
  		});
	}
};