/*
 * JS for compass 
 */

 var Compass = (function() {

    var currentLat;
    var currentLong;
    var rendezvousCoords;

 	function initCompass() {
        getLocation();
        rendezvousCoords = Module.getCoordinateInfo();

        // Check for support for DeviceOrientation event
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

                    //testing - calibrate heading to point to evac point
                    if (typeof(currentLat) === 'undefined' || typeof(currentLong) === 'undefined') {
                        getCurrentLocation();
                    }
                    try {
                        // var heading2 = Math.atan2(Math.sin(rendezvousCoords[1].longitutde-currentLong)*Math.cos(rendezvousCoords[1].latitude), Math.cos(currentLat)*Math.sin(rendezvousCoords[1].latitude) - Math.sin(currentLat)*Math.cos(rendezvousCoords[1].latitude)*Math.cos(rendezvousCoords[1].longitutde-currentLong));
                        // heading2 = heading2 * (180/Math.PI);
                        // console.log('head to specific evacuation point coords!' + heading2);
                    }
                    catch(err) {
                        console.log('Error calculating heading to evacuation point: ' + err.message);
                    }
                    finally {
                        rotate(heading);
                    }
                }
            }, false);
        };
    };

 	function rotate(deg) {  
        $('.pointer').css('transform', 'rotate(' + (deg) + 'deg)');
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

    function getCurrentLocation() {
        if (Modernizr.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                currentLat = position.coords.latitude;
                currentLong = position.coords.longitude;
                console.log('logged current position');
            });
        }
        else {
            alert('Sorry, browser does not allow geolocation');
        }
    };

    function watchPosition(position) {
        currentLat = position.coords.latitude;
        currentLong = position.coords.longitude;

        var txtDistance;

        var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (rendezvousCoords.length > 1) {
            var evacPt = new google.maps.LatLng(rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

            var distance = google.maps.geometry.spherical.computeDistanceBetween(currentLocation, evacPt);
            distance = distance * 3.28084; // convert from meters to feet
            if (distance > 2640) {
                distance = distance / 5280;
                distance = Math.round( distance * 10 ) / 10;
                txtDistance = distance + ' mi';
            }
            else {
                if (distance < 25) {
                    // automatic checkin occurs
                    Module.updateStatus(1);
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