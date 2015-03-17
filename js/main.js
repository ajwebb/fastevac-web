/*
 * JS for app 
 */

function ValidateLoginCredentials() {
    validLogin = false;
    isWarden = false;

    //todo - authenticate properly
    validLogin = true;
    isWarden = true;

    if (validLogin) {
        if (isWarden) {
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


function TriggerAlert() {
    //todo - initiate alert for all employees
    //todo - set current status for employee group to alert
     $.mobile.changePage('#wardenDashboard');
};


$(function(){
    // create event for submitting login form
    $("form").submit(function (event) {
        event.stopPropagation();
        event.preventDefault();
        ValidateLoginCredentials();
    });

    // navigating to alert page for the first time, create events for initiating evacuation
    $(document).on('pagecreate', '#alertScreen', function() {
        console.log('alert page');
    	$(document).on('click', '.confirm_alert', function(event) {
    		console.log('confirmed alert');
	        event.stopPropagation();
	        event.preventDefault();
            TriggerAlert();
	    });
    });

    // navigating to main warden page, initialize events for using the navbar
    $(document).on('pagecreate', '#wardenDashboard', function(){
        console.log('warden dashboard');

        // user clicks on the navbar, hide the currently selected tab content and show the content for the newly selected tab
        $(document).on('click', '.ui-navbar a', function(event)
        {
            console.log('navbar menu item clicked');
            $('.content_div').hide();
            $('#' + $(this).attr('data-href')).show();
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