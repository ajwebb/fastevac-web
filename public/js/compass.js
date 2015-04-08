/*
 * JS for compass 
 */

 var Compass = (function() {

    var currentLat;
    var currentLong;
    var rendezvousCoords;

 	var initCompass = function() {
        getLocation();
        rendezvousCoords = JSON.parse(sessionStorage['mapCoords']);

        //for screenshot purpose only
        rotate(320);

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

                    //console.log('initial compass heading: '+ heading);

                    //todo - calibrate heading to point to evac point
                    //testing
                    if (typeof(currentLat) !== 'undefined' && typeof(currentLong) !== 'undefined') {
                        var heading2 = Math.atan2(Math.sin(rendezvousCoords[1].longitutde-currentLong)*Math.cos(rendezvousCoords[1].latitude), Math.cos(currentLat)*Math.sin(rendezvousCoords[1].latitude) - Math.sin(currentLat)*Math.cos(rendezvousCoords[1].latitude)*Math.cos(rendezvousCoords[1].longitutde-currentLong));
                        heading2 = heading2 * (180/Math.PI);
                        console.log('head to specific coords!' + heading2);
                    }

                    rotate(heading);
                }
            }, false);
        };
    };

 	var rotate = function (deg) {  
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
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(watchPosition, geoError, geoOptions);
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
            distance = distance * 3.28084; //convert from meters to feet
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
        //screenshot purposes only
        $('.compass_distance').text('120 ft');
    };

    return {
    	initCompass: initCompass
    };

 })();