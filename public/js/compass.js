/*
 * JS for compass 
 */

 var Compass = (function() {

 	var initCompass = function() {
        //Check for support for DeviceOrientation event
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", function (e) {
                var heading = null;
                if (e.alpha !== null) {
                    heading = compassHeading(e.alpha, e.beta, e.gamma);
                    //console.log('compass heading: '+ heading);
                };
                rotate(heading);
            }, false);
        };

        getLocation();
    };

 	var rotate = function (deg) {  
        $('.pointer').css('transform', 'rotate(' + (-deg) + 'deg)');
    };

    var geoOptions = {
        enableHighAccuracy: true, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    function compassHeading(alpha, beta, gamma) {

        // Convert degrees to radians
        var alphaRad = alpha * (Math.PI / 180);
        var betaRad = beta * (Math.PI / 180);
        var gammaRad = gamma * (Math.PI / 180);

        // Calculate equation components
        var cA = Math.cos(alphaRad);
        var sA = Math.sin(alphaRad);
        var cB = Math.cos(betaRad);
        var sB = Math.sin(betaRad);
        var cG = Math.cos(gammaRad);
        var sG = Math.sin(gammaRad);

        // Calculate A, B, C rotation components
        var rA = - cA * sG - sA * sB * cG;
        var rB = - sA * sG + cA * sB * cG;
        var rC = - cB * cG;

        // Calculate compass heading
        var compassHeading = Math.atan(rA / rB);

        // Convert from half unit circle to whole unit circle
        if(rB < 0) {
            compassHeading += Math.PI;
        }else if(rA < 0) {
            compassHeading += 2 * Math.PI;
        }

        // Convert radians to degrees
        compassHeading *= 180 / Math.PI;

        return compassHeading;
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
        console.log(position.coords.latitude); 
        console.log(position.coords.longitude);

        var txtDistance;

        // get current users rendezvous coordinates
        var rendezvousCoords = JSON.parse(sessionStorage['mapCoords']);

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
            console.log(distance);
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