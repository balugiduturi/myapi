//var logger = require(__base);
//var local_database = require(__base).local_database
var local_database_conn = require(__base).local_database;
var live_database_conn = require(__base).live_database;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
;

var local_master_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_master"];
var local_child_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_child"];

var live_master_database_name = mongo_elstic_collections_indexes.mongo_databases["live_master"];
var live_child_database_name = mongo_elstic_collections_indexes.mongo_databases["live_child"];
var dbLogger = require(__dblogger);
module.exports = function (reqId, req_reference_id, moved_info, updateCollection, document) {
    return new Promise(async function (resolve, reject) {
        try {
            var update_mogno_id = document["_id"]



            if (updateCollection === "leads_with_url" || updateCollection === "leads_without_url") {
                var local_data_db = local_database_conn.db(local_master_database_name);
            } else {
                var local_data_db = local_database_conn.db(local_child_database_name);
            }

            var local_data_collection = local_data_db.collection(updateCollection);

            if (updateCollection === "leads_with_url" || updateCollection === "leads_without_url") {
                var live_data_db = live_database_conn.db(live_master_database_name);
            } else {
                var live_data_db = live_database_conn.db(live_child_database_name);
            }

            var live_data_collection = live_data_db.collection(updateCollection);

            dbLogger.move_data_api_log_setLogger(reqId, "LEADS-MONGO-MOVE STARTS", new Date(), "LEADS-MONGO-MOVE STARTS");
            live_data_collection.save(document, function (insertion_err, save_msg) {
                var resolveObj = {};

                if (!moved_info["mongo"][updateCollection]) {
                    moved_info["mongo"][updateCollection] = [];
                }
                dbLogger.move_data_api_log_setLogger(reqId, "LEADS-MONGO-MOVE ENDS", new Date(), "LEADS-MONGO-MOVE ENDS");


                if (insertion_err) {
                    var obj = {
                        "_log.mongo_moved": false,
                        "_log.mongo_err_discription": insertion_err
                    };
                    local_data_collection.update({"_id": {$in: [update_mogno_id]}}, {$set: obj});
                    var move_info_err_obj = {mongo_moved: false, "doc_id": update_mogno_id, reason: insertion_err};
                    moved_info["mongo"][updateCollection].push(move_info_err_obj);

                    var loggerObj = {mongo_moved: false, "doc_id": update_mogno_id, reason: insertion_err, "collection": updateCollection}
                    dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj);
                    resolveObj = {error: insertion_err};

                } else {
                    var obj = {
                        "_log.mongo_moved": true,
                        "_log.mongo_err_discription": null,
                        "dates.mongo_moved": new Date()
                    };

                    resolveObj = {error: null};
                    local_data_collection.update({"_id": {$in: [update_mogno_id]}}, {$set: obj});
                    var move_info_err_obj = {mongo_moved: true, "doc_id": update_mogno_id};
                    moved_info["mongo"][updateCollection].push(move_info_err_obj);

                    var loggerObj = {mongo_moved: true, "doc_id": update_mogno_id, "collection": updateCollection};
                }
                resolve(resolveObj);

            });

        } catch (Exception) {
            var loggerObj = {mongo_moved: false, "doc_id": update_mogno_id, reason: Exception.message, "collection": updateCollection}
            dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj);
            resolveObj = {error: Exception};
            var obj = {
                "_log.mongo_moved": false,
                "_log.mongo_err_discription": Exception
            };

            document["_log"]["mongo_moved"] = false;
            document["_log"]["mongo_err_discription"] = Exception;
            local_data_collection.update({"_id": {$in: [update_mogno_id]}}, {$set: obj});
            var move_info_err_obj = {mongo_moved: false, "doc_id": update_mogno_id, reason: Exception.message};
            moved_info["mongo"][updateCollection].push(move_info_err_obj)

            resolve(resolveObj);
        }

    });


};


///dates:{lived_moved:new Date()}
