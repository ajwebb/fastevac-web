/*
 * JS for app 
 */

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
            this.save(); // need to update server with new status for current employee
            socket.emit('update_status', this.get('id'), this.get('companyName'), newStatus);
        }
    });

    // User View
    var UserView = Backbone.View.extend({
        events: {},

        initialize: function() {},

        render: function() {}
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

    // Login View
    var LoginView = Backbone.View.extend({
        template: _.template($('#login_template').html()),

        attributes: function() {
            return {
                'data-role': 'page'
            }
        },

        initizlize: function() {},

        events: {
            'click .login_button': 'onLoginAttempt'
        },

        onLoginAttempt: function(event) {
            if (event) {
                event.preventDefault();
            }
            if (Module.validateLoginForm()) {
                console.log('successful login validation');
                Module.session.login({
                    emailAddress: $('#email').val()
                }, {
                    success: function(userData){
                        console.log("LOGIN SUCCESS", userData);
                        // route to appropriate page
                        Module.routeLogin();
                    },
                    error: function(err){
                        console.log("LOGIN ERROR", err);
                        alert('Login Error: ' + err);
                    }
                });
            }
            else {
                console.log('unable to validate login credentials');
                var loginErrorMsg = 'Invalid Login Credentials: User not found';
                $('.login_error_message').text(loginErrorMsg);
                $('.login_error_message').show();
            }
        },

        render: function() {
            this.$el.html(this.template);
            return this;
        }
    });

    // Evacuation View
    var EvacuationView = Backbone.View.extend({
        template: _.template($('#evacuation_template').html()),

        attributes: function() {
            return {
                'data-role': 'page'
            }
        },

        initizlize: function() {},

        events: {
            'click .confirm_alert': 'triggerAlert'
        },

        triggerAlert: function(event) {
            if (event) {
                event.preventDefault();
            }
            Module.triggerAlert();
        },

        render: function() {
            this.$el.html(this.template);
            return this;
        }
    });

    // Employee Model
    var Employee = Backbone.Model.extend({
        urlRoot: '/employee',

        defaults: {
            id: 0,
            name: 'Unknown Employee',
            status: 0,
            phoneNo: 5555555555
        }
    });

    // Employee View
    var EmployeeView = Backbone.View.extend({
        tagName: 'li',

        template: _.template('<a href="/#employees/<%= id %>"><%= name %></a>'),

        initialize: function() {},

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
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

    // Employee Collection View
    var EmployeeListView = Backbone.View.extend({
        tagName: 'ul',

        initialize: function() {
            this.collection.on('reset', this.addAll, this);
        },

        addOne: function(emp) {
            console.log('Employee: ' + emp.get('name'));
            var empView = new EmployeeView({model: emp});
            this.$el.append(empView.render().el);
        },

        addAll: function() {
            this.collection.forEach(this.addOne, this);
        },

        render: function() {
            this.addAll();
            return this;
        }
    });

    // backbone router
    var Router = Backbone.Router.extend({
        initialize: function() {
            console.log('router initialize!');
        },

        routes: {
            '': 'index',
            'evacuation': 'evacuation',
            'dashboard': 'dashboard'
        },

        show: function(view) {
            this.currentView = view;
            $('body').append((this.currentView.render().$el));
            $.mobile.changePage(this.currentView.$el, {changeHash:false});
        },

        index: function() {
            // render login page
            console.log('router login function');
            if (Module.session.get('logged_in')) {
                console.log('user found in session');
                // Module.routeLogin();
            }
            this.show(new LoginView({}));
        },

        evacuation: function() {
            // render evacuation page
            console.log('router evac page function');
            this.show(new EvacuationView({}));
        },

        dashboard: function() {
            console.log('router dashboard function');
            // render dashboard page, need to show correct navbar for warden/employee
        }
    });






$(function(){

    $(document).bind("mobileinit", function(){
        $.mobile.hashListeningEnabled = false;
        $.mobile.linkBindingEnabled = false;
    });

    Module.router = new Router();
    Module.session = new SessionModel({});

    // check if user session exists
    Module.session.checkAuth(function() {
        console.log('backbone history starting');
        Backbone.history.start();
    });


    

    // create event for submitting login form
    // $('form').submit(function (event) {
    //     event.stopPropagation();
    //     event.preventDefault();

    //     Module.validateLoginForm();
    // });

    // navigating to alert page for the first time, create events for initiating evacuation
    $(document).on('pagecreate', '#alertScreen', function() {
        // console.log('alert page');

        // $.get('/alertpage', function(userData) {
        //     Module.actionRequireLogin(null, userData);
        // });
        
    	// $(document).on('click', '.confirm_alert', function(event) {
    		// console.log('confirmed alert');
	        // event.stopPropagation();
	        // event.preventDefault();
            // $.get('/triggeralert', function(userData) {
            //     Module.actionRequireLogin(Module.triggerAlert, userData);
            // });
            // Module.triggerAlert();
	    // });

        // $(document).on('click', '.alertScreen_mobilebutton_allClear', function(event) {
        //     console.log('cleared alert status for company');
            // $.get('/clearalert', function(userData) {
                // Module.actionRequireLogin(Module.clearAlert, userData);
            // });
        // });
    });

    $(document).on('pagecreate', '#wardenMap', function() {
        console.log('warden map page');

        // initialize map
        // Module.setStaticMap();

        // need to resize map on device orientation change
        $(window).on("throttledresize", Module.setStaticMap);
    });

    $(document).on('pagecreate', '#wardenCompass', function() {
        console.log('warden compass page');

        // initialize compass
        // Compass.initCompass();
    });

    $(document).on('pagecreate', '#employees', function() {
        console.log('warden personnel page');

        // initialize personnel lists
        // Module.getPersonnelInfo();
    });

    $(document).on('pagecreate', '#broadcast_popup', function() {
        console.log('broadcast dialog popup');

        // send broadcast event
        $(document).on('click', '.send_message', function(event) {
            var message = document.getElementById('textarea').value;
            if (typeof(message) !== 'undefined' && message !== 'null' && message !== '') {
                var wardensOnlyFlag = false;
                var wardensOnlyRadioValue = $("input:radio[name ='radio-choice-h-2']:checked").val();
                if (wardensOnlyRadioValue === 'on') {
                    wardensOnlyFlag = true;
                }
                // Module.broadcastMessage(message, wardensOnlyFlag);
                console.log('broadcast sent');
            }
            document.getElementById('textarea').value = '';
        });

        // cancel broadcast event
        $(document).on('click', '.cancel_broadcast', function(event) {
            console.log('broadcast canceled');
            document.getElementById('textarea').value = '';
        });
    });

    // navigating to main dashboard page, initialize events for using the navbar
    $(document).on('pagecreate', '#employeestatus', function() {
        console.log('employee status page');

        // user checks in
        $(document).on('click', '.check_in_button', function(event) {
            console.log('user checking in');
            // $.get('/updateStatus', {status: 1}, function(userData) {
            //     Module.actionRequireLogin(Module.updateStatus, userData);
            // });
        });

        // user needs assistance
        $(document).on('click', '.need_assistance_button', function(event) {
            console.log('user needs assistance');
            // $.get('/updateStatus', {status: 2}, function(userData) {
            //     Module.actionRequireLogin(Module.updateStatus, userData);
            // });
        });
    });

    // page container before show events
    $(document).on("pagecontainerbeforeshow", function () {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        var activePageId = activePage[0].id;
        if (activePageId === 'alertScreen') {
            // show alert or all clear button
            // Module.configureAlertScreen();
        }
    });

    // page container show events
    $(document).on("pagecontainershow", function () {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        var activePageId = activePage[0].id;
        if (activePageId === 'broadcast_popup') {
            console.log('broadcast popup clicked');
            // $('#textarea').focus();  // removing because textarea focus causing issues on mobile safari
        }
    });
});