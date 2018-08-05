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
        central_api_log_collection = local_child_db.collection("central_api_logger18Jan18");
        move_api_log_collection = local_child_db.collection("move_data_api_log");

        var central_log = await central_api_log_collection.findOne({"reqId": input});
        if (!central_log) {
            res.send({status: 204, error: "no req ID"})
            return;
        }
        var logs = central_log["logs"];

        var reqIds = await move_api_log_collection.findOne({"req_reference_Id": input});

        var central_log_message = "";
        var move_api_data_message = "";
        var move_api_data_log = [];

        if (logs) {
            central_log_message = logs[logs.length - 1];

        }

        if (reqIds) {
            var move_api_reqIds = [];
            move_api_reqIds = reqIds.reqId_fp_id;
            for (let doc of move_api_reqIds) {
                let value = await move_api_log_collection.findOne({"reqId": doc.reqId});
                move_api_data_log.push(value);
            }
            move_api_data_message = move_api_data_log[move_api_data_log.length - 1];
        }





        res.send({status: 200, central_log_message, move_api_data_message: move_api_data_message});
        return;
    } catch (E) {
        res.send(E.message);
        return;
    }

};