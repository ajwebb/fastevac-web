var Module = (function () {

    var socket = io.connect();

    // socket events
    socket.on('message_received', function(message) {
        console.log('socket broadcast event received');
        alert(message);
    });

    socket.on('employee_status_update', function(employeeId, employeeStatus) {
        getPersonnelInfo(); // refresh personnel list with updated statuses
    });

    socket.on('company_status_update', function() {
        // sync session with updated status of company
    });
    
    var router;
    var session;

    var employeeCollection;

    function validateLoginForm() {
        var email = $('#email').val();
        if (email === '') {
            // return false;
            return true; //dev purposes
        }
        else {
            return true;
        }
    };

    function routeLogin() {
        if (Module.session.user) {
            if (Module.session.user.get('adminRole') === 'warden') {
                // todo - route to dashboard if evacuation is already in progress for company
                Module.router.navigate('evacuation', {trigger: true});
            }
            else {
                Module.router.navigate('dashboard', {trigger: true});
            }
        }
    };

    function triggerAlert() {
        console.log('triggering alert');
        // todo - send push notifications/txt messages to all employees
        // todo - initiate all employees as not checked in

        // navigate to user dashboard page
        Module.router.navigate('dashboard', {trigger: true});
    };

    function setStaticMap() {
        var w = $(document).width();
        var h = $(document).height();
        var z = 18;
        var s = 1;
        if (h > 104) {
            h = h - 104;
        }
        if (w > 640 || h > 640) {
            if (w % 2 == 0) {
                w = w/2;
            }
            else {
                w = (w-1)/2;
            }
            if (h % 2 == 0) {
                h = h/2;
            }
            else {
                h = (h-1)/2;
            }
            z = 17;
            s = 2;
        }
        if (Module.session.user) {
            var mapCoordinates = Module.session.user.get('coordinates');
            if (typeof(mapCoordinates) !== 'undefined' && mapCoordinates !== null) {
                if (mapCoordinates.length > 0) {
                    var mapImageURL = 'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' + mapCoordinates[0].latitude + ',' + mapCoordinates[0].longitude;
                    for (i=1; i<mapCoordinates.length; i++) {
                        if (i % 2 != 0) {
                            mapImageURL += '&markers=color:green|';
                        }
                        else {
                            mapImageURL += '&markers=color:blue|';
                        }
                        mapImageURL += mapCoordinates[i].latitude + ',' + mapCoordinates[i].longitude;
                    }
                    mapImageURL += '&zoom=' + z + '&scale=' + s + '&size=' + w + 'x' + h;
                    $('#static_map_img_warden').attr('src', mapImageURL);
                }
            }
        }
    };

    function joinCompanyRoom() {
        if (Module.session.user) {
            if (Module.session.user.get('adminRole') === 'warden') {
                socket.emit('join', Module.session.get('user_id'), Module.session.user.get('companyName'), true);
            }
            else {
                socket.emit('join', Module.session.get('user_id'), Module.session.user.get('companyName'), false);
            }
        }
    };

    // get employee information from the database and load the employees model
    function getPersonnelInfo() {
        if (Module.session.user && Module.session.user.get('adminRole') === 'warden') {
            Module.employeeCollection.fetch({
                data: {
                    coordinatorId: Module.session.user.get('id')
                },
                success: updatePersonnelInfo,
                error: function(e) {
                    console.log('Error fetching employee data: ' + e);
                },
                complete: function(e) {
                    console.log('Fetching employee data complete');
                }
            });
        }
    };

    function broadcastMessage(message, wardensOnlyFlag) {
        if (Module.session.user) {
            var roomName = Module.session.user.get('companyName');
            if (wardensOnlyFlag) {
                roomName += '-wardens';
            }
            socket.emit('broadcast', Module.session.user.get('name'), message, roomName);
        }
    };

    function employeeUpdateStatus(newStatus) {
        if (Module.session && Module.session.user) {
            socket.emit('update_status', Module.session.get('user_id'), Module.session.user.get('companyName'), newStatus);
        }
    };

    function getStatusInfo() {
        var companyStatusTxt;
        var userStatusTxt;

        if (Module.session && Module.session.user) {
            switch (Module.session.user.get('companyStatus')) {
                case 1:
                case '1':
                    companyStatusTxt = 'Proceed to Evacuation Zone';
                    break;
                case 2:
                case '2':
                    companyStatusTxt = 'Evacuation Drill';
                    break;
                default:
                    companyStatusTxt = 'Safe';
                    break;
            }

            switch (Module.session.user.get('status')) {
                case 1:
                case '1':
                    userStatusTxt = 'Checked In';
                    break;
                case 2:
                case '2':
                    userStatusTxt = 'In Need of Assistance';
                    break;
                default:
                    userStatusTxt = 'Not Checked In';
                    break;
            }
        }

        $('.evacuation_status_txt').text(companyStatusTxt);
        $('.current_status_txt').text(userStatusTxt);
    };


    // update lists of employees with their current status, for evac coordinator only
    function updatePersonnelInfo() {
        $('#need_assistance_counter').text(Module.employeeCollection.needAssistanceCount());
        $('#not_checked_in_counter').text(Module.employeeCollection.notCheckedInCount());
        $('#checked_in_counter').text(Module.employeeCollection.checkedInCount());

        $('#need_assistance_employees').empty();
        $('#not_checked_in_employees').empty();
        $('#checked_in_employees').empty();

        Module.employeeCollection.needAssistanceList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#need_assistance_employees').append(empView.render().el);
        });

        Module.employeeCollection.notCheckedInList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#not_checked_in_employees').append(empView.render().el);
        });

        Module.employeeCollection.checkedInList().forEach(function(employee) {
            var empView = new EmployeeView({model: employee});
            $('#checked_in_employees').append(empView.render().el);
        });

        // var empListView = new EmployeeListView({collection: employeeCollection});
        // $('#warden_personnel_content').html(empListView.render().el);

        $('#need_assistance_employees').listview().listview('refresh');
        $('#not_checked_in_employees').listview().listview('refresh');
        $('#checked_in_employees').listview().listview('refresh');
    };










    

    



    var currentUser; // deprecated

    

    function clearAlert() {
        // show correct button
        configureAlertScreen();
        var allClearMessage = 'All Clear!';
        socket.emit('broadcast', currentUser.name, allClearMessage, currentUser.companyName);
    };


    

    function configureAlertScreen() {
        if (typeof(currentUser) !== 'undefined' && currentUser !== null) {
            if (currentUser.companyStatus == 1) {
                $('.alertScreen_mobilecontainer').hide();
                $('.all_clear_mobilecontainer').show();
            }
            else {
                $('.alertScreen_mobilecontainer').show();
                $('.all_clear_mobilecontainer').hide();
            }
        }
    }

  
    return {
        router: router,
        session: session,
        employeeCollection: employeeCollection,
        validateLoginForm: validateLoginForm,
        routeLogin,
        triggerAlert: triggerAlert,
        setStaticMap: setStaticMap,
        joinCompanyRoom: joinCompanyRoom,
        getPersonnelInfo: getPersonnelInfo,
        broadcastMessage: broadcastMessage,
        employeeUpdateStatus: employeeUpdateStatus,
        getStatusInfo: getStatusInfo,


        
        
        
        configureAlertScreen: configureAlertScreen,
        clearAlert: clearAlert
    };

})();