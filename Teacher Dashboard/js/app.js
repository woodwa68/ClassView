/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
*/


// GLOBAL VARIABLES
///////////////////
settingsIndex = 0;
transitionIndex = 0;
classTabCount = 0;
sortByStudent = true;
var newFileState = "";

$(document).ready(function() {

  var $scope = angular.element("body").scope();

  $(document).on("mousedown", function(e){

    //if the user clicks one of the buttons on the button bar
    if(e.target.id == "deleteFile" || e.target.id == "openFile" || e.target.id == "Resolve" || e.target.id == "downloadFile" || e.target.id == "shareFile"){
      $("#fileButtonBar").css("visibility", "default");
    }
    else{
      $("#fileButtonBar").css("visibility", "hidden");
      $(".li").removeClass("selected");

      //if the user clicks a file;
      if(e.target.parentNode.className == "flexRows file ng-scope"){
        $(e.target.parentNode.children).addClass("selected");
        if(e.target.parentNode.children[0].children[1].dataset.help == "true") $("#Resolve").css("display", "inline");
        else $("#Resolve").css("display", "none");
        $("#fileButtonBar").css("visibility", "default");
        $scope.selected = e.target.parentNode;
      }
    }
  });


  $(".allCheckbox").click(function(e){
    if ($(this).is(':checked')){
      $(e.target.parentNode.children).each(function(){
        $(this.children).prop("checked",true);
      });
    }
    else {
      $(e.target.parentNode.children).each(function(){
        $(this.children).prop("checked",false);
      }); 
    }
  });




    $("#addClass").click(function() {

          document.getElementById("classWarning").innerHTML = "";

          $.fancybox.open({
            href : '#inline2',
            type : 'inline',
            padding : 5,
            afterClose: function() { 
              $("form").each(function(){
                $(this)[0].reset();
              });
            }
     
          });
        });


  // ***************************** //
  //******* NEW FILE BUTTON *******//
  // ***************************** //

    $('#transitionContainer').on('click', '.next', function(){
      transitionIndex++;
      $("#transitionContainer").css("transform","translateX("+transitionIndex*-400+"px)");
    
    });


    $('#transitionContainer').on('click', '.back', function(){  
	    transitionIndex--;
      $("#transitionContainer").css("transform","translateX("+transitionIndex*-400+"px)");

    });


    $('.create').on('click',  function(){
      $("#createContainer").css("display", "default");
      $("#existsContainer").css("display", "none");
    });

    $('.exists').on('click',  function(){
      $("#createContainer").css("display", "none");
      $("#existsContainer").css("display", "default");
    });

    $('.archiveStudentButton').on('click',  function(){
      $("#archiveStudentContainer").css("display", "default");
      $("#archiveClassContainer").css("display", "none");
    });

    $('.archiveClassButton').on('click',  function(){
      $("#archiveStudentContainer").css("display", "none");
      $("#archiveClassContainer").css("display", "default");
    });


    $("#browse").click(function () {
      $("input[type=file]").click();
    })

    $('input[type=file]').change(function () {
        $('#testFile').val($(this).val());
    })

    window.onresize = function(event) {
      $scope.resizeTabs();
    };

    

  // ********************************//
  // ***ClassView Settings BUTTON ***//
  // ********************************//
    $('#settingsContainer').on('click', '.next', function(){
      settingsIndex++;
      $("#settingsContainer").css("transform","translateX("+settingsIndex*-400+"px)");
    });

    $('#settingsContainer').on('click', '.back', function(){
      settingsIndex--;
       $("#settingsContainer").css("transform","translateX("+settingsIndex*-400+"px)");
    });

    $('input:text, textarea').each(function(){
      var $this = $(this);
      $this.data('placeholder', $this.attr('placeholder'))
           .focus(function(){$this.removeAttr('placeholder');})
           .blur(function(){$this.attr('placeholder', $this.data('placeholder'));});
    });

    angular.element("div[tabindex]").on("mousedown", function(){
      $("#fileButtonBar").css("visibility", "default");
    })


    document.getElementById('hiddenInput').addEventListener('change', 
      function(e){
        var files = e.target.files;
        if($scope.filesToUpload == undefined) $scope.filesToUpload = files;
        else{
          for(file in files) $scope.filesToUpload.push(file);
        }
      }
    );

  });

function startLoading(){
  $("#loading").css("visibility", "visible");
}

