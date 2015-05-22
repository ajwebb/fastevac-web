/*
 * JS for compass 
 */

 var Compass = (function() {

    var rendezvousCoords;
    var coordsHeading;
    var watchId;

 	function initCompass() {
        var calcDistanceTxt = 'Calculating distance...';
        $('.compass_distance').text(calcDistanceTxt);

        rendezvousCoords = Module.session.user.get('coordinates');
        getLocation();

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

                    if (!coordsHeading) {
                        console.log('Unable to determine heading to coordinates of rendezvous point');
                    }
                    else {
                        console.log('heading to coordinates: ' + coordsHeading);
                        var evacHeading = heading - coordsHeading;
                        rotate(evacHeading);
                    }
                }
            }, false);
        };
    };

    // rotate compass
 	function rotate(deg) {  
        $('.pointer').css('transform', 'rotate(' + (deg) + 'deg)');
    };

    // calculate correct heading towards coordinates from current location
    function getHeadingFromCoordinates(fromLat, fromLon, toLat, toLon) {
        var fLat = (fromLat/180)*Math.PI;
        var fLng = (fromLon/180)*Math.PI;
        var tLat = (toLat/180)*Math.PI;
        var tLng = (toLon/180)*Math.PI;

        var calcHeading = Math.atan2(Math.sin(fLng-tLng)*Math.cos(tLat), Math.cos(fLat)*Math.sin(tLat)-Math.sin(fLat)*Math.cos(tLat)*Math.cos(fLng-tLng));
        calcHeading = calcHeading * (180/Math.PI);

        coordsHeading = calcHeading;
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
            watchId = navigator.geolocation.watchPosition(watchPosition, geoError, geoOptions);
        }
        else {
            alert('Sorry, browser does not allow geolocation');
        }
    };

    function watchPosition(position) {
        var txtDistance;
        var txtUnavailableDist = 'No evacuation point available';

        var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (rendezvousCoords.length > 1) {
            var evacPt = new google.maps.LatLng(rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

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
                    console.log('User has reached the evacuation zone: ' + Module.session.user.get('name'));

                    Module.session.user.updateStatus(1);

                    // notify user they have arrived at the evac point
                    txtDistance = 'Arrived';

                    navigator.geolocation.clearWatch(watchId);
                }
                else {
                    distance = Math.round(distance);
                    txtDistance = distance + ' ft';
                }
            }
        }
        else {
            txtDistance = txtUnavailableDist;
        }
        $('.compass_distance').text(txtDistance);
    };

    return {
    	initCompass: initCompass
    };

 })();