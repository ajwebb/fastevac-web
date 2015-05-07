/*
 * JS for compass 
 */

 var Compass = (function() {

    var rendezvousCoords;

 	function initCompass() {
        rendezvousCoords = Module.getCoordinateInfo();
        getLocation();

        // Check for support for DeviceOrientation event
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", function (e) {
                var currentLat;
                var currentLong;
                var heading = null;
                if (e.alpha !== null) {
                    if (e.webkitCompassHeading) {
                        heading = 360 - e.webkitCompassHeading;
                    }
                    else {
                        heading = e.alpha;
                    }

                    // rotate(heading);
                }
            }, false);
        };
    };

 	function rotate(deg) {  
        $('.pointer').css('transform', 'rotate(' + (deg) + 'deg)');
    };

    function getHeadingFromCoordinates(fromLat, fromLon, toLat, toLon) {
        var fLat = (fromLat/180)*Math.PI;
        var fLng = (fromLon/180)*Math.PI;
        var tLat = (toLat/180)*Math.PI;
        var tLng = (toLon/180)*Math.PI;

        var testHeading = Math.atan2(Math.sin(fLng-tLng)*Math.cos(tLat), Math.cos(fLat)*Math.sin(tLat)-Math.sin(fLat)*Math.cos(tLat)*Math.cos(fLng-tLng));
        testHeading = testHeading * (180/Math.PI);

        console.log('testing heading to specific evacuation point coords! ' + testHeading);

        rotate(testHeading);
    };

    var geoOptions = {
        enableHighAccuracy: true, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    function geoError() {
        alert("Sorry, no position available.");
    };

    function getLocation() {
        if (Modernizr.geolocation) {
            navigator.geolocation.watchPosition(watchPosition, geoError, geoOptions);
        }
        else {
            alert('Sorry, browser does not allow geolocation');
        }
    };

    function watchPosition(position) {
        var txtDistance;

        var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (rendezvousCoords.length > 1) {
            var evacPt = new google.maps.LatLng(rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

            // testing custom heading towards evac pt
            getHeadingFromCoordinates(position.coords.latitude, position.coords.longitude, rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

            var distance = google.maps.geometry.spherical.computeDistanceBetween(currentLocation, evacPt);
            distance = distance * 3.28084; // convert from meters to feet
            if (distance > 2640) {
                distance = distance / 5280;
                distance = Math.round( distance * 10 ) / 10;
                txtDistance = distance + ' mi';
            }
            else {
                if (distance < 25) {
                    // automatic checkin occurs within 25 feet
                    $.get('/updateStatus', {status: 1}, Module.updateStatus);
                };
                distance = Math.round(distance);
                txtDistance = distance + ' ft';
            }
        }
        else {
            txtDistance = 'No evacuation point available';
        }
        $('.compass_distance').text(txtDistance);
    };

    return {
    	initCompass: initCompass
    };

 })();