function stopLoading(){
  $("#loading").css("visibility", "hidden");
}

function onError(e) {
  console.log(e);
}

// FILESYSTEM SUPPORT ----------------------------------------------------------
var fs = null;
var FOLDERNAME = 'test';

function writeFile(blob) {
  if (!fs) {
    return;
  }

  fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
    dirEntry.getFile(blob.name, {create: true, exclusive: false}, function(fileEntry) {
      // Create a FileWriter object for our FileEntry, and write out blob.
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onerror = onError;
        fileWriter.onwriteend = function(e) {
          console.log('Write completed.');
        };
        fileWriter.write(blob);
      }, onError);
    }, onError);
  }, onError);
}
// -----------------------------------------------------------------------------



var gDriveApp = angular.module('gDriveApp', []).config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        // Angular -1.2.0-rc2 : /^\s*(https?|ftp|file):|data:image\//
        var currentImgSrcSanitizationWhitelist = $compileProvider.imgSrcSanitizationWhitelist();
            newImgSrcSanitizationWhiteList = currentImgSrcSanitizationWhitelist.toString().slice(0,-1)+'|filesystem:chrome-extension:'+'|blob:chrome-extension%3A'+currentImgSrcSanitizationWhitelist.toString().slice(-1);
        console.log("Changing imgSrcSanitizationWhiteList from "+currentImgSrcSanitizationWhitelist+" to "+newImgSrcSanitizationWhiteList);

        $compileProvider.imgSrcSanitizationWhitelist(newImgSrcSanitizationWhiteList);
    }
]);

gDriveApp.factory('gdocs', function() {
  var gdocs = new GDocs();

  var dnd = new DnDFileController('#existsContainer', function(files) { 
    var $scope = angular.element(this).scope();
    document.getElementById("testFile").value = files[0].name;
    $scope.filesToUpload = files;
  });
    
 

  return gdocs;
});

