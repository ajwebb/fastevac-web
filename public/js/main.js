/*
 * JS for app 
 */

var Module = (function () {

    var socket = io.connect();

    var id, name, currentStatus, companyId, companyName, companyStatus, wardenFlag;
    var mapCoordinates = [];
    var employees = [];
    var employeeHash = {};

    // json for list of employees, todo - get data from database and parse as json object
    var jsonData = {
        "employees":
        [
            {
                "id": 1,
                "name": "Monica Ruzich",
                "status": 2,
                "phoneNo": 5555555
            },
            {
                "id": 6,
                "name": "Daniel Lifschitz",
                "status": 0,
                "phoneNo": 5555555
            },
            {
                "id": 2,
                "name": "Amy Estey",
                "status": 0,
                "phoneNo": 5555555
            },
            {
                "id": 3,
                "name": "Brando McCune",
                "status": 1,
                "phoneNo": 5555555
            },
            {
                "id": 4,
                "name": "Scott Huthmacher",
                "status": 1,
                "phoneNo": 5555555
            },
            {
                "id": 5,
                "name": "Adam Webb",
                "status": 1,
                "phoneNo": 5555555
            }
        ]
    };

    // json data for current user
    var currentUserJsonData = {
        "id": 5,
        "name": "Adam Webb",
        "status": 0,
        "wardenFlag": 'true',
        "companyId": 111111,
        "companyName": "FastEvac",
        "companyStatus": 1,
        "coordinates":
        [
            {
                "latitude": 33.750125,
                "longitude": -117.837933
            },
            {
                "latitude": 33.750411,
                "longitude": -117.838235
            }
        ]
    };

    socket.on('updateStatus', function() {
        console.log('updating user status');
    });

    function getEmployeeData() {
        employees = jsonData.employees;
        employees.forEach(function(employee) {
            employeeHash[employee.id] = employee;
        });
    };

    // get all employees current info and status, update lists, for evac coordinator only
    function updatePersonnelInfo() {
        if (employees.length === 0) {
            getEmployeeData();
        }

        var needAssistanceEmployees = [];
        var notCheckedInEmployees = [];
        var checkedInEmployees = [];

        var needAssistanceInner = '';
        var notCheckedInInner = '';
        var checkedInInner = '';

        for (i=0; i<employees.length; i++) {
            switch (employees[i].status) {
                case 1:
                    checkedInEmployees.push(employees[i]);
                    break;
                case 2:
                    needAssistanceEmployees.push(employees[i]);
                    break;
                default:
                    notCheckedInEmployees.push(employees[i]);
                    break;
            }
        };

        for (i=0; i<checkedInEmployees.length; i++) {
            checkedInInner += '<li><a href="#">' + checkedInEmployees[i].name + '</a></li>';
        };
        for (i=0; i<needAssistanceEmployees.length; i++) {
            needAssistanceInner += '<li><a href="#">' + needAssistanceEmployees[i].name + '</a></li>';
        };
        for (i=0; i<notCheckedInEmployees.length; i++) {
            notCheckedInInner += '<li><a href="#">' + notCheckedInEmployees[i].name + '</a></li>';
        };

        $('#need_assistance_counter').text(needAssistanceEmployees.length);
        $('#not_checked_in_counter').text(notCheckedInEmployees.length);
        $('#checked_in_counter').text(checkedInEmployees.length);

        $('#need_assistance_employees').html(needAssistanceInner);
        $('#not_checked_in_employees').html(notCheckedInInner);
        $('#checked_in_employees').html(checkedInInner);
        $('#need_assistance_employees').listview('refresh');
        $('#not_checked_in_employees').listview('refresh');
        $('#checked_in_employees').listview('refresh');
    };

    // map coordinates object
    function Coordinates(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    };

    // determine if user is evac coordinator
    function isCurrentUserWarden() {
        if (Modernizr.sessionstorage) {
            wardenFlag = sessionStorage.getItem('wardenFlag');
        }
        else if (typeof(wardenFlag) === 'undefined') {
            getUserDetails(); // could just query wardenFlag
        }
        if (wardenFlag === 'true') {
            return true;
        }
        else {
            return false;
        }
    };

    // get current user's coordinate information
    function getCoordinateInfo() {
        if (Modernizr.sessionstorage) {
            return JSON.parse(sessionStorage['mapCoords']);
        }
        else {
            if ((typeof(mapCoordinates) === 'undefined') || mapCoordinates.length == 0) {
                getUserDetails(); // could just query coordinates info
            }
            return mapCoordinates;
        }
    };

    var getUserDetails = function () {
        // get data from json object, todo - create json object from data in database
        id = currentUserJsonData.id;
        name = currentUserJsonData.name;
        wardenFlag = currentUserJsonData.wardenFlag;
        companyId = currentUserJsonData.companyId;
        companyName = currentUserJsonData.companyName;
        companyStatus = currentUserJsonData.companyStatus; // 0 = normal, 1 = alert, 2 = drill
        currentStatus = currentUserJsonData.status;

        // get map coordinates for facility/evac pts, facility being first, and evac points following
        for (i=0; i<currentUserJsonData.coordinates.length; i++) {
            var coords = new Coordinates(currentUserJsonData.coordinates[i].latitude, currentUserJsonData.coordinates[i].longitude)
            mapCoordinates.push(coords);
        }

        if (Modernizr.sessionstorage) {
            sessionStorage.setItem('mapCoords', JSON.stringify(mapCoordinates));
            sessionStorage.setItem('wardenFlag', wardenFlag);
        }
    };

    var validateLoginCredentials = function () {
        var validLogin = false;

        // todo - get user details from db and authenticate properly
        getUserDetails();
        validLogin = true;

        if (validLogin) {
            if (isCurrentUserWarden()) {
                $.mobile.changePage('#alertScreen');
            }
            else {
                // join socket room of the company
                socket.emit('join', companyName);
                $.mobile.changePage('#userDashboard');
            }
        }
        else {
            alert('Invalid Login Credentials');
        }

    };

    var triggerAlert = function () {
        // todo - send push notifications or messages to all employees
        // todo - also initiate all employees as not checked in
        companyStatus = 1; // 1 = alert

        // create socket room for company
        if (typeof(companyName) === 'undefined') {
            getUserDetails();
        }
        socket.emit('create', companyName);

        $.mobile.changePage('#userDashboard');
    };

    var setStaticMap = function() {
        var w = $(document).width();
        var h = $(document).height();
        var z = 19;
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
            z = 18;
            s = 2;
        }
        mapCoordinates = getCoordinateInfo();
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
    };

    var getStatusInfo = function() {
        var companyStatusTxt;
        var userStatusTxt;

        if (companyStatus == 1) {
            companyStatusTxt = 'Proceed to Evacuation Zone';
        }
        else if (companyStatus == 2) {
            companyStatusTxt = 'Evacuation Drill';
        }
        else {
            companyStatusTxt = 'Safe';
        }

        if (currentStatus == 1) {
            userStatusTxt = 'Checked In';
        }
        else if (currentStatus == 2) {
            userStatusTxt = 'In Need of Assistance';
        }
        else {
            userStatusTxt = 'Not Checked In';
        }

        $('.evacuation_status_txt').text(companyStatusTxt);
        $('.current_status_txt').text(userStatusTxt);
    };

    var updateStatus = function(updatedStatus) {
        // 0 = normal/not checked in, 1 = checked in, 2 = need assistance
        currentStatus = updatedStatus;
        // todo - update db with updated status

        getStatusInfo();
    };
  
    return {
        validateLoginCredentials: validateLoginCredentials,
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap,
        isCurrentUserWarden: isCurrentUserWarden,
        updatePersonnelInfo: updatePersonnelInfo,
        updateStatus: updateStatus,
        getStatusInfo: getStatusInfo,
        getCoordinateInfo: getCoordinateInfo
    };

})();

