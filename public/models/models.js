var Models = (function() {

    // User Model
    var User = Backbone.Model.extend({
        urlRoot: '/user',

        defaults: {
            id: 0,
            name: '',
            status: 0,
            coordinatorFlag: 0,
            adminRole: '',
            companyId: 0,
            companyName: '',
            companyStatus: 0,
            phoneNo: 0,
            coordinatorId: 0,
            coordinates: null
        },

        updateStatus: function(newStatus) {
            this.set({'status': newStatus});
            // this.save(); // need to update server with new status for current employee
            $.ajax({
                url: '/user/'+this.get('id'),
                type: 'PUT',
                data: {status: newStatus},
                success: function(res) {
                    if (res.user) {
                        Module.session.updateSessionUser(res.user);
                        Module.employeeUpdateStatus(newStatus);
                        Module.getStatusInfo();
                    }
                }
            });
        }
    });

    // Session Model
    var SessionModel = Backbone.Model.extend({
        urlRoot: '/auth',

        defaults: {
            logged_in: false,
            user_id: 0,
            user_email: ''
        },

        initialize: function() {
            console.log('initialize session model');
            this.user = new User({});
        },

        updateSessionUser: function(userData) {
            this.user.set(_.pick(userData, _.keys(this.user.defaults)));
        },

        checkAuth: function(callback, args) {
            var self = this;
            this.fetch({
                success: function(req, res) {
                    if (!res.error && res.user) {
                        self.updateSessionUser(res.user);
                        self.set({'logged_in': true, 'user_id': res.user.id});
                    }
                    else {
                        self.set({'logged_in': false});
                    }
                },
                error: function(e) {
                    console.log('error fetching session data: ' + e);
                    self.set({'logged_in': false});
                    return;
                },
                complete: function(e) {
                    console.log('session fetch complete');
                    if (!callback) {
                        return;
                    }
                    else {
                        return callback();
                    }
                }
            })
        },

        login: function(credentials, callback) {
            var self = this;
            $.post('/login', {emailAddress: credentials.emailAddress}, function(userData) {
                if (!userData.error && userData) {
                    console.log('login post user name: ' + userData.name);
                    self.updateSessionUser(userData);
                    self.set({'user_id': userData.id, logged_in : true});
                    if('success' in callback) callback.success(userData);
                }
                else {
                    if (userData.error) {
                        if('error' in callback) callback.error(userData.error);
                    }
                    self.set({'logged_in': false});
                }
            });
        },

        logout: function() {
            // destroy session
        }
    });

    // Employee Model
    var Employee = Backbone.Model.extend({
        urlRoot: '/employee',

        defaults: {
            id: 0,
            name: '',
            status: 0,
            phoneNo: 0
        }
    });

    // Collection of Employees
    var EmployeeCollection = Backbone.Collection.extend({
        model: Employee,

        url: '/employees',

        needAssistanceList: function() {
            return this.where({status: 2});
        },

        checkedInList: function() {
            return this.where({status: 1});
        },

        notCheckedInList: function() {
            return this.where({status: 0});
        },

        needAssistanceCount: function() {
            return this.where({status: 2}).length;
        },

        checkedInCount: function() {
            return this.where({status: 1}).length;
        },

        notCheckedInCount: function() {
            return this.where({status: 0}).length;
        }
    });

    return {
        User: User,
        SessionModel: SessionModel,
        Employee: Employee,
        EmployeeCollection: EmployeeCollection
    };
})();