// Main Angular controller for app.
function DocsController($scope, $http, gdocs) {

  $scope.query = "";


  var colorIndex = 0;

  $scope.count =0;

  $scope.checkboxes;

  $scope.activeClass = '';
  $scope.filesToUpload;
  $scope.userInfo = {};

  $scope.selected = undefined;

  $scope.showAddClass = false;

  $scope.classIDs = new Object();
 
  $scope.classButtons = [];

  $scope.archiveClasses = [];
  $scope.archiveStudents = [];

  $scope.students = new Object();
  $scope.sorted = [];
  
  var w = document.body.clientWidth;

  $scope.sortBy = function(student, type, $event){

    var element = $event.target;
    
    

    if(student.sort == type){
      student.studentFiles.reverse();

      if(element.children[1].style.display == "inline"){
        element.children[1].style.display = "none";
        element.children[0].style.display = "inline";
      }
      else{
        element.children[1].style.display = "inline";
        element.children[0].style.display = "none";
      }
        
      
    }
    else{
      $(".upArrow").css("display", "none");
      $(".downArrow").css("display", "none");

      element.children[1].style.display = "inline";

      student.sort = type; 

      student.studentFiles.sort(function(a,b){
        if(a[type] < b[type]) return 1;      
        if(a[type] >= b[type]) return -1;
      });

      if(type=="title" || type=="updatedDateFull")  student.studentFiles.reverse();
    }

  }

  function sortStudents(){

    

    var keys = []; 
    for(var key in $scope.students) keys.push([key,$scope.students[key].lastName]);
    keys.sort(function(a,b){
      if(a[1] == undefined  || a[1] == "") return -1;
      if(a[1] < b[1]) return -1;      if(a[1]> b[1]) return 1;
      return 0;
    });


    $scope.sorted = [];
    for(var i=0; i<keys.length; i++){
      temp = $scope.students[keys[i][0]];
      $scope.sorted.push($scope.students[keys[i][0]]);
    }

  }

  function getConfig(fields, q){
    var config = {
      params:{},
      headers: {
        'Authorization': 'Bearer ' + gdocs.accessToken
      }
    };

    if(fields != "") config.params.fields = fields;
    if(q !="" ) config.params.q = q;

    return config;

  }


  function initializeStudent(data){
    var studentName = data.title.substr(data.title.indexOf("-",data.title.indexOf("-")+1)+2);

    $scope.students[data.id] = {};
    $scope.students[data.id].fullName = studentName;
    $scope.students[data.id].firstName = studentName.split(" ")[0];
    $scope.students[data.id].lastName = studentName.split(" ")[1];
    $scope.students[data.id].sort = "";
    $scope.students[data.id].email = data.description;
    $scope.students[data.id].studentFiles = [];

  }



  $scope.clearClasses= function() {
    $scope.classList= [];
    $scope.classButtons=[];
    $scope.classIDs = new Object();
  };

  $scope.fetchClassList= function(retry) {
    
      if (gdocs.accessToken) {
        var config = getConfig("items(id,title)", "title contains 'ClassView -'");

      $http.get(gdocs.DOCLIST_FEED, config).
        success(successClasses).
        error(function(data, status, headers, config) {
          if (status == 401 && retry) {
            gdocs.removeCachedAuthToken(
                gdocs.auth.bind(gdocs, true, 
                    $scope.fetchClassList.bind($scope, false)));
          }
        });
      }
  }


  function successClasses(resp, status, headers, config) {
    
    $scope.clearClasses();
    var classes = [];

    var totalEntries = resp.items.length;


      resp.items.forEach(function(entry, i) {
        $scope.classIDs[entry.title.substr(entry.title.indexOf("-")+2)] = entry.id;
        if(entry.title.substr(entry.title.indexOf("-")+2).charAt(0)!='*') $scope.classButtons.push(entry.title.substr(entry.title.indexOf("-")+2));
        
    });

    
  
  }

  function successChildren(resp, status, headers, config) {

    resp.items.forEach(function(child, i) {
      var config = getConfig("kind,mimeType,description,exportLinks,id,title,downloadUrl,parents,alternateLink,modifiedDate,iconLink");

      $http.get(gdocs.DOCLIST_FEED+"/"+child.id, config).
        success(successCallbackWithFsCaching).
        error(function(d, st, hdrs, cfg) {
          if (status == 401 && retry) {
            gdocs.removeCachedAuthToken(
                gdocs.auth.bind(gdocs, true, 
                    $scope.fetchClass.bind($scope, false)));
          }
        });

    });

  }


  function getUserInfo(){
    if (gdocs.accessToken) {
        var config = getConfig("rootFolderId,user(displayName)");
     
      $http.get("https://www.googleapis.com/drive/v2/about", config).success(function(response, status, headers, confg){
        $scope.userInfo["rootFolderId"] = response.rootFolderId;
        $scope.userInfo["name"] = response.user.displayName;
      });
    }
  }


  // Response handler that caches file icons in the filesystem API.
  function successCallbackWithFsCaching(resp, status, headers, config) {

      var entry = resp;

      var studentID = resp.parents[0].id;

      var student = $scope.students[studentID];

      var outMimeType;
      if(entry.mimeType == "application/vnd.google-apps.document") outMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if(entry.mimeType == "application/vnd.google-apps.drawing") outMimeType = 'image/png';
      else if(entry.mimeType == "application/vnd.google-apps.spreadsheet") outMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if(entry.mimeType == "application/vnd.google-apps.presentation") outMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
        var doc = {
          indexableText : $scope.students[studentID].fullName +" "+entry.title,
          mimeType : entry.mimeType,
          outMimeType : (outMimeType == undefined ? entry.mimeType : outMimeType),
          title: entry.title,
          updatedDate: Util.formatDate(entry.modifiedDate),
          updatedDateFull: entry.modifiedDate,
          icon: entry.iconLink,
          alternateLink: entry.alternateLink,
          id: entry.id,        
          downloadurl: entry.downloadUrl!=undefined ? entry.downloadUrl : entry.exportLinks[outMimeType],
          completed: false,
          help : false,
          feedback : false
        };

        if(entry.description != undefined && entry.description.indexOf("Completed")!=-1) doc.completed = true;
        if(entry.description != undefined && entry.description.indexOf("Help")!=-1) doc.help = true;

        doc.iconFilename = doc.icon.substring(doc.icon.lastIndexOf('/') + 1);
      
      var config = getConfig("items(content)");
              

      // If file exists, it we'll get back a FileEntry for the filesystem URL.
      // Otherwise, the error callback will fire and we need to XHR it in and
      // write it to the FS.
      var fsURL = fs.root.toURL() + FOLDERNAME + '/' + doc.iconFilename;

      window.webkitResolveLocalFileSystemURL(fsURL, function(entry) {
        //console.log('Fetched icon from the FS cache');

        doc.icon = entry.toURL(); // should be === to fsURL, but whatever

        $scope.students[studentID].studentFiles.push(doc);

        $scope.$apply(function($scope) {}); // Inform angular we made changes.
          
        
      }, function(e) 
{
        $http.get(doc.icon, {responseType: 'blob'}).success(function(blob) {
          //console.log('Fetched icon via XHR');

          blob.name = doc.iconFilename; // Add icon filename to blob.

          writeFile(blob); // Write is async, but that's ok.

          doc.icon = window.URL.createObjectURL(blob);

          
        });
  
      });
   
  }

  $scope.resizeTabs = function(){

    // keep track how how many classes we have
    classTabCount++;

    // since we are now displaying class tabs, let's display the add new class tab
    $scope.showAddClass = 'true';

    var tabs = $('nav')[0].children;

    if (tabs.length >= 5)
    {
      for(var i = 0; i < tabs.length-1; i++)
        {
          tabs[i].style.width = (document.body.clientWidth - 2*(5+1+2)*(tabs.length)-20) / (tabs.length-1)+"px";
          if($(tabs[i]).width() > 250) tabs[i].style.width = "250px";

        }
    }
    else
    {
      var pixelwidth = 210;
      for(var i = 0; i < tabs.length-1; i++)
        {
          tabs[i].style.width = pixelwidth+"px";
        }
        
    }
  }

  $scope.setClassColor = function(index){
    if(index % 4 == 0){
      document.body.style.background = "#0296d4";
      return "blueTab";
    }
    else if(index % 4 == 1){
      document.body.style.background = "#0296d4";
      return "greenTab";
    }
    else if(index % 4 == 2){
      document.body.style.background = "#0296d4";
      return "yellowTab";
    }
    document.body.style.background = "#0296d4";
    return "redTab";
  }

  $scope.setActiveClass = function(_activeClass, index){
	  
      // set z-index of tabs properly
	  for(var i = 0; i < $scope.classButtons.length; i++){
		  $('nav')[0].children[i].style.zIndex = 1;
	  }
    
    $('nav')[0].children[index].style.zIndex = 3;
	  
	  // set tab background colors properly
	  for(var i = 0; i < $scope.classButtons.length; i++){
		  $('nav')[0].children[i].style.background = "#2484ae";
	  }
    
    $('nav')[0].children[index].style.background = "#0296d4";
      
	  $scope.clearDocs();
    $scope.activeClass = _activeClass;
      
    document.getElementById("classFolders").scrollTop = 0;

    $scope.fetchClass(true, $scope.classIDs[_activeClass]);
  }

  $scope.isActive = function(c){
      return (c == $scope.activeClass);
  }

  $scope.addClass = function() {

    if (gdocs.accessToken) {
      var config = getConfig("id");


      var className = document.getElementById("classNameInput").value;

      if($scope.classIDs[className] != undefined){
        document.getElementById("classWarning").innerHTML = "That class already exists.";
        return false;
      }
      else if(className == undefined || className == ""){
        document.getElementById("classWarning").innerHTML = "Cannot enter a blank class.";
        return false;
      }

      var data = {"title": "ClassView - "+className, "mimeType":"application/vnd.google-apps.folder"}

      $http.post(gdocs.DOCLIST_FEED, data, config).success(function(response, status, headers, confg){
        $scope.classIDs[className] = response.id;         
      });
    }

   
    
    $scope.classButtons.push(className);
    $scope.closeFancyBox();
    document.getElementById("classNameInput").value = "";
    $scope.resizeTabs();
  };



  $scope.addStudent = function() {

    var studentFirstName = document.getElementById("firstNameInput").value;
    var studentLastName = document.getElementById("lastNameInput").value;
    var studentEmail = document.getElementById("emailInput").value;

    if(studentFirstName == undefined || studentLastName == undefined || studentEmail == undefined ||
        studentFirstName == "" || studentLastName == "" || studentEmail == ""){
      $("#warning")[0].innerHTML = "Please fill out every field.";
      return false;
    }

    //validate email... just checks if it's formatted like an email address should be, not if it actually exists
    var atpos=studentEmail.indexOf("@");
    var dotpos=studentEmail.lastIndexOf(".");
    if (atpos<1 || dotpos<atpos+2 || dotpos+2>=studentEmail.length)
    {
      $("#warning")[0].innerHTML= "Not a valid e-mail address";
      return false;
    }

   if (gdocs.accessToken) {

    startLoading();

    var config = getConfig("id,description,title");

    var className = document.getElementById("classNameInput").value;
    var data = {"description":studentEmail, "parents":[{"id":$scope.classIDs[$scope.activeClass]}], title: "ClassViewClass - "+$scope.activeClass+" - "+studentFirstName+" "+studentLastName, "mimeType":"application/vnd.google-apps.folder"}

    $http.post(gdocs.DOCLIST_FEED, data, config).success(function(response, status, headers, confg){
      initializeStudent(response);

      data = {"role":"writer", "type":"user","value":studentEmail};
      config= getConfig();
      config.params.emailMessage = "You have been added to the class "+$scope.activeClass+".";
      $http.post(gdocs.DOCLIST_FEED+"/"+response.id+"/permissions", data, config).success(function(response, status, headers, confg){
        $scope.fetchClass();
        stopLoading();
      }).error(function(data, status, headers, config) {
            console.log("error sharing folder");
            $http.post(gdocs.DOCLIST_FEED+"/"+response.id+"/permissions", data, config).success(function(response, status, headers, confg){
              $scope.fetchClass();
              stopLoading();
            });
      });
    });

    
    
    $scope.closeFancyBox();
    document.getElementById("emailInput").value = "";
    document.getElementById("firstNameInput").value = "";
    document.getElementById("lastNameInput").value = "";
    document.getElementById("warning").innerHTML = "";
  };
}

  $scope.copyFile = function (response){
    var accountForAll = 0;
    var config = getConfig();
    for(var i=0; i < $scope.checkboxes.length; i++){
      startLoading();
      var data = {"title":response.title, "parents":[{"id":$scope.checkboxes[i].title}]};
      $http.post(gdocs.DOCLIST_FEED+"/"+response.id+"/copy", data, config).success(function(){
        accountForAll++;
        if(accountForAll == $scope.checkboxes.length){
          $scope.fetchClass();
          stopLoading();
        }
      }).error(function(){
        accountForAll++;
        if(accountForAll == $scope.checkboxes.length){
          $scope.fetchClass();
          stopLoading();
        }
      });
    }
  }

  $scope.archiveClass = function(){
    var checkboxes = $('.archiveClasses');
    for(var i=0; i<checkboxes.length; i++){
        if(checkboxes[i].dataset.name.charAt(0)=='*'){
          checkboxes[i].checked = true;
        }
    }
  }

  $scope.submitArchiveClass = function(){
    $scope.checkboxes = $(".archiveClasses");

    var accountForAll =0;
    var total = $("input:checked").length;
    var config = getConfig("title");

    for(var i=0; i < $scope.checkboxes.length; i++){
    
      var data;
      if($scope.checkboxes[i].checked == true && $scope.checkboxes[i].dataset.name.charAt(0) != '*'){
        data = {"title": "ClassView - "+'*'+$scope.checkboxes[i].dataset.name};
      }
      else if($scope.checkboxes[i].checked == false && $scope.checkboxes[i].dataset.name.charAt(0) == '*'){
        data = {"title": "ClassView - "+$scope.checkboxes[i].dataset.name.substr(1)};
      }
      else {
        continue;
      }

      startLoading();

      $http.put(gdocs.DOCLIST_FEED+"/"+$scope.checkboxes[i].dataset.id, data, config).success(function(){
        $scope.fetchClassList(false);
        stopLoading();
      });
    }

    $scope.closeFancyBox();
  }

  $scope.archiveStudent = function(){
    var checkboxes = $('.archiveStudents');
    for(var i=0; i<checkboxes.length; i++){
        if(checkboxes[i].dataset.name.charAt(0)=='*'){
          checkboxes[i].checked = true;
        }
    }
  }


  $scope.submitArchiveStudent = function(){
    $scope.checkboxes = $(".archiveStudents");

    var accountForAll =0;
    var total = $("input:checked").length;
    var config = getConfig("title");

    for(var i=0; i < $scope.checkboxes.length; i++){
    
      var data;
      if($scope.checkboxes[i].checked == true && $scope.checkboxes[i].dataset.name.charAt(0) != '*'){
        data = {"title": "ClassViewClass - "+$scope.activeClass+" - "+"*"+$scope.checkboxes[i].dataset.name};
      }
      else if($scope.checkboxes[i].checked == false && $scope.checkboxes[i].dataset.name.charAt(0) == '*'){
        data = {"title": "ClassViewClass - "+$scope.activeClass+" - "+$scope.checkboxes[i].dataset.name.substr(1)};
      }
      else {
        continue;
      }

      startLoading();

      $http.put(gdocs.DOCLIST_FEED+"/"+$scope.checkboxes[i].dataset.id, data, config).success(function(){
        $scope.fetchClass();
        stopLoading();
      });
    }

    $scope.closeFancyBox();
  }


  $scope.newAssignment = function() {
    $scope.checkboxes = $("input:checked");
    var config = getConfig();

    //if it's an existing file or DnD
    if($scope.filesToUpload != undefined){
      Util.toArray($scope.filesToUpload).forEach(function(file, i) {
        gdocs.upload(file, $scope.classIDs[$scope.activeClass], function(response) {
  
          $scope.copyFile(response);
          
        }, true);
      });
    }
    else{ //if it's a manually created file
      if (gdocs.accessToken) {
           
      var content = document.getElementById("assignmentContent").value;
      var data = {"parents":[{"id":$scope.classIDs[$scope.activeClass]}], "title": document.getElementById("assignmentTitle").value, "mimeType":"application/vnd.google-apps.document"};

      //Create Assignment
      $http.post(gdocs.DOCLIST_FEED, data, config).success(function(response, status, headers, config){

          //Insert it's content
          $http.put(gdocs.UPLOAD_CONTENT+response.id, content, config);

          $scope.copyFile(response);
        });
      }
    }


    $scope.filesToUpload = undefined;
    $scope.closeFancyBox();

    
    document.getElementById("assignmentTitle").value = "";
    document.getElementById("assignmentContent").value = "";
  };

  $scope.clearDocs = function() {
    $scope.students = new Object();
  };

  
  $scope.fetchStudentsOfClass = function(retry, classID) {
    if (gdocs.accessToken) {
      var config;
      config = getConfig("items(id)", "title contains '"+$scope.activeClass+" - ' and mimeType = 'application/vnd.google-apps.folder'");

      var count =0;
      $http.get(gdocs.DOCLIST_FEED+"/"+classID+"/children", config).
        success(function(response1, status, headers, confg){

          if(response1.items.length == 0 ) $("#newFile").css("display", "none");
          else $("#newFile").css("display", "inline");

          response1.items.forEach(function(file, i) {

            var config = getConfig("id,description,title");

            $http.get(gdocs.DOCLIST_FEED+"/"+file.id, config).success(function(response2){
           
                initializeStudent(response2);
                $scope.fetchFolderContents(true, response2.id);


                if(response1.items.length == ++count){
                  sortStudents();
                }
              
            });
          });
        }).
        error(function(data, status, headers, config) {
          if (status == 401 && retry) {
            gdocs.removeCachedAuthToken(
                gdocs.auth.bind(gdocs, true, 
                    $scope.fetchStudentsOfClass.bind($scope, false)));
          }
      });
    }
    
  };

  $scope.fetchClass = function(retry){
    this.clearDocs();
    $scope.fetchStudentsOfClass(true, $scope.classIDs[$scope.activeClass]);
    
  }

  $scope.fetchFolderContents = function(retry, folderID) {
    if (gdocs.accessToken) {
      var config = getConfig("items(id)");


      $http.get(gdocs.DOCLIST_FEED+"/"+folderID+"/children", config).
        success(successChildren).error(function(data, status, headers, config) {
          if (status == 401 && retry) {
            gdocs.removeCachedAuthToken(
                gdocs.auth.bind(gdocs, true, 
                    $scope.fetchFolderContents.bind($scope, false)));
          }
      });
    }
  };



  $scope.markAsResolved = function(){
    startLoading(); 

    var config = getConfig("id,description,title");

    var data = {"description":"Feedback"};

    $http.put(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id, data, config).success(function(response, status, headers, confg){
      $scope.fetchClass();
      stopLoading();
    });
    
    
    
  }

  $scope.openFile = function($event){
    window.open($scope.selected.children[0].children[1].dataset.link);
  }

  $scope.shareFileDialogue = function(){
    $.fancybox.open({
      href : '#shareFileContainer',
      type : 'inline',
      padding : 5,
      afterClose: function() { 
        $("form").each(function(){
          $(this)[0].reset();
          
        });
      }
    }); 
    
  }

  $scope.classViewSettings = function(){

    settingsIndex =0;
    $("#settingsContainer").css("transform","translateX(0px)");

    $.fancybox.open({
      href : '#inline5',
      type : 'inline',
      padding : 5,
      afterClose: function() { 
        $("form").each(function(){
          $(this)[0].reset();
          
        });
      }
    });
  }

  $scope.shareFile = function(){
    $scope.checkboxes = $("input[title]:checked");
    var fileInfo = $scope.selected.children[0].children[1].dataset;
    var data = {"title":fileInfo.title,
     "id":fileInfo.id};
    $scope.copyFile(data);
    $scope.closeFancyBox();

  }

  $scope.deleteFileDialogue = function(){
    $.fancybox.open({
      href : '#deleteFileContainer',
      type : 'inline',
      padding : 5,
      afterClose: function() { 
        $("form").each(function(){
          $(this)[0].reset();
          
        });
      }
    }); 
  }

  $scope.deleteFile = function(){
    startLoading();

    var config = getConfig();
    $http.delete(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id, config).success(function(){
      $scope.fetchClass();
      stopLoading();
    });
    $scope.closeFancyBox();
   }

  $scope.downloadFile = function(){
    var fileInfo = $scope.selected.children[0].children[1].dataset;

    var config = getConfig();
    config.responseType = 'blob';
    $http.get(fileInfo.downloadurl, config).success(function(response){

      var file = new Blob([response], {type: fileInfo.outmimetype});
      var fileSaver  = saveAs(file, fileInfo.title);
      var stop = 0;
    });
  }


  $scope.addNewFile = function(){
	  newFileState = "";

    transitionIndex = 0;
    $("#transitionContainer").css("transform","translateX(0px)");

    $.fancybox.open({
      href : '#inline3',
      type : 'inline',
      padding : 5,
      afterClose: function() {
        $("#testFile")[0].value = "";
        $("form").each(function(){
          $(this)[0].reset();
        });
      }
    });
  }

  $scope.addNewStudent = function(){
    var manageIndex = 0;
    $("#inline4").css("transform","translateX(0px)");

    $("#warning")[0].innerHTML= "";

    $.fancybox.open({
      href : '#inline4',
      type : 'inline',
      padding : 5,
      afterClose: function() {
        $("form").each(function(){
          $(this)[0].reset();
        });
      }
    });
  }


  $scope.closeFancyBox = function(){
    $("form").each(function(){$(this)[0].reset();});
    $.fancybox.close();
  }

  // Toggles the authorization state.
  $scope.toggleAuth = function(interactive) {
    if (!gdocs.accessToken) {
      gdocs.auth(interactive, function() {
        getUserInfo();
        $scope.fetchClassList(false);
        showContent();
      });
    } else {
      gdocs.revokeAuthToken(function() {});
      this.clearDocs();
      this.clearClasses();

      hideContent();
    }
  }

  // Controls the label of the authorize/deauthorize button.
  $scope.authButtonLabel = function() {
    if (gdocs.accessToken)
      return 'Sign Out';
    else
      return 'Sign In';
  };

  $scope.toggleAuth(false);

}

