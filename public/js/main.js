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
            user_id: 0
        },

        initialize: function() {
            console.log('initialize session model');
            this.user = new User({});
        },

        updateSessionUser: function(userData) {
            this.user.set(_.pick(userData, _.keys(this,user.defaults)));
        },

        checkAuth: function(callback, args) {
            var self = this;
            this.fetch({
                success: function(req, res) {
                    if (!res.error && res.user) {
                        self.updateSessionUser(res.user);
                        self.set({'logged_in': true});
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

        login: function() {

        },

        logout: function() {

        }
    });

    // Login View
    var LoginView = Backbone.View.extend({
        template: _.template($('#login_template').html()),

        className: 'login_container',

        attributes: function() {
            return {
                'data-role': 'page'
            }
        },

        events: {
            'click .login_button': 'onLoginAttempt'
        },

        initizlize: function() {
            console.log('login view initialize!');
            // _.bindAll(this);
        },

        onLoginAttempt: function(event) {
            if (event) {
                event.preventDefault();
            }
            if (Module.validateLoginForm()) {
                console.log('successful login validation');
            }
        },

        render: function() {
            console.log('weve reached the login view render function');
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
            '': 'index'
        },

        show: function(view) {
            this.currentView = view;

            // $('#content').html(this.currentView.render().$el);

            $('body').append((this.currentView.render().$el));
            $.mobile.changePage(this.currentView.$el, {changeHash:false});

            // $(page.el).attr('data-role', 'page');
            // page.render();
            // $('body').append($(page.el));
            // var transition = $.mobile.defaultPageTransition;
            // // We don't want to slide the first page
            // if (this.firstPage) {
            //     transition = 'none';
            //     this.firstPage = false;
            // }
            // $.mobile.changePage($(page.el), {changeHash:false, transition: transition});
        },

        index: function() {
            // render login page
            console.log('router index function');
            this.show(new LoginView({}));
        }
    });




var Module = (function () {

    var socket = io.connect();

    // socket events
    socket.on('message_received', function(message) {
        console.log('socket broadcast event received');
        alert(message);
    });

    socket.on('employee_status_update', function(employeeId, employeeStatus) {
        getPersonnelInfo(); // refresh personnel list with updated statuses
    });


    var currentUser;
    var employeeCollection;

    var router = new Router();
    var session = new SessionModel({});

    // Backbone.history.start();

    // check if user session exists
    session.checkAuth(function() {
        console.log('backbone history starting');
        Backbone.history.start();
    });


    


    

    

    var userLogon = function(userData) {
        if (userData === null || userData === '') {
            // user not found - show error message
            var loginErrorMsg = 'Invalid Login Credentials: User not found';
            $('.login_error_message').text(loginErrorMsg);
            $('.login_error_message').show();
        }
        else {
            $('.login_error_message').hide();

            // create new instance of current user model with logged in user data from db
            currentUser = new User(userData);
            // var currentUserView = new UserView({model: currentUser});

            if (currentUser.get('coordinatorFlag') == 1) {
                $.mobile.changePage('#alertScreen');
            }
            else {
                $.mobile.changePage('#wardenMap');
            }
        }
        $('form').trigger('reset');
    };


    // get employee information from the database and load the employees model
    function getPersonnelInfo() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            if (currentUser.get('coordinatorFlag') == 1) {
                employeeCollection = new EmployeeCollection();
                employeeCollection.fetch({
                    data: {
                        coordinatorId: currentUser.get('id')
                    },
                    success: updatePersonnelInfo,
                    error: function(e) {
                        console.log('Error fetching employee data: ' + e);
                    },
                    complete: function(e) {
                        console.log('Fetching employee data complete');
                    }
                });
            }
        }
    };

    // update lists of employees with their current status, for evac coordinator only
    function updatePersonnelInfo() {
        $('#need_assistance_counter').text(employeeCollection.needAssistanceCount());
        $('#not_checked_in_counter').text(employeeCollection.notCheckedInCount());
        $('#checked_in_counter').text(employeeCollection.checkedInCount());

        $('#need_assistance_employees').empty();
        $('#not_checked_in_employees').empty();
        $('#checked_in_employees').empty();

        employeeCollection.needAssistanceList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#need_assistance_employees').append(empView.render().el);
        });

        employeeCollection.notCheckedInList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#not_checked_in_employees').append(empView.render().el);
        });

        employeeCollection.checkedInList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#checked_in_employees').append(empView.render().el);
        });

        // var empListView = new EmployeeListView({collection: employeeCollection});
        // $('#warden_personnel_content').html(empListView.render().el);

        $('#need_assistance_employees').listview().listview('refresh');
        $('#not_checked_in_employees').listview().listview('refresh');
        $('#checked_in_employees').listview().listview('refresh');
    };

    // get current user's coordinate information
    function getCoordinateInfo() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            return currentUser.get('coordinates');
        }
        else {
            return null;
        }
    };

    function validateLoginForm() {
        var email = $('#email').val();
        if (email === '') {
            // return false;
            return true; //dev purposes
        }
        else {
            return true;
        }
    }

    // validate fields on the login form
    function validateLoginForm2() {
        var email = $('#email').val(); // email from login form
        if (email === '') {
            // check if empty string
            // var loginErrorMsg = 'Please enter a valid email address';
            // $('.login_error_message').text(loginErrorMsg);
            // $('.login_error_message').show();

            // setting email for dev purposes only
            email = 'awebbx@gmail.com';
            $.post('/login', {emailAddress: email}, userLogon);
        }
        else {
            // $.post('/login', {emailAddress: email}, validateLoginCredentials);
            $.post('/login', {emailAddress: email}, userLogon);
        }
    };

    // navigate to new page, login information is required
    function actionRequireLogin(callback, userData) {
        if (userData === null || userData === '') {
            // no user data in session, log in again
            document.getElementById('email').value = '';
            $.mobile.changePage('#login_page', {allowSamePageTransition: 'true'});
        }
        else {
            currentUser = new CurrentUserModel(userData);
            if (!callback) {
                return;
            }
            else {
                callback();
            }
        }
    }

    function triggerAlert() {
        // todo - send push notifications/txt messages to all employees
        // todo - initiate all employees as not checked in
        // navigate to user dashboard page
        $.mobile.changePage('#wardenMap');
    };

    function clearAlert() {
        // show correct button
        configureAlertScreen();
        var allClearMessage = 'All Clear!';
        socket.emit('broadcast', currentUser.name, allClearMessage, currentUser.companyName);
    };

    function setStaticMap() {
        var w = $(document).width();
        var h = $(document).height();
        var z = 18;
        var s = 1;
        if (h > 104) {
            h = h - 104;
        }
        if (w > 640 || h > 640) {
            if (w % 2 == 0) {
                w = w/2;
            }
            else {
                w = (w-1)/2;
            }
            if (h % 2 == 0) {
                h = h/2;
            }
            else {
                h = (h-1)/2;
            }
            z = 17;
            s = 2;
        }
        var mapCoordinates = getCoordinateInfo();
        if (typeof(mapCoordinates) !== 'undefined' && mapCoordinates !== null) {
            if (mapCoordinates.length > 0) {
                var mapImageURL = 'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' + mapCoordinates[0].latitude + ',' + mapCoordinates[0].longitude;
                for (i=1; i<mapCoordinates.length; i++) {
                    if (i % 2 != 0) {
                        mapImageURL += '&markers=color:green|';
                    }
                    else {
                        mapImageURL += '&markers=color:blue|';
                    }
                    mapImageURL += mapCoordinates[i].latitude + ',' + mapCoordinates[i].longitude;
                }
                mapImageURL += '&zoom=' + z + '&scale=' + s + '&size=' + w + 'x' + h;
                $('#static_map_img_warden').attr('src', mapImageURL);
            }
        }
    };

    function getStatusInfo() {
        var companyStatusTxt;
        var userStatusTxt;

        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            if (currentUser.companyStatus == 1) {
                companyStatusTxt = 'Proceed to Evacuation Zone';
            }
            else if (currentUser.companyStatus == 2) {
                companyStatusTxt = 'Evacuation Drill';
            }
            else {
                companyStatusTxt = 'Safe';
            }

            if (currentUser.currentStatus == 1) {
                userStatusTxt = 'Checked In';
            }
            else if (currentUser.currentStatus == 2) {
                userStatusTxt = 'In Need of Assistance';
            }
            else {
                userStatusTxt = 'Not Checked In';
            }
        }

        $('.evacuation_status_txt').text(companyStatusTxt);
        $('.current_status_txt').text(userStatusTxt);
    };

    function broadcastMessage(message, wardensOnlyFlag) {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            var roomName = currentUser.companyName
            if (wardensOnlyFlag) {
                roomName += '-wardens';
            }
            socket.emit('broadcast', currentUser.name, message, roomName);
        }
    };

    function joinCompanyRoom() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            if (isCurrentUserWarden()) {
                socket.emit('join', currentUser.id, currentUser.companyName, true);
            }
            else {
                socket.emit('join', currentUser.id, currentUser.companyName, false);
            }
        }
    };

    function configureAlertScreen() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            if (currentUser.companyStatus == 1) {
                $('.alertScreen_mobilecontainer').hide();
                $('.all_clear_mobilecontainer').show();
            }
            else {
                $('.alertScreen_mobilecontainer').show();
                $('.all_clear_mobilecontainer').hide();
            }
        }
    }
  
    return {
        validateLoginForm: validateLoginForm,
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap,
        getStatusInfo: getStatusInfo,
        getCoordinateInfo: getCoordinateInfo,
        broadcastMessage: broadcastMessage,
        actionRequireLogin: actionRequireLogin,
        getPersonnelInfo: getPersonnelInfo,
        joinCompanyRoom: joinCompanyRoom,
        configureAlertScreen: configureAlertScreen,
        clearAlert: clearAlert
    };

})();

