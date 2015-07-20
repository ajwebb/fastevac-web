/*
 * Main JS for app - initialize the application
 */

$(function(){
    // delegate routing to backbone instead of jquery
    $(document).bind("mobileinit", function(){
        $.mobile.hashListeningEnabled = false;
        $.mobile.linkBindingEnabled = false;
    });

    // remove the previous page from html
    $(document).on('pagehide', function (event) {
        console.log('document page hide event');
        $(event.target).remove();
    });

    Module.router = new WebRouter.Router();
    Module.session = new Models.SessionModel({});

    // check if user session exists
    Module.session.checkAuth(function() {
        console.log('backbone history starting');
        Backbone.history.start();
    });
});