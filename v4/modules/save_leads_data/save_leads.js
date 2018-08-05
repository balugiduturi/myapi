
var local_database_conn = require(__base).local_database;
var _ = require('underscore');

var logger = require(__base);
var dbLogger = require(__dblogger);
var db_name = require(__base).db_name;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_data_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);

var move_listing_url = `${mongo_elstic_collections_indexes.API_END_POINT}/v4/move_listing/to_elastic_mongo`;
var sendToAnalysis = require('./send_to_analysis.js');
var send_to_bulk_Analysis = require('./send_to_bulk_analysis.js');


function save(collection_name, leadsData) {

    return new Promise((resolve, reject) => {
        var collection = "";
        if (collection_name === 'leads_with_url') {
            collection = local_master_data_db.collection("leads_with_url");

        } else if (collection_name === 'leads_without_url') {
            collection = local_master_data_db.collection("leads_without_url");
        } else if (collection_name === 'failed_listings_to_insert') {

            collection = local_master_data_db.collection("failed_listings_to_insert");
        } else {
            collection = local_master_data_db.collection(`${collection_name}`);
        }
        collection.save(leadsData, function (failedError, doc) {
            if (failedError) {
                reject(failedError);
            } else {
                if (!doc) {
                    reject(new Error("Failed to save in staging DB"));
                } else {
                    resolve(doc);
                }
            }
        });

    });
}

var saveToLeadsSingle = function (requestInfo, collection_name, leadsData) {
    return new Promise(async (resolve, reject) => {

        try {

            var doc = await save(collection_name, leadsData);
            var id = "";
            for (let key in doc.ops) {
                id = doc.ops[key]._id;
            }
            console.log("save leads single ----", id);
            if (id) {
                resolve(id);
            } else {
                reject(new Error("fpId is missing"));
            }

        } catch (E) {
            reject(E);
        }


    });
};

var updateTOLeadsSingle = function (requestInfo, collection_name, leadsData) {
    return new Promise(async (resolve, reject) => {

        try {

            var doc = await save(collection_name, leadsData);
            var id = "";
            console.log("upadateresult");
            console.log(doc.result.nModified);
            if (doc.result.nModified)
                id = leadsData._id;

            console.log("update to leads With single --------", id);
            if (id) {
                resolve(id);
            } else {
                reject(new Error("failed to update in correntin"));
            }


        } catch (E) {
            reject(E);
        }


    });
};

var sendSingleAnalysis = function (requestInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("move_listing_url in save leads---", move_listing_url);
            let body = {
                request_info: requestInfo,
                "type": "single",
                id: requestInfo.id.toString(),
                "callback_url": move_listing_url,
                "key": "sa2asd78erfd4354sedrf32dsdf44"
            };
            let result = await sendToAnalysis(body);
            dbLogger.setLogger(requestInfo.req_reference_id, "SINGLE_ANALYSIS_REQUEST_BODY", new Date(), body);
            dbLogger.setLogger(requestInfo.reqId, "INFO", new Date(), "Sent to Analysis");
            resolve(result);
        } catch (E) {
            reject(E);
        }
    });
};
var saveToLeadsBulk = function (requestInfo, collection_name, leadsData) {
    return new Promise(async (resolve, reject) => {

        try {
            var doc = await save(collection_name, leadsData);
            var id = "";
            for (let key in doc.ops) {
                id = doc.ops[key]._id;
            }
            if (id) {
                resolve(id);
            } else {
                reject(new Error("fpId is missing"));
            }


        } catch (E) {
            reject(E);
        }


    });
};
var sendBulkAnalysis = function (requestInfo, summary) {

    return new Promise(async (resolve, reject) => {
        /*
         * delete the last fp_id from reqINFO
         */
        delete requestInfo["id"];
        let body = {
            "request_info": requestInfo,
            "type": "multiple",
            "summary": summary,
            "batch_id": requestInfo.batch_id.toString(),
            "callback_url": move_listing_url,
            "key": "sa2asd78erfd4354sedrf32dsdf44"
        };

        dbLogger.setLogger(requestInfo.req_reference_id, "BULK_ANALYSIS_REQUEST_BODY", new Date(), body);
        let result = await send_to_bulk_Analysis(body);

        dbLogger.setLogger(requestInfo.reqId, "INFO", new Date(), "Sent to Analysis");
        resolve(result);
    });


};
var saveToFailedListings = function (requestInfo, collection_name, leadsData) {

    return new Promise(async (resolve, reject) => {

        try {
            let doc = await save(collection_name, leadsData);
            resolve(true);
        } catch (E) {
            reject(E);
        }


    });
};


var saveBatchStatus = function (data) {
    return new Promise(async (resolve, reject) => {
        try {
            await save("addlisting_batch_status", data);
            resolve(true);
        } catch (E) {
            reject(E);
        }

    });
};
module.exports.updateTOLeadsSingle = updateTOLeadsSingle;
module.exports.saveBatchStatus = saveBatchStatus;
module.exports.sendSingleAnalysis = sendSingleAnalysis;
module.exports.sendBulkAnalysis = sendBulkAnalysis;
module.exports.saveToFailedListings = saveToFailedListings;
module.exports.saveToLeadsSingle = saveToLeadsSingle;
module.exports.saveToLeadsBulk = saveToLeadsBulk;

  