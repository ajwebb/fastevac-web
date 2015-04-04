/*
 * JS for app 
 */

var Module = (function () {

    var id, name, currentStatus, companyId, companyName, companyStatus;
    var wardenFlag = false;
    var mapCoordinates = [];

    // json for list of employees, todo - get data from database and parse as json object
    var jsonData = {
        "employees":
        [
            {
                "id": 1,
                "name": "Monica Ruzich",
                "status": 2
            },
            {
                "id": 6,
                "name": "Daniel Lifschitz",
                "status": 0
            },
            {
                "id": 2,
                "name": "Amy Estey",
                "status": 0
            },
            {
                "id": 3,
                "name": "Brando McCune",
                "status": 1
            },
            {
                "id": 4,
                "name": "Scott Huthmacher",
                "status": 1
            },
            {
                "id": 5,
                "name": "Adam Webb",
                "status": 1
            }
        ]
    };

    // json data for current user
    var currentUserJsonData = {
        "id": 111111,
        "name": "Adam Webb",
        "status": 0,
        "wardenFlag": true,
        "companyId": 111111,
        "companyName": "FastEvac",
        "companyStatus": 0,
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

    // get all employees current info and status, update lists, for evac coordinator only
    function updatePersonnelInfo() {
        var employees = jsonData.employees;

        var needAssistanceInner = '';
        var notCheckedInInner = '';
        var checkedInInner = '';

        var needAssistanceCounter = 0;
        var notCheckedInCounter = 0;
        var checkedInCounter = 0;

        for (i=0; i<employees.length; i++) {
            switch (employees[i].status) {
                case 1:
                    checkedInInner += '<li><a href="#">' + employees[i].name + '</a></li>';
                    checkedInCounter++;
                    break;
                case 2:
                    needAssistanceInner += '<li><a href="#">' + employees[i].name + '</a></li>';
                    needAssistanceCounter++;
                    break;
                default:
                    notCheckedInInner += '<li><a href="#">' + employees[i].name + '</a></li>';
                    notCheckedInCounter++;
                    break;
            }
        };

        $('#need_assistance_counter').text(needAssistanceCounter);
        $('#not_checked_in_counter').text(notCheckedInCounter);
        $('#checked_in_counter').text(checkedInCounter);

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
        wardenFlag = sessionStorage.getItem('wardenFlag');
        if (typeof wardenFlag !== 'undefined') {
            if (wardenFlag == true || wardenFlag === 'true') {
                return true;
            }
        }
        return false;
    }

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
        };

        sessionStorage.setItem('currentStatus', currentStatus);
        sessionStorage.setItem('mapCoords', JSON.stringify(mapCoordinates));
        sessionStorage.setItem('wardenFlag', wardenFlag);
    };

    var validateLoginCredentials = function () {
        var validLogin = false;

        // todo - get user details from db and authenticate properly
        getUserDetails();
        validLogin = true;

        if (validLogin) {
            if (wardenFlag) {
                // todo - initiate employee lists for evac coordinator
                $.mobile.changePage('#alertScreen');
            }
            else {
                $.mobile.changePage('#userDashboard');
            }
        }
        else {
            alert('Invalid Login Credentials');
        }

    };

    var triggerAlert = function () {
        //todo - initiate alert for all employees (send push notifications or messages out)
        companyStatus = 1; // 1 = alert
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
        mapCoordinates = JSON.parse(sessionStorage['mapCoords']);
        var mapImageURL = 'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' + mapCoordinates[0].latitude + ',' + mapCoordinates[0].longitude + '&markers=color:green|' + mapCoordinates[1].latitude + ',' + mapCoordinates[1].longitude + '&zoom=' + z + '&scale=' + s + '&size=' + w + 'x' + h;
        $('#static_map_img_warden').attr('src', mapImageURL);
    };

    var getStatusInfo = function() {
        var companyStatusTxt;
        var userStatusTxt;

        if (companyStatus == 1) {
            companyStatusTxt = 'Evacuate Facility';
        }
        else if (companyStatus == 2) {
            companyStatusTxt = 'Evacuate Facility (Drill)';
        }
        else {
            companyStatusTxt = 'Safe';
        }

        currentStatus = sessionStorage.getItem('currentStatus');
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
        sessionStorage.setItem('currentStatus', currentStatus);
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
        getStatusInfo: getStatusInfo
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

    // navigating to main warden page, initialize events for using the navbar
    $(document).on('pagecreate', '#userDashboard', function(){
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
        $( window ).on( "throttledresize", Module.setStaticMap );

        // initialize compass
        Compass.initCompass();

        // user clicks on the navbar, hide the currently selected tab content and show the content for the newly selected tab
        $(document).on('click', '.ui-navbar a', function(event)
        {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(this).attr('data-href') + '_content').show();
        });

        // specific pages click events - nothing specific implemented as of now
        $(document).on('click', '.warden_map', function(event) {
            console.log('navigated to map');
        });

        $(document).on('click', '.warden_compass', function(event) {
            console.log('navigated to compass');
        });

        $(document).on('click', '.warden_personnel', function(event) {
            console.log('navigated to personnel');
        });

        $(document).on('click', '.employee_status', function(event) {
            console.log('navigated to employee status page');
        });

        // sends broadcast, show map tab, todo - should show last visited tab
        $(document).on('click', '.send_message', function(event)
        {
            // todo - send message to employees
            console.log('broadcast sent');
            $('#' + 'warden_map_content').show();
        });

        // cancels broadcast, show map tab, todo - should show last visited tab
        $(document).on('click', '.cancel_broadcast', function(event)
        {
            console.log('broadcast canceled');
            $('#' + 'warden_map_content').show();
        });

        // user checks in
        $(document).on('click', '.check_in_button', function(event)
        {
            console.log('user checking in');
            Module.updateStatus(1);
        });

        // user needs assistance
        $(document).on('click', '.need_assistance_button', function(event)
        {
            console.log('user needs assistance');
            Module.updateStatus(2);
        });
    });

    // click broadcast message popup, focus textarea
    $(document).on('pageshow', '#broadcast_popup', function(){
        console.log('broadcast message');
        $('#textarea').focus();
    });

    // BEGIN TESTING SECTION
    // END TESTING SECTION
});