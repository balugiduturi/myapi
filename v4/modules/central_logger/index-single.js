/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var logger = require(__base);
var ObjectId = require(__base).objcetId;
var local_database_conn = require(__base).local_database;
const atob = require('atob');
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["api_log_db"]);
module.exports = async function (req, res, next) {
    try {


        if (req.params.size && req.params.size.length > 5) {

            next();
            return;
        }


        var central_api_log_collection = "";
        var move_api_log_collection = "";

        central_api_log_collection = local_child_db.collection("central_api_logger18Jan18");
        move_api_log_collection = local_child_db.collection("move_data_api_log");
        var size_limit = req.params.size ? req.params.size : 1;
        if (size_limit > 5) {
            res.json({status: 412, error: "Not greater than 5"});
            return;
        }
        var list_central_logs = await central_api_log_collection.find({}).limit(parseInt(size_limit)).sort({_id: -1}).toArray();




        if (!list_central_logs) {
            res.json({status: 204, error: "Not Found"});
            return;
        } else {
            var logs_list = []
            for (let central_log in list_central_logs) {

                var move_api_data_log = [];
                var req_body = "";
                var logs = list_central_logs[central_log]["logs"];
                var input_reqId = list_central_logs[central_log].reqId;

                var reqIds = await move_api_log_collection.findOne({"req_reference_Id": input_reqId});

                if (reqIds) {
                    var move_api_reqIds = []
                    move_api_reqIds = reqIds.reqId_fp_id;
                    for (let doc in move_api_reqIds) {
                        let value = await move_api_log_collection.findOne({"reqId": move_api_reqIds[doc].reqId});
                        move_api_data_log.push(value);
                    }
                }

                if (logs) {
                    for (let eachlog of logs) {

                        if (eachlog["type"] === "REQ_BODY") {
                            req_body = JSON.parse(atob(eachlog["message"]));
                        }

                    }
                }
                var eachList = list_central_logs[central_log];
                logs_list.push({eachList, move_api_data_log, req_body});
            }





            res.json({logs_list});
            return;
        }


    } catch (E) {
        res.send(E.message);
        return;
    }

};