/*
 * JS for compass 
 */

 var Compass = (function() {

 	var initCompass = function() {
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

    return {
    	initCompass: initCompass
    };

 })();