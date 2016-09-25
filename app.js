//Http server
var express = require('express');
var app = express();

//Middleware to handle post data from express server
var bodyParser = require('body-parser');

//Modules to perform http requests
var http = require("http");
var https = require("https");

//Extract url data
var urlParser = require('url');

//Jquery like html parser
var cheerio = require('cheerio');

var renderpage = require("./renderpage.js");

var dbconnection = require("./dbmodule.js");

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

//Module to handle filesystem
var fs = require("fs");

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

//Utils
/*String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};*/


//var storedPages = [];


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static(__dirname + '/public'));

app.get('/listAllDocuments', function (req, res) {
    dbconnection.listAll(function(err, results) {
        //console.log(results);
        res.send(JSON.stringify(results, null, "<br>"));
    });
});

//Must resolve cases of the target page has been redirected
app.get('/getpage', function (req, res) {

    res.charset = 'utf-8';

    var pageUrl = req.query.pageurl;    

    //Check if a url as been passed
    if(pageUrl) {
        getPageAndFormat(pageUrl, function(htmlData) {

            res.send(htmlData);

        });

    } else {
        res.send("No Url");
    }

});

app.get("/:pageId", function(req, res) {

    if(req.params.pageId == "favicon.ico") {
        // HTTP status 404: NotFound
        res.status(404).send('Not found');
        return;
    }

    //var pageData = storedPages[req.params.pageId];

    //var pageFormat = req.query.format || "text";
    //console.log(pageFormat);

    dbconnection.get(req.params.pageId, function(err, pageData) {

        if(err || pageData == null) {
            console.log(err);
            res.status(404).send('Page Not found');
            return;
        }

        if(pageData.instructions == "")
            return res.json([]);

        //console.log(req.params.pageId);
        //console.log(arguments);

        //Get page html data already formatted
        getPageAndFormat(pageData.pageUrl, function(htmlData) {

            var $ = cheerio.load(htmlData);

            var instructionsArray = JSON.parse(pageData.instructions);

            var returnValuesArray = [];

            for(var i = 0; i < instructionsArray.length; i++) 
                returnValuesArray.push(getValueByInstruction(instructionsArray[i], $));

            //console.log(returnValuesArray.substr(0, 100));
            res.json(returnValuesArray);
        });


    });
  
});

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
//var rString = randomString(7, '0123456789abcdefghijklmnopqrstuvwxyz');

app.post('/setpage', function(req, res) {
    if(req.body.instructions == "")
        return res.send("You haven't selected any fragment of the webpage!");


    var newPageId = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyz');

    dbconnection.insert({
        path: newPageId,
        pageUrl: req.body.pageUrl,
        instructions: req.body.instructions
    }, function(err) {
        if(err) {
            console.log(err);
            res.json(err);
            return;
        }

        //TODO: Must filter data received on post
        //storedPages[newPageId] = req.body;

        //var pageNum = storedPages.length - 1;

        var setPageHtml = fs.readFileSync("public/setpage.html", 'utf8');

        //Replace with address
        setPageHtml = setPageHtml.replace(new RegExp("<!-- NEW-PAGE-ADDRESS -->", "g"), newPageId);

        res.send(setPageHtml);


    });




    //res.send("Done. Page number: " + pageNum);
});


dbconnection.init(function(err) {

    if(err) {
        console.log(err);
        return;
    }

    // start server on the specified port and binding host
    app.listen(appEnv.port, '0.0.0.0', function() {
        // print a message when the server starts listening
        console.log("server starting on " + appEnv.url);
    });


});





function getPageAndFormat(pageUrl, callback) {

    renderpage.render(pageUrl, function(error, htmlData) {
        
        //console.log(htmlData.indexOf("\n"));
        //htmlData.replace(/\\n/ig, "");
        callback(formatWebPage(htmlData, pageUrl));
    });
    /*httpGet(pageUrl, function(error, htmlData) {
        
        //console.log(htmlData.indexOf("\n"));
        //htmlData.replace(/\\n/ig, "");
        callback(formatWebPage(htmlData, pageUrl))
    });*/
}

function getValueByInstruction(instruction, $, format) {

    //if(htmlData)
        //var $ = cheerio.load(htmlData);

    //console.log(instruction);
    var instructionStack = instruction.split(";");

    var parentElement;// = $(document);

    //If the first element is an id, set it as the parentElement and remove it from the list
    if(instructionStack[0].indexOf("#") == 0) {
        parentElement = $(instructionStack.shift());
    } else { //if no id is present, set the parent as the document
        //(for now get the html element and remove the first element of instruction queue)
        parentElement = $('html');
        instructionStack.shift();
    }


    while(instructionStack.length > 0) {

        //Decompose instruction and get tagname and index
        var currInstruction = instructionStack.shift().replace("]", "").split("[");

        var tagName = currInstruction[0];
        var tagIndex = currInstruction[1];

        //console.log(currInstruction);

        //console.log(parentElement.children(tagName));
        parentElement.children(tagName).each(function(i, rawElem) {
            //console.log(i + " " + tagIndex);
            
            //If the current index is not the tag index, continue the iteration
            if(i != tagIndex)
                return;

            //Update the parent element with the current element
            parentElement = $(rawElem);
        });

    }

    //console.log(parentElement.prop("tagName"));
    //console.log(parentElement.text().substr(0,30));

    //Get the content of the last parent element according to the specified format
    format = format || "";
    switch(format) {
        case "html":
            return parentElement.html();
        
        default:
            return parentElement.text();
    }
    //return parentElement.text();
}



