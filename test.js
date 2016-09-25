//var testString = 'href="/images/test.jpg';

//console.log(testString.replace(new RegExp('href="/(?!(http))', 'g'), 'href="http://ww.test/'));
/*var cheerio = require("cheerio");

var $ = cheerio.load("<html><body></body></html>");

console.log($("body").parent().html());*/

/*var MongoClient = require('mongodb').MongoClient;

// Connection url
var url = 'mongodb://localhost:27017/test';
// Connect using MongoClient
MongoClient.connect(url, function(err, db) {
    // Create a collection we want to drop later
    var col = db.collection('createIndexExample1');
    col.findOne({a:1},function(err, items) {
        console.log(items)
        //test.equal(null, err);
        //test.equal(4, items.length);
        db.close();
    });
    // Insert a bunch of documents
    /*col.insert([{a:1, b:1}, {a:2, b:2}, {a:3, b:3}, {a:4, b:4}], {w:1}, function(err, result) {
        //db.close();


    });
});*/
var moment = require("moment-timezone");
console.log(moment().tz("America/Sao_Paulo").format('llll'));
/*var testString = 'background-image:url("/Content/images/bg.jpg");)';

testString = testString.replace(new RegExp("url\\((\"|'|&apos;)([^)]*)(\"|'|&apos;)\\)", 'ig'), 
    function(match, cap1, cap2, cap3, index, source) {
        /*console.log(cap1);
        console.log(cap2);
        console.log(cap3)
        console.log(match);
        return match;

        urlPath = "http://example.com";

        //If the match has already a full url, do not modify
        if(cap2.indexOf("http") == 0 || cap2.indexOf("//") == 0 || cap2.indexOf("#") == 0)
            return match; 

        //If the cap url do not have a bar in the front, add it
        var matchUrl = cap2.indexOf("/") == 0 ? cap2 : "/" + cap2;

        return 'url("' + urlPath + matchUrl + '")';
    });

console.log(testString);*/