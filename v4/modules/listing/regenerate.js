var dbLogger = require(__dblogger);

var local_database_conn = require(__base).local_database;


var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);

var local_master_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_master"];
var local_child_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_child"];

var objcetId = require(__base).objcetId;
var sendToAnalysis = require('../save_leads_data/send_to_analysis.js');
var elastic_callback_url = `${mongo_elstic_collections_indexes.API_END_POINT}/v4/move_listing/to_elastic_mongo`;

module.exports = async function (req, res) {
    if (!req.body) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 412,
            error: "request must contain body"
        });
        return;
    }

    var listing_info = req.body;
    if (!listing_info || !listing_info.fp_id) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain fp_id");
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 412,
            error: "request must contain fp_id"
        });
        return null;
    }

    if (!listing_info.product_callback_url) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), "paraam product_callback_url is needed");
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 412,
            error: "paraam product_callback_url is needed"
        });
        return null
    }

    /* checking fp_id exist in mongo */
    var fp_id_collection = await getFpIdCollection(req, listing_info.fp_id)
    console.log("fp_id_collection ", fp_id_collection);

    if (fp_id_collection && fp_id_collection.error) {

        console.log("fp_id_collection inside ", fp_id_collection.error)
        dbLogger.setLogger(req.id, "ERROR", new Date(), (fp_id_collection.error).toString());
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 412,
            error: (fp_id_collection.error).toString()
        });
        return null;
    } else if (!fp_id_collection) {
        dbLogger.setLogger(req.id, "INFO", new Date(), "no document found for  " + listing_info.fp_id);
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 412,
            error: "no document found  for " + listing_info.fp_id
        });
        return null;
    }


    try {
        var requestInfo = {
            req_reference_id: req.id,
            product_callback_url: listing_info.product_callback_url,
            id: listing_info.fp_id.toString(),
            Authorization: req.headers.authorization,
            collection_name: fp_id_collection,
            priority: 1,
            monthly_refresh: "no",
            "can_create_version": req.body.can_create_version ? req.body.can_create_version : true

        };
        if (req.body.signals)
            requestInfo.signals = req.body.signals;
        if (req.body.custom_args)
            requestInfo.custom_args = req.body.custom_args;

        var anylysisInputDoc = {
            request_info: requestInfo,
            collection_name: fp_id_collection,
            "type": "single",
            id: listing_info.fp_id.toString(),
            "callback_url": elastic_callback_url,
            "key": "sa2asd78erfd4354sedrf32dsdf44"

        };
        console.log("elastic calback url in regenerate----------------------");
        console.log(elastic_callback_url);
        dbLogger.setLogger(req.id, "INFO", new Date(), "sent " + listing_info.fp_id + " to Analysis Engine");
        dbLogger.setLogger(req.id, "SEND_ANALYSIS_REQ_BODY", new Date(), anylysisInputDoc);
        let analysis_acknowledge = await sendToAnalysis(anylysisInputDoc);
        dbLogger.setLogger(req.id, "INFO", new Date(), "Recieved Acknowldge from Analysis Engine for " + listing_info.fp_id);
//        console.log("analysis_acknowledge ", analysis_acknowledge)
        res.send(analysis_acknowledge);
    } catch (exception) {
        console.log("exception ", exception)
        dbLogger.setLogger(req.id, "ERROR", new Date(), "Something went wrong please try again");
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 500,
            error: "Something went wrong please try again"

        });
    }


};

function getFpIdCollection(req, fp_id) {

    return new Promise(async function (resolve, reject) {
        try {


            var database = local_database_conn.db(local_master_database_name);
            var collection_with_url = "leads_with_url";
            var with_url_collection_instance = database.collection(collection_with_url);
            var with_url_doc = await with_url_collection_instance.findOne({
                "_id": objcetId(fp_id)
            });


            if (with_url_doc) {
                var updateObj = with_url_doc;

                if (updateObj["api_info_log"]) {
                    updateObj["api_info_log"]["status"] = 1;

                } else {
                    updateObj["api_info_log"] = {};
                    updateObj["api_info_log"]["status"] = 1;

                }


                if (req.body.finetune_info)
                    updateObj["fine_tune_info"] = req.body.finetune_info;



                with_url_collection_instance.save(updateObj, function (err, updateMsg) {
                    if (err)
                        resolve({
                            "error": err
                        })
                    else
                        resolve(collection_with_url);
                    return null;
                });
            } else {
                var collection_without_url = "leads_without_url";
                var without_url_collection_instance = database.collection(collection_without_url);
                var without_url_doc = await without_url_collection_instance.findOne({
                    "_id": objcetId(fp_id)
                })
                if (without_url_doc) {
                    var updateObj = without_url_doc;

                    if (updateObj["api_info_log"]) {
                        updateObj["api_info_log"]["status"] = 1;

                    } else {
                        updateObj["api_info_log"] = {};
                        updateObj["api_info_log"]["status"] = 1;

                    }

                    if (req.body.finetune_info)
                        updateObj["fine_tune_info"] = req.body.finetune_info;

                    without_url_collection_instance.save(updateObj, function (err, updateMsg) {
                        if (err)
                            resolve({
                                "error": err
                            });
                        else
                            resolve(collection_without_url);
                        return null;
                    })
                } else {
                    resolve(null);
                }
            }


        } catch (exception) {
            resolve({
                "error": exception
            })
        }
    })
}
