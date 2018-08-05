/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var dbLogger = require(__dblogger);
var db_name = require(__base).db_name;
var live_database_conn = require(__base).live_database;
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var live_ds = live_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["live_ds"]);

module.exports = function (req, res) {
    try {
        var product_list = live_ds.collection("recommended_product_list");
        product_list.find({}, {"product_id": 1, "title": 1, "_id": 0}).toArray(function (err, productArray) {
            if (err) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), err);
                dbLogger.logRespTime(req.id, new Date());
                res.send({"error": {"status": 500, "message": "Internal Server Error"}});
            } else {
                dbLogger.logRespTime(req.id, new Date());
                res.send({product_list: productArray, "meta": {status: 200, "message": "Success"}});
                //console.log("Product Array: ", productArray);
            }
        });
    } catch (execption) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), err);
        dbLogger.logRespTime(req.id, new Date());
        res.send({"error": {"status": 500, "message": "Internal Server Error"}});
    }
};