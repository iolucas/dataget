//var testString = 'href="/images/test.jpg';

//console.log(testString.replace(new RegExp('href="/(?!(http))', 'g'), 'href="http://ww.test/'));
var cheerio = require("cheerio");

var $ = cheerio.load("<html><body></body></html>");

console.log($("body").parent().html());