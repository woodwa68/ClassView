chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('../main.html', {
    id: "GDriveExample",
    bounds: {
      width: 1000,
      height: 1000
    },
    minWidth: 935,
    minHeight: 600,
    /*frame: 'none'*/
  });
});

chrome.runtime.onInstalled.addListener(function() {
  console.log('installed');
});

chrome.runtime.onSuspend.addListener(function() { 
  // Do some simple clean-up tasks.
});
