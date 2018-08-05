/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var logger = require(__base);

var dbLogger = require(__dblogger);
var _ = require('underscore');

var saveLeads = require('../save_leads_data/save_leads.js');

var local_database_conn = require(__base).local_database;



var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);
var countrie_list = ["us", "ca", "nz", "gb", "au"];
var listing_validations = require(`${__v4root}/js/validations.js`);


function saveIntoCollections(collection_name, data) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";
            collection = local_child_db.collection(`${collection_name}`);
            await collection.save(data);
            resolve(true);
        } catch (E) {
            reject(E);
        }
    });
}


/*
 * 
 * get the element_path base on
 * element_key
 */

function getEachKey(value) {
    return new Promise(async (resolve, reject) => {
        try {
            collection = local_child_db.collection("master_keys_document");

            let doc = await collection.findOne({"element_key": value});
            if (!doc) {
                reject(new Error(`No Element with ${value} found`));
            } else {
                if (doc.element_path && doc.common_collection) {
                    resolve({element_path: doc.element_path, common_collection: doc.common_collection});
                } else {
                    reject(new Error(`Element path not found for ${value}`));
                }

            }

        } catch (E) {
            reject(E);
        }
    });
}

module.exports = function (req, res) {
    (async function () {
        try {
            var dp_collections = {
                "leadsData": {},
                "leads_with_url": {},
                "leads_without_url": {},
                "project_summary_data": {},
                "twitter_posts_data": {},
                "twitter_social_signals": {},
                "facebook_social_signals": {},
                "facebook_posts_data": {},
                "display_adbeat_data": {},
                "google_posts_data": {},
                "yext_info": {},
                "moz_data": {},
                "adwords_data": {},
                "seo_indexation": {},
                "tbl_elements": {},
                "brand_mentions_data": {},
                "technologies_data": {},
                "leads_with_url_test": {}
            };
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body", meta: {"req_reference_id": req.id}});
                return;
            }
            if (!req.body.listing_info) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "params must contain listing_info");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "params must contain listing_info", meta: {"req_reference_id": req.id}});
                return;
            }

            var listing_info = req.body.listing_info;
            if (!req.body.product_callback_url) {
                res.send({status: 412, error: "param product_callback_url is needed", meta: {"req_reference_id": req.id}});
                return;
            }

            /*
             * validation part
             */

            if (!listing_info.buzz_partner_id) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain buzz_partner_id");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "listing_info must contain buzz_partner_id", meta: {"req_reference_id": req.id}});
                return;
            }
            if (!listing_info.country_code) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain country_code");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "listing_info must contain country_code", meta: {"req_reference_id": req.id}});
                return;
            }
            if (!_.contains(countrie_list, listing_info.country_code)) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), ` country_code ${req.body.country_code} is not avaialable`);
                dbLogger.logRespTime(req.id, new Date());
                res.send({"status": 412, error: ` country_code ${req.body.country_code} is not avaialable`, meta: {"request_reference_id": req.id}});
                return;
            }
          
            if (!listing_info.business_website) {

                var failed_value = "";

                function validateListingInfo(value) {
                    if (!_.contains(Object.keys(listing_info), value)) {
                        failed_value = value;
                        return false;
                    } else {
                        if (!listing_info[`${value}`]) {
                            failed_value = value;
                            return false;
                        } else {
                            return true;
                        }

                    }
                }

                if (!listing_validations[`${listing_info.country_code}`].every(validateListingInfo)) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), `listing_info must contain ${failed_value}`);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 412, error: `listing_info must contain ${failed_value}`, meta: {"req_reference_id": req.id}});
                    return;
                }

            } else if (!listing_info.business_name) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain business_name");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "listing_info must contain business_name", meta: {"req_reference_id": req.id}});
                return;
            }



            var requestInfo = {
                req_reference_id: req.id,
                "product_callback_url": req.body.product_callback_url,
                id: "",
                "collection_name": "",
                Authorization: req.headers.authorization,
                priority: 1,
                monthly_refresh: "no",
                "can_create_version": req.body.can_create_version ? req.body.can_create_version : true

            };
            if (req.body.signals)
                requestInfo.signals = req.body.signals;
            if (req.body.custom_args)
                requestInfo.custom_args = req.body.custom_args;
            /*
             * 
             * preparing business paramas and will updatet listing below
             */
            var business = {
                listing_source: ["dp_private"],
                is_master_record: "no",
                "version": 0
            };
            /*
             * API info log status
             */

            var api_info_log = {
                "req_reference_id": req.id,
                "status": 1,
                "product_callback_url": req.body.product_callback_url

            };
            /*
             * 
             * addding elements against
             * master keys provided 
             */

            for (let key in listing_info) {
                try {
                    var element_path = "";
                    var temp_collection = "";
                    var element_data = await getEachKey(key);
                    temp_collection = element_data.common_collection;
                    element_path = element_data.element_path;
                    if (!dp_collections[`${temp_collection}`]) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), `No collection found for  ${key}`);
                        res.send({status: 204, error: `No collection  found for  ${key}`, meta: {"req_reference_id": req.id}});
                        return;
                    }



                } catch (E) {
                    console.log(E.message);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), E);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 500, error: E.message, meta: {"req_reference_id": req.id}});
                    return;
                }
                let nestedList = element_path.split(".");
                var temp = "";
                for (i = 0; i < nestedList.length; i++) {
                    if (i === 0) {
                        temp = temp + nestedList[i];
                    } else {
                        temp = temp + `.${nestedList[i]}`;
                    }
                    if (i === nestedList.length - 1) {
                        var exp = `dp_collections["${temp_collection}"].${temp} = listing_info[key]`;
                        eval(exp);
                    } else {
                        var keyExist = `dp_collections["${temp_collection}"].${temp}`;
                        if (!eval(keyExist)) {
                            var exp = `dp_collections["${temp_collection}"].${temp} = {}`;
                            eval(exp);
                        }


                    }


                }

            }

            /*
             **********************save to StagingDB  STARTS *********************************************
             */





            Object.assign(dp_collections.leads_with_url.business, business);
            Object.assign(dp_collections.leads_with_url, {api_info_log: api_info_log});
            /*
             * adding signal_info & cmd_args coming from the product
             *  
             *
             */

            if (req.body.finetune_info)
                dp_collections[`leads_with_url`]["fine_tune_info"] = req.body.finetune_info;
            var collection_name = "";
            if (listing_info.business_website) {   // leads with website
                try {

                    collection_name = "leads_with_url";
                    var result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, dp_collections[`leads_with_url`]);
                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads with url");
                    dbLogger.logRespTime(req.id, new Date());
                    requestInfo.id = result;
                    requestInfo.collection_name = collection_name;
                } catch (E) {
                    console.log(E);
                    dbLogger.logRespTime(req.id, new Date());
                    dbLogger.setLogger(req.id, "ERROR", new Date(), E);
                    res.send({
                        status: 500, error: E.message,
                        meta: {"req_reference_id": req.id}
                    });
                    return;
                }

            } else { // leads with out website
                try {

                    collection_name = "leads_without_url";
                    dp_collections.leads_without_url = Object.assign({}, dp_collections.leads_with_url);
                    var result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, dp_collections[`leads_without_url`]);
                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url");
                    dbLogger.logRespTime(req.id, new Date());
                    requestInfo.id = result;
                    requestInfo.collection_name = collection_name;
                } catch (E) {
                    console.log(E);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), E);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({

                        status: 500, error: E.message,
                        meta: {"req_reference_id": req.id}

                    });
                    return;
                }

            }
            /*
             * *********************save to stagingDB ENDS *****************************************
             */


            /*
             * insert into common collections against 
             *  fp_id of listing
             */
            for (let key in dp_collections) {
                if (key === "leads_with_url" || key === "leads_without_url") {
                    continue;
                }
                try {
                    if (dp_collections[key]) {
                        let each_coll_key = dp_collections[key];
                        if (Object.keys(each_coll_key).length > 0) {
                            dp_collections[key].fp_id = requestInfo.id;
                            let result = await saveIntoCollections(key, dp_collections[key]);
                        }

                    }

                } catch (E) {
                    console.log(E);
                    logger.fileLogger.error(E);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        status: 500, error: E.message,
                        meta: {"req_reference_id": req.id}
                    });
                    return;
                }
            }

            /**
             * 
             * sending for analysis
             * 
             */


            dbLogger.setLogger(req.id, "REQUEST-INFO", new Date(), requestInfo);
            var finalResult = "";
            finalResult = await saveLeads.sendSingleAnalysis(requestInfo);

            dbLogger.setLogger(req.id, "SEND-ANALYSIS-RESPONSE", new Date(), finalResult);
            res.send({
                status: 200,
                fp_id: requestInfo.id,
                meta: {
                    "req_reference_id": req.id,
                    api_status: finalResult
                }
            });
            return;


//            if (finalResult.status) {
//                res.send({
//                    status: finalResult.status,
//                    message: finalResult.message,
//                    fp_id: requestInfo.id,
//                    req_reference_id: finalResult.reference_request_id,
//                    meta: {"req_reference_id": req.id}
//                });
//                return;
//            } else {
//                res.send({
//                    status: 500,
//                    message: "Analysis Failed",
//                    fp_id: requestInfo.id,
//                    req_reference_id: requestInfo.req_reference_id,
//                    meta: {"req_reference_id": req.id}
//                });
//                return;
//            }


        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.setLogger(req.id, "ERROR", new Date(), E);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: E.message,
                meta: {"req_reference_id": req.id}
            });
            return;
        }
    }
    )();
};