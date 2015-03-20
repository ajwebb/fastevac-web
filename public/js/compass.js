/*
 * JS for compass 
 */

 var Compass = (function() {

 	var rendezvousLat;
 	var rendezvousLong;

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
        $(".n").css({ "-moz-transform": "rotate(0deg)"});
        $(".n").css({ "-moz-transform": "rotate(" + deg + "deg)"});
    
        $(".n").css({ "-o-transform": "rotate(0deg)"});
        $(".n").css({ "-o-transform": "rotate(" + deg + "deg)"});
    
        $(".n").css({ "-ms-transform": "rotate(0deg)"});
        $(".n").css({ "-ms-transform": "rotate(" + deg + "deg)"});
    
        $(".n").css({ "-webkit-transform": "rotate(0deg)"});
        $(".n").css({ "-webkit-transform": "rotate(" + deg + "deg)"});
    
        $(".n").css({ "transform": "rotate(0deg)"});
        $(".n").css({ "transform": "rotate(" + deg + "deg)"});
    };

    var getLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(watchPosition);
        }
    };

    var watchPosition = function(position) {
        console.log(position.coords.latitude); 
        console.log(position.coords.longitude); 
        console.log('successfully logged coordinates');

        // google maps api distance in json
        if (rendezvouLat !== 'undefined' && rendezvouLong !== 'undefined') {
        	var distanceUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins' + position.coords.latitude + ',' + position.coords.longitude + '&destinations=' + rendezvousLat + ',' + rendezvousLong;
        }
    };

    return {
    	initCompass: initCompass
    };

 })();