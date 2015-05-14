/*
 * JS for app 
 */

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
    var employees = [];

    // user model
    var CurrentUserModel = function(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.wardenFlag = userData.coordinatorFlag;
        this.companyId = userData.companyId;
        this.companyName = userData.companyName;
        this.companyStatus = userData.companyStatus; // 0 = normal, 1 = alert, 2 = drill
        this.currentStatus = userData.status; // 0 = normal/not checked in, 1 = checked in, 2 = in need of assistance
        this.wardenId = userData.wardenId;
        this.mapCoordinates = userData.coordinates;
    };

    // employee model
    var EmployeeModel = function(employeeData) {
        this.id = employeeData.id;
        this.name = employeeData.name;
        this.status = employeeData.status;
        this.phoneNo = employeeData.phoneNo;
    };

    // get employee information from the database and load the employees model
    function getPersonnelInfo() {
        $.get('/employees', {coordinatorId: currentUser.id}, function(personnelData) {
            employees = personnelData;
            updatePersonnelInfo();
        });
    };

    // update lists of employees with their current status, for evac coordinator only
    function updatePersonnelInfo() {
        var needAssistanceEmployees = [];
        var notCheckedInEmployees = [];
        var checkedInEmployees = [];
        var content;

        for (i=0; i<employees.length; i++) {
            // content = '<a href="/employees/' + employees[i].id + '">' + employees[i].name + '</a>';
            switch (employees[i].status) {
                case 1:
                    // checkedInEmployees.push($('<li>', {html: content}));
                    checkedInEmployees.push($('<li>', {text: employees[i].name}));
                    break;
                case 2:
                    // needAssistanceEmployees.push($('<li>', {html: content}));
                    needAssistanceEmployees.push($('<li>', {text: employees[i].name}));
                    break;
                default:
                    // notCheckedInEmployees.push($('<li>', {html: content}));
                    notCheckedInEmployees.push($('<li>', {text: employees[i].name}));
                    break;
            }
        }

        $('#need_assistance_counter').text(needAssistanceEmployees.length);
        $('#not_checked_in_counter').text(notCheckedInEmployees.length);
        $('#checked_in_counter').text(checkedInEmployees.length);

        $('#need_assistance_employees').empty();
        $('#not_checked_in_employees').empty();
        $('#checked_in_employees').empty();

        $('#need_assistance_employees').append(needAssistanceEmployees);
        $('#not_checked_in_employees').append(notCheckedInEmployees);
        $('#checked_in_employees').append(checkedInEmployees);

        $('#need_assistance_employees').listview().listview('refresh');
        $('#not_checked_in_employees').listview().listview('refresh');
        $('#checked_in_employees').listview().listview('refresh');
    };

    // get current user's coordinate information
    function getCoordinateInfo() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            return currentUser.mapCoordinates;
        }
        else {
            return null;
        }
    };

    // verify user credentials after submitting login form
    function validateLoginCredentials(userData) {
        if (userData === null || userData === '') {
            // user not found - show error message
            var loginErrorMsg = 'Invalid Login Credentials: User not found';
            $('.login_error_message').text(loginErrorMsg);
            $('.login_error_message').show();
        }
        else {
            currentUser = new CurrentUserModel(userData);

            if (isCurrentUserWarden()) {
                if (currentUser.companyStatus === 0) {
                    // successful login for warden where the currently is no evacuation, navigate to alert page
                    $.mobile.changePage('#alertScreen');
                }
                else {
                    // successful login for warden where company evacuation is already in process, navigate to warden dashboard page
                    $.mobile.changePage('#userDashboard');
                }
            }
            else {
                // successful login for employee, navigate to employee dashboard page
                $.mobile.changePage('#userDashboard');
            }
        }
        $('form').trigger('reset');
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

    // determine if user is evac coordinator
    function isCurrentUserWarden() {
        if (typeof(currentUser) !== 'undefined' || currentUser !== null) {
            if (currentUser.wardenFlag === 1 || currentUser.wardenFlag === '1') {
                return true;
            }
        }
        return false;
    };

    function triggerAlert() {
        // todo - send push notifications/txt messages to all employees
        // todo - initiate all employees as not checked in
        // navigate to user dashboard page
        $.mobile.changePage('#userDashboard');
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

    function updateStatus() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            // 0 = normal/not checked in, 1 = checked in, 2 = need assistance
            socket.emit('update_status', currentUser.id, currentUser.companyName, currentUser.currentStatus);
            getStatusInfo();
        }
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
        validateLoginCredentials: validateLoginCredentials,
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap,
        isCurrentUserWarden: isCurrentUserWarden,
        updateStatus: updateStatus,
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
    // create event for submitting login form
    $('form').submit(function (event) {
        event.stopPropagation();
        event.preventDefault();
        var email = $('#email').val(); // email from login form
        if (email === '') {
            // setting email for dev purposes only
            email = 'awebbx@gmail.com';
        }
        $.post('/login', {emailAddress: email}, Module.validateLoginCredentials);
    });

    // navigating to alert page for the first time, create events for initiating evacuation
    $(document).on('pagecreate', '#alertScreen', function() {
        console.log('alert page');

        $.get('/alertpage', function(userData) {
            Module.actionRequireLogin(null, userData);
        });
        
    	$(document).on('click', '.confirm_alert', function(event) {
    		console.log('confirmed alert');
	        event.stopPropagation();
	        event.preventDefault();
            $.get('/triggeralert', function(userData) {
                Module.actionRequireLogin(Module.triggerAlert, userData);
            });
	    });

        $(document).on('click', '.alertScreen_mobilebutton_allClear', function(event) {
            console.log('cleared alert status for company');
            $.get('/clearalert', function(userData) {
                Module.actionRequireLogin(Module.clearAlert, userData);
            });
        });
    });

    // navigating to main dashboard page, initialize events for using the navbar
    $(document).on('pagecreate', '#userDashboard', function() {
        console.log('user dashboard');

        function dashboardCallback() {
            // create/join socket communication room for company
            Module.joinCompanyRoom();

            // initialize map
            Module.setStaticMap();

            // initialize compass
            Compass.initCompass();

            // get personnel data if warden
            if (Module.isCurrentUserWarden()) {
                Module.getPersonnelInfo();
            }
            else {
                Module.getStatusInfo();
                $('.dashboard_home_button').hide();
            }
        }

        $.get('/dashboard', function(userData) {
            //initialize user
            Module.actionRequireLogin(dashboardCallback, userData);

            // show the correct navbar
            if (userData.coordinatorFlag == 1) {
                $('#employee_navbar').hide();
                $('#warden_navbar').show();
            }
            else {
                $('#warden_navbar').hide();
                $('#employee_navbar').show();
            }
        });

        // need to resize map on device orientation change
        $(window).on("throttledresize", Module.setStaticMap);

        // user clicks on the navbar, hide the currently selected tab content and show the content for the newly selected tab
        $(document).on('click', '.ui-navbar a', function(event) {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(this).attr('data-href') + '_content').show();
        });

        // sends broadcast, show map tab, todo - should show last visited tab
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
            $('#' + 'warden_map_content').show();
        });

        // cancels broadcast, show map tab, todo - should show last visited tab
        $(document).on('click', '.cancel_broadcast', function(event) {
            console.log('broadcast canceled');
            document.getElementById('textarea').value = '';
            $('#' + 'warden_map_content').show();
        });

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
        else if (activePageId === 'userDashboard') {
            console.log('user dashboard beforeshow event');
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