$(function(){

    $(document).bind("mobileinit", function(){
        $.mobile.ajaxEnabled = false;
        $.mobile.hashListeningEnabled = false;
        $.mobile.linkBindingEnabled = false;
        $.mobile.pushStateEnabled = false;
    });

    // create event for submitting login form
    // $('form').submit(function (event) {
    //     event.stopPropagation();
    //     event.preventDefault();

    //     Module.validateLoginForm();
    // });

    // navigating to alert page for the first time, create events for initiating evacuation
    $(document).on('pagecreate', '#alertScreen', function() {
        console.log('alert page');

        // $.get('/alertpage', function(userData) {
        //     Module.actionRequireLogin(null, userData);
        // });
        
    	$(document).on('click', '.confirm_alert', function(event) {
    		console.log('confirmed alert');
	        event.stopPropagation();
	        event.preventDefault();
            // $.get('/triggeralert', function(userData) {
            //     Module.actionRequireLogin(Module.triggerAlert, userData);
            // });
            Module.triggerAlert();
	    });

        $(document).on('click', '.alertScreen_mobilebutton_allClear', function(event) {
            console.log('cleared alert status for company');
            $.get('/clearalert', function(userData) {
                Module.actionRequireLogin(Module.clearAlert, userData);
            });
        });
    });

    $(document).on('pagecreate', '#wardenMap', function() {
        console.log('warden map page');

        // initialize map
        Module.setStaticMap();

        // need to resize map on device orientation change
        $(window).on("throttledresize", Module.setStaticMap);
    });

    $(document).on('pagecreate', '#wardenCompass', function() {
        console.log('warden compass page');

        // initialize compass
        Compass.initCompass();
    });

    $(document).on('pagecreate', '#employees', function() {
        console.log('warden personnel page');

        // initialize personnel lists
        Module.getPersonnelInfo();
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
                Module.broadcastMessage(message, wardensOnlyFlag);
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
            $.get('/updateStatus', {status: 1}, function(userData) {
                Module.actionRequireLogin(Module.updateStatus, userData);
            });
        });

        // user needs assistance
        $(document).on('click', '.need_assistance_button', function(event) {
            console.log('user needs assistance');
            $.get('/updateStatus', {status: 2}, function(userData) {
                Module.actionRequireLogin(Module.updateStatus, userData);
            });
        });
    });

    // page container before show events
    $(document).on("pagecontainerbeforeshow", function () {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        var activePageId = activePage[0].id;
        if (activePageId === 'alertScreen') {
            // show alert or all clear button
            Module.configureAlertScreen();
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