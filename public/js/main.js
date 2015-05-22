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
                // setting email for dev env
                var emailAddr = $('#email').val();
                if (emailAddr === '') {
                    emailAddr = 'awebbx@gmail.com';
                }
                Module.session.login({
                    emailAddress: emailAddr
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
            $('form').trigger('reset');
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
            console.log('triggering alert');
            // todo - send push notifications/txt messages to all employees
            // todo - initiate all employees as not checked in

            // navigate to user dashboard page
            Module.router.navigate('dashboard', {trigger: true});
        },

        render: function() {
            this.$el.html(this.template);
            return this;
        }
    });

    // Warden Dashboard View - main view for the app
    var WardenDashboardView = Backbone.View.extend({
        template: _.template($('#warden_dashboard_template').html()),

        attributes: function() {
            return {
                'data-role': 'page'
            }
        },

        initialize: function() {
            // join broadcast channels for company
            Module.joinCompanyRoom();

            Module.employeeCollection = new EmployeeCollection();
        },

        events: {
            'click .ui-navbar a': 'showContent',
            'click .dashboard_home_button': 'navToEvacPage',
            'click .broadcast_popup': 'broadcastMessage'
        },

        showContent: function(event) {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(event.currentTarget).attr('data-href') + '_content').show();
        },

        navToEvacPage: function(event) {
            Module.router.navigate('evacuation', {trigger: true});
        },

        broadcastMessage: function(event) {
            console.log('broadcast popup clicked');
            
            var broadcastPopup = new BroadcastView({});
            broadcastPopup.render();

            event.preventDefault();
            $.mobile.changePage('#broadcast_popup');
        },

        render: function() {
            this.$el.html(this.template);
            // return this;
            $('body').append((this.$el));
            $.mobile.changePage(this.$el, {changeHash:false});

            Module.setStaticMap();
            Compass.initCompass();
            Module.getPersonnelInfo();
        }
    });

    // Employee Dashboard View - main view for the app
    var EmployeeDashboardView = Backbone.View.extend({
        template: _.template($('#employee_dashboard_template').html()),

        attributes: function() {
            return {
                'data-role': 'page'
            }
        },

        initialize: function() {
            // join broadcast channels for company
            Module.joinCompanyRoom();
        },

        events: {
            'click .ui-navbar a': 'showContent',
            'click .check_in_button': 'checkIn',
            'click .need_assistance_button': 'needAssistance'
        },

        showContent: function(event) {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(event.currentTarget).attr('data-href') + '_content').show();
        },

        checkIn: function(event) {
            console.log('user checking in');
            if (Module.session && Module.session.user) {
                Module.session.user.updateStatus(1);
            }
        },

        needAssistance: function(event) {
            console.log('user needs assistance');
            if (Module.session && Module.session.user) {
                Module.session.user.updateStatus(2);
            }
        },

        render: function() {
            this.$el.html(this.template);
            // return this;
            $('body').append((this.$el));
            $.mobile.changePage(this.$el, {changeHash:false});

            Module.setStaticMap();
            Compass.initCompass();
            Module.getStatusInfo();
        }
    });

    // Broadcast Popup View
    var BroadcastView = Backbone.View.extend({
        template: _.template($('#broadcast_popup_template').html()),

        attributes: function() {
            return {
                'data-role': 'dialog',
                'id': 'broadcast_popup'
            }
        },

        events: {
            'click .send_message': 'sendMessage',
            'click .cancel_broadcast': 'cancelBroadcast'
        },

        sendMessage: function(event) {
            var message = document.getElementById('textarea').value;
            if (typeof(message) !== 'undefined' && message !== 'null' && message !== '') {
                var wardensOnlyFlag = false;
                var wardensOnlyRadioValue = $("input:radio[name ='radio-choice-h-2']:checked").val();
                if (wardensOnlyRadioValue === 'on') {
                    wardensOnlyFlag = true;
                }
                Module.broadcastMessage(message, wardensOnlyFlag);
                console.log('broadcast sent');
            }
            document.getElementById('textarea').value = '';
        },

        cancelBroadcast: function(event) {
            console.log('broadcast canceled');
            document.getElementById('textarea').value = '';
        },

        render: function() {
            this.$el.html(this.template);
            $('body').append((this.$el));
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

            if (Module.session.user && Module.session.user.get('adminRole') === 'warden') {
                // warden view
                var wardenDashboard = new WardenDashboardView({});
                wardenDashboard.render();
            }
            else {
                // employee view
                var employeeDashboard = new EmployeeDashboardView({});
                employeeDashboard.render();
            }

            $(window).on("throttledresize", Module.setStaticMap);
        }
    });









$(function(){
    // delegate routing to backbone instead of jquery
    $(document).bind("mobileinit", function(){
        $.mobile.hashListeningEnabled = false;
        $.mobile.linkBindingEnabled = false;
    });

    // remove the previous page from html
    $(document).on('pagehide', function (event) {
        console.log('document page hide event');
        $(event.target).remove();
    });

    Module.router = new Router();
    Module.session = new SessionModel({});

    // check if user session exists
    Module.session.checkAuth(function() {
        console.log('backbone history starting');
        Backbone.history.start();
    });
});