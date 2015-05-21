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

    
    var router;
    var session;


    function validateLoginForm() {
        var email = $('#email').val();
        if (email === '') {
            // return false;
            return true; //dev purposes
        }
        else {
            return true;
        }
    };

    function routeLogin() {
        if (Module.session.user) {
            if (Module.session.user.get('adminRole') === 'warden') {
                // todo - route to dashboard if evacuation is already in progress for company
                Module.router.navigate('evacuation', {trigger: true});
            }
            else {
                Module.router.navigate('dashboard', {trigger: true});
            }
        }
    };

    function triggerAlert() {
        console.log('triggering alert');
        // todo - send push notifications/txt messages to all employees
        // todo - initiate all employees as not checked in

        // navigate to user dashboard page
        Module.router.navigate('dashboard', {trigger: true});
    };
    


    

    

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

    // return this;
  
    return {
        router: router,
        session: session,
        validateLoginForm: validateLoginForm,
        routeLogin,
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
// });