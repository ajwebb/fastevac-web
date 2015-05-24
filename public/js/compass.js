/*
 * JS for compass 
 */

 var Compass = (function() {

    // var currentLat;
    // var currentLong;
    // var rendezvousCoords = [{"latitude": 33.654320, "longitude": -117.811969}, {"latitude": 33.654320, "longitude": -117.811969}];

 	var initCompass = function() {
        // getLocation();
        $('.compass_distance').text('120 feet');

        //Check for support for DeviceOrientation event
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", function (e) {
                var heading = null;
                if (e.alpha !== null) {
                    if (e.webkitCompassHeading) {
                        heading = 360 - e.webkitCompassHeading;
                    }
                    else {
                        heading = e.alpha;
                    }

                    rotate(heading);
                }
            }, false);
        };
    };

 	var rotate = function (deg) {  
        $('.pointer').css('transform', 'rotate(' + (deg) + 'deg)');
    };

    // var geoOptions = {
    //     enableHighAccuracy: true, 
    //     maximumAge        : 30000, 
    //     timeout           : 27000
    // };

    // function geoError() {
    //     alert("Sorry, no position available.");
    // };

    // function getLocation() {
    //     if (navigator.geolocation) {
    //         navigator.geolocation.watchPosition(watchPosition, geoError, geoOptions);
    //     }
    //     else {
    //         alert('Sorry, browser does not allow geolocation');
    //     }
    // };

    // function watchPosition(position) {
    //     currentLat = position.coords.latitude;
    //     currentLong = position.coords.longitude;

    //     var txtDistance;

    //     var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    //     if (rendezvousCoords.length > 1) {
    //         var evacPt = new google.maps.LatLng(rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

    //         var distance = google.maps.geometry.spherical.computeDistanceBetween(currentLocation, evacPt);
    //         distance = distance * 3.28084; //convert from meters to feet
    //         if (distance > 2640) {
    //             distance = distance / 5280;
    //             distance = Math.round( distance * 10 ) / 10;
    //             txtDistance = distance + ' mi';
    //         }
    //         else {
    //             if (distance < 25) {
    //                 // automatic checkin occurs
    //                 Module.updateStatus(1);
    //             };
    //             distance = Math.round(distance);
    //             txtDistance = distance + ' ft';
    //         }
    //     }
    //     else {
    //         txtDistance = 'No evacuation point available';
    //     }
    //     $('.compass_distance').text(txtDistance);
    // };

    return {
    	initCompass: initCompass
    };

 })();