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

$(document).ready(function() {

  var $scope = angular.element("body").scope();

  
  $(document).on("mousedown", function(e){

    //if the user clicks one of the buttons on the button bar
    if(e.target.id == "markComplete" || e.target.id == "openFile" || e.target.id == "downloadFile" || e.target.id == "getHelp"){
      $("#fileButtonBar").css("visibility", "default");
    }
    else{
      $("#fileButtonBar").css("visibility", "hidden");
      $(".li").removeClass("selected");

      //if the user clicks a file;
      if(e.target.parentNode.className == "flexRows file ng-scope"){
        $(e.target.parentNode.children).addClass("selected");
        $("#fileButtonBar").css("visibility", "default");
        $scope.selected = e.target.parentNode;
      }
    }
  });

    window.onresize = function(event) {
      $scope.resizeTabs();
    };

    
    $('input:text, textarea').each(function(){
      var $this = $(this);
      $this.data('placeholder', $this.attr('placeholder'))
           .focus(function(){$this.removeAttr('placeholder');})
           .blur(function(){$this.attr('placeholder', $this.data('placeholder'));});
    });

  });


function onError(e) {
  console.log(e);
}

function startLoading(){
  $("#loading").css("visibility", "visible");
}

function stopLoading(){
  $("#loading").css("visibility", "hidden");
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

  return gdocs;
});

