/*
 * JS for app 
 */

var Module = (function () {

    var id, name, wardenFlag, status, companyId, companyName, companyStatus;
    var evacCoordinates = [];
    var employees = [];

    // employee object for warden
    function Employee(id, name, status) {
        this.id = id;
        this.name = name;
        this.status = status;
    };

    var getUserDetails = function () {
        // private, todo - call database to get details
        id = 1;
        name = 'Adam Webb';
        wardenFlag = 'Y';
        status = 0; // 0 = normal
        companyId = 1;
        companyName = 'FastEvac';
        companyStatus = 0; // 0 = normal
        evacCoordinates[0] = 33.750125;
        evacCoordinates[1] = -117.837933;
    };

    var validateLoginCredentials = function () {
        var validLogin = false;

        // todo - get user details from db and authenticate properly
        getUserDetails();
        validLogin = true;

        if (validLogin) {
            if (wardenFlag == 'Y') {
                // todo - initiate employee lists for evac coordinator
                $.mobile.changePage('#alertScreen');
            }
            else {
                //$.mobile.changePage('employeeMap');
            }
        }
        else {
            alert('Invalid Login Credentials');
        }

    };

    var triggerAlert = function () {
        //todo - initiate alert for all employees
        companyStatus = 1; // 1 = alert
        status = 2; //  2 = not checked in
        $.mobile.changePage('#wardenDashboard');
    };

    var setStaticMap = function() {
        var w = $(document).width();
        var h = $(document).height();
        if (h > 104) {
            h = h - 104;
        }
        else {
            h = 0;
        }
        var mapImageURL = 'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' + evacCoordinates[0] + ',' + evacCoordinates[1] + '&zoom=19&size=' + w + 'x' + h;
        $('#static_map_img_warden').attr('src', mapImageURL);
    };

    var getEvacCoordinates = function() {
        return evacCoordinates;
    }
  
    return {
        getEvacCoordinates: getEvacCoordinates,
        validateLoginCredentials: validateLoginCredentials,
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap
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
    $(document).on('pagecreate', '#wardenDashboard', function(){
        console.log('warden dashboard');

        // define google maps img src, todo - add logic for image tailored to specific user
        Module.setStaticMap();

        // BEGIN testing compass
        Compass.initCompass();
        // END testing compass

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

        $(document).on('click', '.warden_status', function(event) {
            console.log('navigated to broadcast');
        });
    });

    // BEGIN TESTING SECTION
    // END TESTING SECTION
});