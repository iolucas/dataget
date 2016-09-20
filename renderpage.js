var phantom = require('phantom');
 
module.exports = {
    render: function(url, callback) {

        var sitepage = null;
        var phInstance = null;
        phantom.create()
            .then(instance => {
                phInstance = instance;
                return instance.createPage();
            })
            .then(page => {
                sitepage = page;

                //console.log(page);

                page.property("onResourceRequested", function(requestData, networkRequest) {
                //page.onResourceRequested = function(requestData, networkRequest) {
                    //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
                    //networkRequest.abort(); 
                    
                    var match = requestData.url.match(new RegExp(".*\.(jpg|jpeg|gif|png|bmp)", "ig"));
                    //console.log(match);
                    if (match != null) {
                        //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
                        networkRequest.abort(); 
                    }
                });


                return page.open(url);
            })
            .then(status => {
                //console.log(status);
                return sitepage.property('content');
            })
            .then(content => {
                //console.log(content);
                sitepage.close();
                phInstance.exit();
                callback(null, content);
            })
            .catch(error => {
                //console.log(error);
                phInstance.exit();
                callback(error);
            });
    }
}


