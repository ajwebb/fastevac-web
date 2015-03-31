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

        // get current users rendezvous coordinates
        rendezvousCoords = JSON.parse(sessionStorage['mapCoords']);

        var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var evacPt = new google.maps.LatLng(rendezvousCoords[1].latitude, rendezvousCoords[1].longitude);

        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
        {
            origins: [currentLocation],
            destinations: [evacPt],
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        }, callback);
    };

    function callback(response, status) {
        if (status != google.maps.DistanceMatrixStatus.OK) {
            alert('Error was: ' + status);
        } 
        else {
            for (var i = 0; i < response.rows.length; i++) {
                var results = response.rows[i].elements;
                distance = results[i].distance.text;
                $('.compass_distance').text(distance);
            }
        }
    }

    return {
    	initCompass: initCompass
    };

 })();