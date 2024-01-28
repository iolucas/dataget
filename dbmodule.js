var MongoClient = require('mongodb').MongoClient;
var moment = require("moment-timezone");

// Connection url
var url = 'mongodb://localhost:27017';

var collectionRef = null;

module.exports = {

    init: function(callback) {

        // Connect using MongoClient
        MongoClient.connect(url).then((client) => {
            // Create a collection we want to drop later
            db = client.db('test');
            collectionRef = db.collection('pagefragUrls');

            callback(null);
        }).catch((err) => {
            console.log(err);
            callback(err);
        });
    },

    insert: (data, callback) => {
        data.createdOn = moment().tz("America/Sao_Paulo").format('llll');

        collectionRef.insertOne(data).then((result) => {
            // console.log(result);
            callback(null);
        }).catch((err) => {
            callback(err);
        });
    },

    get: function(urlPath, callback) {
        collectionRef.findOne({path: urlPath}).then(function(result) {
            callback(null, result);
        }).catch((err) => {
            callback(err, null);
        });
    },

    listAll: function(callback) {
        collectionRef.find({}).toArray().then(function(results) {
            callback(null, results);
        }).catch((err) => {
            callback(err, null);
        });

    }
}