//Function to format webpage to match dataget requirements
function formatWebPage(htmlData, pageUrl) {

    //Do this first part to ensure the document is in the right html format

    //Remove any additional !doctype, html or body tags
    var tagAppearedArray = [];
    /*htmlData = htmlData.replace(new RegExp("<(!doctype|html|body)[^>]*>", "ig"), function(fullMatch, cap1) {
        //console.log(fullMatch + " -> " + cap1);

        //If this is not the first tag of the type, remove it (return "")
        if(tagAppearedArray.indexOf(cap1) != -1)
            return "";
        
        //If the tag has not appeared before, add it o the tag appeared array 
        //and do nothing with it (return the full match)
        tagAppearedArray.push(cap1);
        return fullMatch;
    });*/

    //Remove every end html and body tags
    htmlData = htmlData.replace(new RegExp("</(html|body)[^>]*>", "ig"), "");

    //Append end body and html tags to the end of the document
    htmlData += "</body></html>";

    //Remove all line skip special chars
    //htmlData = htmlData.replace(new RegExp("\n|\r|\t", "ig"), "");

    //Get url data such as host, path etc
    var urlData = urlParser.parse(pageUrl);

    //Append native links the host url
    htmlData = addUrlsHost(htmlData, '//' + urlData.host);

    //Load it on cheerio (jQuery like module)
    var $ = cheerio.load(htmlData);

    
    //Remove all scripts
    $("script").remove();

    //Remove all meta tags
    $("meta").remove();

    //Remove all iframes
    $('iframe').remove();

    //Wrap any floating text to a <span> tag
    $("p, div").contents()
        .filter(function() {
            return this.nodeType === 3;
        })
        .wrap( "<span></span>" );

/*
    console.log($("#bolsas").contents().filter(function() { 
        return this.nodeType == 3; 
    }).each(function() {
        console.log(arguments);
    }));//[0].nodeValue = "The text you want to replace with" 
*/

    //Add selectable to every selectable class
    $("*").addClass('dataget-selectable');

    //Remove the class from the undesired elements
    $("html").removeClass('dataget-selectable');

    $("head").removeClass('dataget-selectable');
    $("title").removeClass('dataget-selectable'); 
    $("base").removeClass('dataget-selectable');
    $("link").removeClass('dataget-selectable');
    $("meta").removeClass('dataget-selectable');
    $("style").removeClass('dataget-selectable');

    $("link").removeClass('dataget-selectable');
    $("noscript").removeClass('dataget-selectable');
    $("script").removeClass('dataget-selectable');
    $("template").removeClass('dataget-selectable');

    //pageUrl = encodeURIComponent(pageUrl);

    $("body").removeClass('dataget-selectable');

    $("body").first()
        //.append('<script src="jquery-3.1.0.js"></script>')
        .append('<script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>')
        .append('<script src="dataget_min.js"></script>')
        .append('<script>var targetPageUrl = "' + pageUrl + '";</script>');

    $("head").append('<link href="dataget_style.css" type=text/css rel=stylesheet>');

    return $.html();
}


function addUrlsHost(pageData, urlPath) {

    var localPageData = pageData;

    //url('/Content/images/bg.jpg');

    localPageData = localPageData.replace(/(href|src)=("|\')([\S]+)("|\')/ig, 
        function(match, cap1, cap2, cap3, cap4, index, source) {

            //If the match has already a full url, do not modify
            if(cap3.indexOf("http") == 0 || cap3.indexOf("//") == 0 || cap3.indexOf("#") == 0 || cap3.indexOf("data:") == 0)
                return match; 

            //If the cap url do not have a bar in the front, add it
            var matchUrl = cap3.indexOf("/") == 0 ? cap3 : "/" + cap3;

            return cap1 + '="' + urlPath + matchUrl + '"';
        });
    
    localPageData = localPageData.replace(new RegExp("url\\((\"|'|&apos;)([^)]*)(\"|'|&apos;)\\)", 'ig'), 
        function(match, cap1, cap2, cap3, index, source) {
            /*console.log("--BEGIN MATCH--");
            console.log(match);
            console.log(cap1);
            console.log(cap2);
            console.log(cap3);
            console.log("--END MATCH--");*/

            //If the match has already a full url, do not modify
            if(cap2.indexOf("http") == 0 || cap2.indexOf("//") == 0 || cap2.indexOf("#") == 0 || cap2.indexOf("data:") == 0)
                return match; 

            //If the cap url do not have a bar in the front, add it
            var matchUrl = cap2.indexOf("/") == 0 ? cap2 : "/" + cap2;

            //return 'url("' + urlPath + matchUrl + '")';
            return 'url(' + urlPath + matchUrl + ')';

        });

    return localPageData;
}


function httpGet(url, callback) {

    var httpProtocol = url.indexOf("https") == 0 ? https : http;

    var recData = '';

    httpProtocol.get(url, function(res) {
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            recData += chunk;
        });

        res.on('end', function() {
            callback(null, recData);
        });

        res.on('error', function(e) {
            callback(e);		
        });

    }).on('error', (e) => {
        callback(e);
    });
}