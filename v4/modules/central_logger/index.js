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
module.exports = async function (req, res) {
    try {
        var input = "";
        if (req.params.reqId)
            input = req.params.reqId;

        if (req.body.reqId)
            input = req.body.reqId;

        if (!input) {
            res.send({status: 200, error: "reqId is missing", log: {}});
            return;
        }

        if (!input) {
            res.send({status: 200, error: "reqId is missing", log: {}});
            return;
        }
        var central_api_log_collection = "";
        var move_api_log_collection = "";
        var res_body = "";
        central_api_log_collection = local_child_db.collection("central_api_logger18Jan18");
        move_api_log_collection = local_child_db.collection("move_data_api_log");

        var central_log = await central_api_log_collection.findOne({"reqId": input});
        res_body = central_log["response"];
        if (!central_log) {
            res.send({status: 204, error: "reqId  Not Found"});
            return;
        }

        var move_api_data_log = [];
        var req_body = "";
        var logs = central_log["logs"];

        var reqIds = await move_api_log_collection.findOne({"req_reference_Id": input});



        if (reqIds) {
            var move_api_reqIds = []
            move_api_reqIds = reqIds.reqId_fp_id;
            for (let doc of move_api_reqIds) {
                let value = await move_api_log_collection.findOne({"reqId": doc.reqId});
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



        res.send({status: 200,central_log, move_api_data_log, req_body,res_body});
        return;
    } catch (E) {
        res.send(E.message);
        return;
    }

};