$(function(){
    // create event for submitting login form
    $("form").submit(function (event) {
        event.stopPropagation();
        event.preventDefault();
        Module.validateLoginCredentials();
    });

    // navigating to alert page for the first time, create events for initiating evacuation
    $(document).on('pagecreate', '#alertScreen', function() {
        console.log('alert page');
    	$(document).on('click', '.confirm_alert', function(event) {
    		console.log('confirmed alert');
	        event.stopPropagation();
	        event.preventDefault();
            Module.triggerAlert();
	    });
    });

    // navigating to main dashboard page, initialize events for using the navbar
    $(document).on('pagecreate', '#userDashboard', function() {
        console.log('user dashboard');

        // show correct navbar depending if warden or regular employee
        if (Module.isCurrentUserWarden()) {
            $('#employee_navbar').hide();
            $('#warden_navbar').show();

            // add employees to corresponding lists on personnel page
            Module.updatePersonnelInfo();
        }
        else {
            $('#warden_navbar').hide();
            $('#employee_navbar').show();

            // set current evacuation procedure and user status
            Module.getStatusInfo();
        }

        Module.setStaticMap();

        // need to resize map on device orientation change
        $(window).on("throttledresize", Module.setStaticMap);

        // initialize compass
        Compass.initCompass();

        // user clicks on the navbar, hide the currently selected tab content and show the content for the newly selected tab
        $(document).on('click', '.ui-navbar a', function(event) {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(this).attr('data-href') + '_content').show();
        });

        // user clicks on warden status tab, broadcast dialog pops up
        $(document).on('click', '.warden_status', function(event) {
            console.log('broadcast clicked');
            event.stopPropagation();
        });

        // sends broadcast, show map tab, todo - should show last visited tab
        $(document).on('click', '.send_message', function(event) {
            // todo - send message to employees
            console.log('broadcast sent');
            $('#' + 'warden_map_content').show();
        });

        // cancels broadcast, show map tab, todo - should show last visited tab
        $(document).on('click', '.cancel_broadcast', function(event) {
            console.log('broadcast canceled');
            $('#' + 'warden_map_content').show();
        });

        // user checks in
        $(document).on('click', '.check_in_button', function(event) {
            console.log('user checking in');
            Module.updateStatus(1);
        });

        // user needs assistance
        $(document).on('click', '.need_assistance_button', function(event) {
            console.log('user needs assistance');
            Module.updateStatus(2);
        });
    });

    // click broadcast message popup, focus textarea
    $(document).on('pageshow', '#broadcast_popup', function() {
        $('#textarea').focus();
    });
});