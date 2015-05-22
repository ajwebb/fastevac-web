// backbone router for page routing
var WebRouter = (function() {
    var Router = Backbone.Router.extend({
        initialize: function() {
            console.log('router initialize!');
        },

        routes: {
            '': 'index',
            'evacuation': 'evacuation',
            'dashboard': 'dashboard'
        },

        show: function(view) {
            this.currentView = view;
            $('body').append((this.currentView.render().$el));
            $.mobile.changePage(this.currentView.$el, {changeHash:false});
        },

        index: function() {
            // render login page
            console.log('router login function');
            if (Module.session.get('logged_in')) {
                console.log('user found in session');
                // Module.routeLogin();
            }
            this.show(new Views.LoginView({}));
        },

        evacuation: function() {
            // render evacuation page
            console.log('router evac page function');
            this.show(new Views.EvacuationView({}));
            Module.configureAlertScreen();
        },

        dashboard: function() {
            console.log('router dashboard function');
            // render dashboard page, need to show correct navbar for warden/employee

            if (Module.session.user && Module.session.user.get('adminRole') === 'warden') {
                // warden view
                var wardenDashboard = new Views.WardenDashboardView({});
                wardenDashboard.render();
            }
            else {
                // employee view
                var employeeDashboard = new Views.EmployeeDashboardView({});
                employeeDashboard.render();
            }

            $(window).on("throttledresize", Module.setStaticMap);
        }
    });

    return {
        Router: Router
    };
})();