// Main Angular controller for app.
function DocsController($scope, $http, gdocs) {


  var colorIndex = 0;

  $scope.checkboxes;

  $scope.activeClass = '';
  $scope.filesToUpload;
  $scope.userInfo = {};

  $scope.selected = undefined;

  $scope.showAddClass = false;

  $scope.classIDs = new Object();
 
  $scope.classButtons = [];

  $scope.students = new Object();
  $scope.sorted = [];
  
  var w = document.body.clientWidth;

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
    
    $scope.students[data.id].email = data.description;
    $scope.students[data.id].studentFiles = [];

  }



  $scope.clearClasses= function() {
    $scope.classList= [];
    $scope.classButtons=[];
    $scope.classIDs = new Object();
  };

  $scope.fetchClassList= function(retry) {
    this.clearClasses();


      if (gdocs.accessToken) {
        var config = getConfig("items(id,title)", "title contains 'ClassViewClass -'");


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
    
    var classes = [];

    var totalEntries = resp.items.length;


    resp.items.forEach(function(entry, i) {
		
	  var stripped1 = entry.title.substr(entry.title.indexOf("-")+2);
	  
	  var stripped2 = stripped1.substr(0,stripped1.indexOf("-")-1);
	  
    $scope.classIDs[stripped2] = entry.id;
	  $scope.classButtons.push(stripped2);

    });

    
  
  }

  function successChildren(resp, status, headers, config) {
    


    resp.items.forEach(function(child, i) {
      
      var config = getConfig("kind,labels,description,mimeType,exportLinks,id,title,downloadUrl,parents,alternateLink,modifiedDate,iconLink");

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
      else if(entry.mimeType == "application/vnd.google-apps.presentation")outMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
        var doc = {
          mimeType : entry.mimeType,
          outMimeType : (outMimeType == undefined ? entry.mimeType : outMimeType),
          title: entry.title,
          updatedDate: Util.formatDate(entry.modifiedDate),
          updatedDateFull: entry.modifiedDate,
          icon: entry.iconLink,
          alternateLink: entry.alternateLink,
          id: entry.id,        
          downloadurl: entry.downloadUrl!=undefined ? entry.downloadUrl : entry.exportLinks[outMimeType],
          viewed: entry.labels.viewed,
          completed: false,
          help : false,
          feedback : false
        };

        if(entry.description != undefined && entry.description.indexOf("Completed")!=-1) doc.completed = true;
        if(entry.description != undefined && entry.description.indexOf("Help")!=-1) doc.help = true;
        if(entry.description != undefined && entry.description.indexOf("Feedback")!=-1) doc.feedback = true;

        doc.iconFilename = doc.icon.substring(doc.icon.lastIndexOf('/') + 1);
      
      var config = getConfig("items(content)");

      // If file exists, it we'll get back a FileEntry for the filesystem URL.
      // Otherwise, the error callback will fire and we need to XHR it in and
      // write it to the FS.
      var fsURL = fs.root.toURL() + FOLDERNAME + '/' + doc.iconFilename;

      window.webkitResolveLocalFileSystemURL(fsURL, function(entry) {
        console.log('Fetched icon from the FS cache');

        doc.icon = entry.toURL(); // should be === to fsURL, but whatevs.

        $scope.students["TESTSTUDENTID"].studentFiles.push(doc); //doesn't actually matter what we pass in here

        $scope.$apply(function($scope) {}); // Inform angular we made changes.
          
        
      }, function(e) 
{
        $http.get(doc.icon, {responseType: 'blob'}).success(function(blob) {
          console.log('Fetched icon via XHR');

          blob.name = doc.iconFilename; // Add icon filename to blob.

          writeFile(blob); // Write is async, but that's ok.

          doc.icon = window.URL.createObjectURL(blob);

          
        });
  
      });
   
  }

  

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

  $scope.resizeTabs = function(){

    // since we are now displaying class tabs, let's display the add new class tab
    $scope.showAddClass = 'true';

    var tabs = $('nav')[0].children;
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].style.width = (document.body.clientWidth - 2*(5+1+2)*(tabs.length)-0) / (tabs.length)+"px";
      if($(tabs[i]).width() > 250) tabs[i].style.width = "250px";
      } 
  }


  $scope.setClassColor = function(index){
    if(index % 4 == 0){
      document.body.style.background = "#0095d6";
      $scope.updateButtonBarColor();
      return "blueTab";
    }
    else if(index % 4 == 1){
      document.body.style.background = "#a0cf67";
      $scope.updateButtonBarColor();
      return "greenTab";
    }
    else if(index % 4 == 2){
      document.body.style.background = "#ffe14f";
      $scope.updateButtonBarColor();
      return "yellowTab";
    }
    document.body.style.background = "#ff1f40";
    $scope.updateButtonBarColor();
    return "redTab";
  }

  $scope.setActiveClass = function(_activeClass, index){
      for(var i = 0; i < $scope.classButtons.length; i++) $('nav')[0].children[i].style.zIndex = 1;
      $('nav')[0].children[index].style.zIndex = 3;
      $scope.clearDocs();
      $scope.activeClass = _activeClass;

      $scope.fetchClass(true, $scope.classIDs[_activeClass]);
  }

  $scope.isActive = function(c){
      return (c == $scope.activeClass);
  }

  $scope.clearDocs = function() {
    $scope.students = new Object();
  };

  
  $scope.fetchStudentsOfClass = function(retry, classID) {
    if (gdocs.accessToken) {
      var config = getConfig("items(id)", "title contains 'ClassViewClass - "+$scope.activeClass+" - ' and mimeType = 'application/vnd.google-apps.folder'");

      var count =0;
      $http.get(gdocs.DOCLIST_FEED+"/"+classID+"/children", config).
        success(function(response1, status, headers, confg){
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

    $scope.students["TESTSTUDENTID"] = {};
    $scope.students["TESTSTUDENTID"].studentFiles = []; // doesn't matter what we pass in here....
    $scope.fetchFolderContents(true, $scope.classIDs[$scope.activeClass]);
    
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

  $scope.openFile = function($event){
    window.open($scope.selected.children[0].children[1].href);
  }


  $scope.markAsComplete = function(){
    startLoading();

    var config = getConfig("id,description,title");

    var data = {"description":"Completed"};

    $http.put(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id, data, config).success(function(response, status, headers, confg){
      $scope.fetchClass();
      stopLoading();
    });
    
    
    
  }

  $scope.getHelp= function(){
    $.fancybox.open({
      href : '#getHelpContainer',
      type : 'inline',
      padding : 5,
      afterClose: function() { 
        $("form").each(function(){
          $(this)[0].reset();
        });
      }
    }); 
  }


  $scope.submitHelp = function(){
    var data = {"content":document.getElementById("helpContent").value};

    var config = getConfig();
    $http.post(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id+"/comments", data, config).success(function(response, status, headers, confg){});
     
    startLoading();

    config = getConfig("id,description,title");

    data = {"description":"Help"};

    $http.put(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id, data, config).success(function(response, status, headers, confg){
      $scope.fetchClass();
      stopLoading();
    });

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
    var config = getConfig();
    $http.delete(gdocs.DOCLIST_FEED+"/"+$scope.selected.children[0].children[1].dataset.id, config);
    $scope.closeFancyBox();
    
    //setTimeout probably not the best way to do this
    //if we could get a http response after delete, would be better
    setTimeout(function(){
      $scope.fetchClass();
    },3000);

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


  $scope.updateButtonBarColor = function(){
      var currentTabColor = document.body.style.background;
      document.getElementById("buttonBarDiv").style.backgroundColor = currentTabColor;
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
  document.getElementById('refreshFeed').style.visibility = 'hidden';
  document.getElementById('classFolderTabs').style.visibility = 'hidden';
  document.getElementById('notLoggedInMessage').style.visibility = 'visible';
  document.getElementById('notLoggedInMessage').style.height = 'auto';
  document.getElementById('userWelcome').style.visibility = 'hidden';
  document.getElementById('buttonBarDiv').style.visibility = 'hidden';
}
    
showContent = function () {
  document.getElementById('classFolders').style.visibility = 'visible';
  document.getElementById('refreshFeed').style.visibility = 'visible';
  document.getElementById('classFolderTabs').style.visibility = 'visible';
  document.getElementById('notLoggedInMessage').style.visibility = 'hidden';
  document.getElementById('notLoggedInMessage').style.height = '0px';
  document.getElementById('userWelcome').style.visibility = 'visible';
  document.getElementById('buttonBarDiv').style.visibility = 'visible';
}
