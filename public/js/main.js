/*
 * JS for app 
 */

var Module = (function () {

    // json for list of employees
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
                "latitude": 33.654320,
                "longitude": -117.811969
            },
            {
                "latitude": 33.654320,
                "longitude": -117.811969
            }
        ]
    };

    // get all employees current info and status and update the ui
    function updatePersonnelInfo() {
        var employees = jsonData.employees;

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

    var triggerAlert = function () {
        $.mobile.changePage('#warden_map');
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
        var mapCoordinates = currentUserJsonData.coordinates;
        var mapImageURL = 'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' + mapCoordinates[0].latitude + ',' + mapCoordinates[0].longitude + '&markers=color:green|' + mapCoordinates[1].latitude + ',' + mapCoordinates[1].longitude + '&zoom=' + z + '&scale=' + s + '&size=' + w + 'x' + h;
        $('#static_map_img_warden').attr('src', mapImageURL);
    };
  
    return {
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap,
        updatePersonnelInfo: updatePersonnelInfo
    };

})();

$(function(){

    $(document).on('click', '.confirm_alert', function(event) {
        console.log('confirmed alert');
        event.stopPropagation();
        event.preventDefault();
        Module.triggerAlert();
    });

    // navigating to map page, initialize map and broadcast events
    $(document).on('pagecreate', '#warden_map', function(){
        console.log('map page');

        // initialize map
        Module.setStaticMap();

        // resize map on device orientation change
        $( window ).on( "throttledresize", Module.setStaticMap );
    });

    $(document).on('pagecreate', '#warden_compass', function(){
        console.log('compass page');

        // initialize compass
        Compass.initCompass();
    });

    $(document).on('pagecreate', '#warden_personnel', function(){
        console.log('personnel page');

        // initialize personnel lists
        Module.updatePersonnelInfo();
    });

    $(document).on('pagecreate', '#broadcast_popup', function(){
        console.log('broadcast dialog');

        // send broadcast
        $(document).on('click', '.send_message', function(event)
        {
            console.log('broadcast sent');
            $('#' + 'warden_map_content').show();
        });

        // cancel broadcast
        $(document).on('click', '.cancel_broadcast', function(event)
        {
            console.log('broadcast canceled');
            $('#' + 'warden_map_content').show();
        });
    });
});