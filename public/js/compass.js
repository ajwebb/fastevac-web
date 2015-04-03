/*
 * JS for compass 
 */

 var Compass = (function() {

 	var rendezvousCoords = []

 	var initCompass = function() {
        //Check for support for DeviceOrientation event
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", function (e) {
                rotate(360 - e.alpha);
            }, false);
        }

        getLocation();
    };

 	var rotate = function (deg) {  
        $(".pointer").css({ "-moz-transform": "rotate(0deg)"});
        $(".pointer").css({ "-moz-transform": "rotate(" + deg + "deg)"});
    
        $(".pointer").css({ "-o-transform": "rotate(0deg)"});
        $(".pointer").css({ "-o-transform": "rotate(" + deg + "deg)"});
    
        $(".pointer").css({ "-ms-transform": "rotate(0deg)"});
        $(".pointer").css({ "-ms-transform": "rotate(" + deg + "deg)"});
    
        $(".pointer").css({ "-webkit-transform": "rotate(0deg)"});
        $(".pointer").css({ "-webkit-transform": "rotate(" + deg + "deg)"});
    
        $(".pointer").css({ "transform": "rotate(0deg)"});
        $(".pointer").css({ "transform": "rotate(" + deg + "deg)"});
    };

    var geoOptions = {
        enableHighAccuracy: true, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    function geoError() {
        alert("Sorry, no position available.");
    }

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
        console.log('successfully logged coordinates');

        var txtDistance;

        // get current users rendezvous coordinates
        rendezvousCoords = JSON.parse(sessionStorage['mapCoords']);

        var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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

        $('.compass_distance').text(txtDistance);
    };

    return {
    	initCompass: initCompass
    };

 })();