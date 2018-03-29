var API_ROOT = "http://127.0.0.1/api/";

var app = angular.module("presence", []); 

app.controller("main", function($scope, $timeout, $http, $window) {

    // Model initialization
    $scope.settings  = {section: "SanPietro", labid:"1"};
    $scope.students = {all:[], attending:[], missing:[]};
    $scope.curStudent = {name:""};

    // Post-register-attempt status
    $scope.studentRecognized = false;
    $scope.studentNotRecognized = false;
    $scope.recognitionError = false;

    // Default views 
    $scope.view = null;
    $scope.listView = "attending"


    $scope.init = function() {
        // Retrieve settings from local storage, if any
        section = $window.localStorage.getItem("section");
        if ( section != null ) {
            console.log("Section: "+section);
            $scope.settings.section = section;
        }
        labid = $window.localStorage.getItem("labid");
        if (labid != null ) {
            console.log("LabID: "+labid);
            $scope.settings.labid = labid;
        }
    }

    $scope.init();

    // Core methods:

    $scope.showAttending = function() {

        $scope.listView = "attending";

        $http({
            method: 'GET',
            url: API_ROOT+'/registered?section='+$scope.settings.section+"&labid="+$scope.settings.labid
        }).then(function successCallback(response) {

            $scope.students.attending = response.data.list;
            $scope.tableEntries =  $scope.students.attending;

            console.log($scope.students);

        }, function errorCallback(response) {
            $scope.students.attending = [];
            $scope.tableEntries = [];
            
            console.error("Error calling /registered");
        });
    }

    $scope.showMissing = function() {

        $scope.listView = "missing";

        $http({
            method: 'GET',
            url: API_ROOT+'/notyet?section='+$scope.settings.section+"&labid="+$scope.settings.labid
        }).then(function successCallback(response) {

            $scope.students.missing = response.data.list;
            $scope.tableEntries =  $scope.students.missing

            console.log($scope.students);

        }, function errorCallback(response) {
            $scope.students.attending = [];
            $scope.tableEntries = [];
            
            console.error("Error calling /notyet");
        });
    }

    $scope.showAll = function() {

        $scope.listView = "all";

        $http({
            method: 'GET',
            url: API_ROOT+'/list?section='+$scope.settings.section
        }).then(function successCallback(response) {

            $scope.students.all = response.data.list;
            $scope.tableEntries =  $scope.students.all

            console.log($scope.students);

        }, function errorCallback(response) {
            $scope.students.attending = [];
            $scope.tableEntries = [];
            
            console.error("Error calling /list");
        });
    }

    $scope.register = function(id) {

        $http({
            method: 'POST',
            url: API_ROOT+'/register',
            data: {section: $scope.settings.section, labid: $scope.settings.labid, id:id}
        }).then(function successCallback(response) {

            if(response.data.registered.length == 0 ) {

                console.error("Student not recognized.")

                // Student not recognized

                // Hide the preview and notify the error to the student
                $("#qrCapture").hide();
                $scope.studentNotRecognized = true;

            } else {

                console.info("Student registered.")

                // Extract the student name from the list of registered students
                name = response.data.registered.filter(function(st){return st.codice_persona==id})[0].nome;
                $scope.curStudent.name = name;

                // Hide the preview and notify the recognition to the student
                $("#qrCapture").hide();
                $scope.studentRecognized = true;

                // Wait 2s and go back to the QR capturer
                $timeout($scope.resetQRCapture, 2000);
            }

        }, function errorCallback(response) {

            // Notify Error
            $("#qrCapture").hide();
            $scope.recognitionError = true;


        });
    }

    // Others:

    $scope.persistSettings = function() {
        $window.localStorage.setItem("section", $scope.settings.section);
        $window.localStorage.setItem("labid", $scope.settings.labid);
    }

    $scope.readQR = function() {

        $scope.view = "QRread";

        $timeout(function(){

            let scanner = new Instascan.Scanner({ video: document.getElementById('preview') , scanPeriod: 5});

            scanner.addListener('scan', function (content) {

                $scope.$apply(function(){
                    console.log(content);
                    $scope.register(content);
                });

            });

            Instascan.Camera.getCameras().then(function (cameras) {
                if (cameras.length > 0) {
                    scanner.start(cameras[0]);
                } else {
                    console.error('No cameras found.');
                }
            }).catch(function (e) {
                console.error(e);
            });

        }, 50);

    }

    $scope.resetQRCapture = function() {

        $scope.studentRecognized = false;
        $scope.studentNotRecognized = false;
        $scope.recognitionError = false;

        $("#qrCapture").show();
    }

    $scope.showListView = function() {
        $scope.view = "list";
        $scope.showAttending();
    }

    $scope.showSettings = function() {
        $scope.view = "settings";
    }

    $scope.showHome = function() {
        $scope.view = null;
    }

});