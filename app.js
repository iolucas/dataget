var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var http = require("http");
var https = require("https");

var urlParser = require('url');

var cheerio = require('cheerio');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


var storedPages = [];


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static('public'));

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

    var pageData = storedPages[parseInt(req.params.pageId)];

    if(pageData) {
        
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
    } else {
        res.send("Page Not Found");
    }    
});

app.post('/setpage', function(req, res) {
    storedPages.push(req.body);
    var pageNum = storedPages.length - 1;
    res.send("Done. Page number: " + pageNum);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


function getPageAndFormat(pageUrl, callback) {
    httpGet(pageUrl, function(error, htmlData) {
        
        //console.log(htmlData.indexOf("\n"));
        //htmlData.replace(/\\n/ig, "");
        callback(formatWebPage(htmlData, pageUrl))
    });
}

function getValueByInstruction(instruction, $) {

    //if(htmlData)
        //var $ = cheerio.load(htmlData);

    console.log(instruction);
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

    console.log(parentElement.prop("tagName"));
    console.log(parentElement.text().substr(0,30));

    //Get the text of the last parent element
    return parentElement.text();
}



//Function to format webpage to match dataget requirements
function formatWebPage(htmlData, pageUrl) {

    //Do this first part to ensure the document is in the right html format

    //Remove every html tag from the page to ensure there is only one html tag
    htmlData = htmlData.replace(new RegExp("<html>", "ig"), "");
    htmlData = htmlData.replace(new RegExp("</html>", "ig"), "");
    //Remove end body tags too
    htmlData = htmlData.replace(new RegExp("</body>", "ig"), "");

    htmlData = "<!DOCTYPE html><html>" + htmlData + "</body></html>";

    //Remove all line skip special chars
    htmlData = htmlData.replace(new RegExp("\n|\r|\t", "ig"), "");

    //Keep only the first <body>, replace the rest with ""
    var notFirstBodyFlag = false;
    htmlData = htmlData.replace(/<body>/ig, function(match, index) {
        if(notFirstBodyFlag)
            return "";
        
        notFirstBodyFlag = true;
        return "<body>";
    });

    //Get url data such as host, path etc
    var urlData = urlParser.parse(pageUrl);

    //Append native links the host url
    htmlData = addUrlsHost(htmlData, '//' + urlData.host);

    //Load it on cheerio (jQuery like module)
    var $ = cheerio.load(htmlData);

    

    //Remove all scripts
    $("script").remove();

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

    //Add selectable to every class
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
        .append('<script src="jquery-3.1.0.js"></script>')
        .append('<script src="dataget_script.js"></script>')
        .append('<script>var targetPageUrl = "' + pageUrl + '";</script>');

    $("head").append('<link href="dataget_style.css" type=text/css rel=stylesheet>');

    return $.html();
}


function addUrlsHost(pageData, urlPath) {

    return pageData.replace(/(href|src)=("|\')([\S]+)("|\')/ig, 
        function(match, cap1, cap2, cap3, cap4, index, source) {
            //If the match has already a full url, do not modify
            if(cap3.indexOf("http") == 0 || cap3.indexOf("//") == 0 || cap3.indexOf("#") == 0)
                return match; 

            //If the cap url do not have a bar in the front, add it
            var matchUrl = cap3.indexOf("/") == 0 ? cap3 : "/" + cap3;

            return cap1 + '="' + urlPath + matchUrl + '"';
        });
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