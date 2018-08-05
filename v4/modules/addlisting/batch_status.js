/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
const customAsync = require('async');
var local_database_conn = require(__base).local_database;
var analysis_engine_db = local_database_conn.db("analysis_engine_db");
function checkBatchStatus(batchId) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";
            var data = {
                analysis_waiting: 0,
                analysis_started: 0,
                analysis_completed: 0,
                sent_to_product: 0,
                analysis_failed: 0,
                summary: ""
            };
            collection = analysis_engine_db.collection("leads_with_url");
            batch_status_collection = analysis_engine_db.collection("addlisting_batch_status");
            var cursor = await collection.find({"api_info_log.batch_id": batchId}).toArray();
            var summary = await batch_status_collection.findOne({"batch_id": batchId}, {_id: 0});
            data.summary = summary;
            if (cursor.length === 0) {
                reject(new Error("No listings found with this batch_id"));
            } else {
                customAsync.forEach(cursor, function (doc, cb) {
                    if (doc.api_info_log && doc.api_info_log.hasOwnProperty("status")) {
                        if (doc.api_info_log.status === 1) {
                            data.analysis_waiting = data.analysis_waiting + 1;
                            cb(null, true);
                        } else if (doc.api_info_log.status === 2) {
                            data.analysis_started = data.analysis_started + 1;
                            cb(null, true);
                        } else if (doc.api_info_log.status === 3) {
                            data.analysis_completed = data.analysis_completed + 1;
                            cb(null, true);
                        } else if (doc.api_info_log.status === 4) {
                            data.sent_to_product = data.sent_to_product + 1;
                            cb(null, true);
                        } else if (doc.api_info_log.status === 5) {
                            data.analysis_failed = data.analysis_failed + 1;
                            cb(null, true);
                        }

                    } else {
                        cb(new Error("No status available for this listing"));
                    }
                }, function (err) {
                    if (!err) {
                        resolve(data);
                        return;
                    } else {
                        reject(err);
                    }

                });
            }
        } catch (E) {
            reject(E);
        }
    });
}

module.exports = function (req, res) {
    (async function () {
        try {
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body"});
                return;
            }
            if (!req.body.batch_id) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "params must contain batch_id");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "params must contain batch_id"});
                return;
            }
            let batch_id = req.body.batch_id.trim();
            batch_id = batch_id.toString();
            var data = await checkBatchStatus(batch_id);
            res.send({
                data,
                meta: {"request_reference_id": req.id}
            });
        } catch (E) {
            res.send({
                status: 500, error: E.message, meta: {"request_reference_id": req.id}
            });
        }
    })();
};