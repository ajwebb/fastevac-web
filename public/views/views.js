var Views = (function() {

	// User View
    var UserView = Backbone.View.extend({
        events: {},

        initialize: function() {},

        render: function() {}
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
            'click .confirm_alert': 'triggerAlert',
            'click .alertScreen_mobilebutton_allClear': 'clearAlert'
        },

        triggerAlert: function(event) {
            if (event) {
                event.preventDefault();
            }
            console.log('triggering alert');
            // todo - send push notifications/txt messages to all employees
            // todo - initiate all employees as not checked in

            // set company status to evacuation for session, todo - update db with current company status
            Module.session.user.set({'companyStatus': 1});

            // navigate to user dashboard page
            Module.router.navigate('dashboard', {trigger: true});
        },

        clearAlert: function(event) {
            console.log('clearing alert');

            // set company status to all clear, todo - update db
            Module.session.user.set({'companyStatus': 0});
            Module.clearAlert();
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

            Module.employeeCollection = new Models.EmployeeCollection({});
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

    // Employee View
    var EmployeeView = Backbone.View.extend({
        tagName: 'li',

        // template: _.template('<a href="/#employees/<%= id %>"><%= name %></a>'),
        template: _.template('<%= name %>'),

        initialize: function() {},

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
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

	return {
		UserView: UserView,
		LoginView: LoginView,
		EvacuationView: EvacuationView,
		WardenDashboardView: WardenDashboardView,
		EmployeeDashboardView: EmployeeDashboardView,
		BroadcastView: BroadcastView,
		EmployeeView: EmployeeView,
		EmployeeListView: EmployeeListView
	}
})();