DocsController.$inject = ['$scope', '$http', 'gdocs']; // For code minifiers.

// Init setup and attach event listeners.
document.addEventListener('DOMContentLoaded', function(e) {

  // FILESYSTEM SUPPORT --------------------------------------------------------
  window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(localFs) {
    fs = localFs;
  }, onError);
  // ---------------------------------------------------------------------------
});


hideContent = function () {
  document.getElementById('classFolders').style.visibility = 'hidden';
  document.getElementById('classFolderTabs').style.visibility = 'hidden';
  document.getElementById('notLoggedInMessage').style.visibility = 'visible';
  document.getElementById('notLoggedInMessage').style.height = 'auto';
  document.getElementById('noClassViewClasses').style.visibility = 'hidden';
  document.getElementById('userWelcome').style.visibility = 'hidden';
  document.getElementById('classViewSettings').style.visibility = 'hidden';
}
    
showContent = function () {
  document.getElementById('classFolders').style.visibility = 'visible';
  document.getElementById('classFolderTabs').style.visibility = 'visible';
  document.getElementById('notLoggedInMessage').style.visibility = 'hidden';
  document.getElementById('notLoggedInMessage').style.height = '0px';
  document.getElementById('noClassViewClasses').style.visibility = 'visible';
  document.getElementById('userWelcome').style.visibility = 'visible';
  document.getElementById('classViewSettings').style.visibility = 'visible';
}
