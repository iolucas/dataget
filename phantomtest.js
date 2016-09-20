// Simple Javascript example
/*
var page = require('webpage').create();
page.open('http://www.facebook.com.br/', function(status) {
  console.log("Status: " + status);
  if(status === "success") {
    page.render('example.png');
  }
  phantom.exit();
});*/

var page = require('webpage').create();

page.viewportSize = {
  width: 1280,
  height: 720
};

/*page.sonResourceRequested = function(requestData, networkRequest) {
    networkRequest.cancel(); 
    var match = requestData.url.match(/[.]\.js$/ig);
    if (match != null) {
        console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
        networkRequest.cancel(); 
    }
};*/

page.onResourceRequested = function(request, networkRequest) {
    var match = requestData.url.match(new RegExp(".*\.(jpg|jpeg|gif|png|bmp)", "ig"));
    console.log(match);
    if (match != null) {
        console.log(requestData.url);
        //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
        networkRequest.cancel(); 
    }
    //console.log(a1);
    //console.log('Request ' + JSON.stringify(request, undefined, 4));
};

page.open('http://www.climatempo.com.br/', function(status) {
  //console.log(page.content);
  page.render('example.png');
  /*var title = page.evaluate(function() {
    
    return document.documentElement.outerHTML
  });*/
  //console.log(title);
  /*console.log('Page title is ' + title);
  for (var key in title) {
      console.log(key);
  }*/
  phantom.exit();
});