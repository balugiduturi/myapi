/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const MongoClient = require('mongodb').MongoClient;
var localDbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";

var MongoSettings = {
    source: {
        database: "data_us",
        collection: "leads_with_url"
    },
    dest: {
        database: "test",
        collection: "leads_with_url"
    }
};
var limit = 5000;
(async function () {
    var local_connection = await MongoClient.connect(localDbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
    console.log("connection established");
    var source_dbo = local_connection.db(MongoSettings.source.database);
    var source_collection = source_dbo.collection(MongoSettings.source.collection);

    var dest_dbo = local_connection.db(MongoSettings.dest.database);
    var dest_collection = dest_dbo.collection(MongoSettings.dest.collection);


    cursor = await source_collection.find({}).limit(limit);
    var total_count = await cursor.count();
    console.log("totalcount ----", total_count);
    var count = 0;
    cursor.forEach(async (doc) => {
        if (doc !== null) {
            await dest_collection.save(doc);
            count = count + 1;
            if (count % 100 === 0) {
                console.log("count--", count);
            }

            if (count === limit) {
                console.log("ALL DONE!");
                process.exit(0);
            }
        }
    });

})();
