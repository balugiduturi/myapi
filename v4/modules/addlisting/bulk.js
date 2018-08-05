/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var saveToLeads = require('../save_leads_data/save_leads.js');

var local_database_conn = require(__base).local_database;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);
const customAsync = require('async');
var listing_validations = require(`${__v4root}/js/validations.js`);
var countrie_list = ["us", "ca", "nz", "gb", "au"];
/*
 * 
 * save  child elements into their collections
 */
function saveIntoCollections(collection_name, data) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";
            collection = local_child_db.collection(`${collection_name}`);
            var doc = await collection.save(data);
            console.log("social_signals");
            console.log(doc.ops[0]._id);
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
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body", meta: {"req_reference_id": req.id}});
                return;
            }


            if (!req.body.bulk_listings) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request  must contain param  bulk_listings");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request  must contain param  bulk_listings", meta: {"req_reference_id": req.id}});
                return;
            }
            if (!req.body.product_callback_url) {
                res.send({status: 412, error: "product_callback_url is needed", meta: {"req_reference_id": req.id}});
                return;
            }


            var bulk_listing_info = req.body.bulk_listings;
            var batch_id = Math.floor(Date.now() / 1000).toString();

            var total_count = req.body.bulk_listings.length;

            var requestInfo = {
                req_reference_id: req.id,
                batch_id: batch_id,
                product_callback_url: req.body.product_callback_url,
                collection_name: "",
                Authorization: req.headers.authorization,
                monthly_refresh: "no",
                priority: 1,
                "can_create_version": req.body.can_create_version ? req.body.can_create_version : true

            };

            if (req.body.signals)
                requestInfo.signals = req.body.signals;
            if (req.body.custom_args)
                requestInfo.custom_args = req.body.custom_args;

            var batch_count = 0;
            var batch_error = "";
            var failed_count = 0;
            var missing_buiness_name = 0;

            function eachListingMove(reqId, product_prim_key, listing_info) {

                return new Promise(async (resolve, reject) => {




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
                            "product_callback_url": req.body.product_callback_url,
                            "product_primary_key": product_prim_key,
                            "batch_id": batch_id

                        };


                        try {


                            /*
                             * validation part
                             */

                            if (!listing_info.buzz_partner_id) {
                                dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain buzz_partner_id");
                                throw new Error("listing_info must contain buzz_partner_id");
                            }

                            if (!_.contains(countrie_list, listing_info.country_code)) {
                                dbLogger.setLogger(req.id, "ERROR", new Date(), ` country_code ${req.body.country_code} is not avaialable`);
                                dbLogger.logRespTime(req.id, new Date());
                                throw new Error(` country_code ${req.body.country_code} is not avaialable`);

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
                                    throw new Error(`listing_info must contain ${failed_value}`);
                                }

                            } else if (!listing_info.business_name) {
                                dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain business_name");
                                dbLogger.logRespTime(req.id, new Date());
                                throw new Error("listing_info must contain business name");
                            }





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
                                        resolve({status: 412, error: `No collection  found for  ${key}`, meta: {"req_reference_id": req.id}});
                                        return;

                                    }



                                } catch (E) {
                                    console.log(E.message);
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                                    dbLogger.logRespTime(req.id, new Date());
                                    resolve({status: 412, error: E.message, meta: {"req_reference_id": req.id}});
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


                            Object.assign(dp_collections.leads_with_url.business, business);
                            Object.assign(dp_collections.leads_with_url, {api_info_log: api_info_log});

                            /*
                             * adding fine_tune from the product
                             *  
                             *
                             */

                            if (req.body.finetune_info)
                                dp_collections[`leads_with_url`]["fine_tune_info"] = req.body.finetune_info;


                        } catch (E) {
                            console.log(E);
                            console.log(E.message);
                            dbLogger.setLogger(reqId, "ERROR", new Date(), E);
                            /*
                             * *********saving failed listings  ***************
                             */
                            Object.assign(listing_info, {api_info_log: api_info_log});


                            listing_info["api_info_log"]["failure_reason"] = E.message;
                            try {
                                await saveToLeads.saveToFailedListings(requestInfo, "failed_listings_to_insert", listing_info);
                                resolve({status: 412, error: E.message});
                                return;
                            } catch (E) {
                                resolve({status: 500, error: E.message});
                                return;
                            }

                        }

                        /*
                         **********************save to StagingDB *********************************************
                         */


                        var collection_name = "";
                        if (listing_info.business_website) {   // leads with website
                            try {
                                collection_name = "leads_with_url";

                                var result = await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, dp_collections[`leads_with_url`]);
                                requestInfo.id = result; //need to add for inserting child colletions below

                                dbLogger.setLogger(reqId, "INFO", new Date(), `fp_id -- ${result} Save to StagingDB into leads wtih url`);
                                dbLogger.logRespTime(reqId, new Date());

                            } catch (E) {
                                console.log(E);
                                dbLogger.logRespTime(reqId, new Date());
                                resolve({status: 500, error: E.message, meta: {"req_reference_id": req.id}});
                                return;
                            }

                        } else { // leads with out website
                            try {
                                collection_name = "leads_without_url";
                                dp_collections.leads_without_url = Object.assign({}, dp_collections.leads_with_url);


                                var result = await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, dp_collections[`leads_without_url`]);

                                requestInfo.id = result; //need to add for inserting child colletions below

                                dbLogger.setLogger(reqId, "INFO", new Date(), `fp_id -- ${result} ---Save to StagingDB with leads w/o url`);
                                dbLogger.logRespTime(reqId, new Date());

                            } catch (E) {
                                console.log(E);
                                dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                                dbLogger.logRespTime(reqId, new Date());
                                resolve({status: 500, error: E.message, meta: {"req_reference_id": req.id}});
                                return;
                            }

                        }

                        /*
                         **********************save to StagingDB  ENDSSSSSSS*********************************************
                         */




                        /*
                         * insert into common collections against 
                         *  fp_id of listing
                         */
                        for (let key in  dp_collections) {
                            if (key === "leads_with_url" || key === "leads_without_url") {
                                continue;
                            }
                            try {
                                if (dp_collections[key]) {

                                    let each_coll_key = dp_collections[key];
                                    if (Object.keys(each_coll_key).length > 0) {
                                        dp_collections[key].fp_id = requestInfo.id;
                                        dbLogger.logRespTime(reqId, new Date());
                                        await saveIntoCollections(key, dp_collections[key]);

                                    }

                                }


                            } catch (E) {
                                console.log(E);
                                logger.fileLogger.error(E);
                                dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                                dbLogger.logRespTime(reqId, new Date());
                                reject(E);
                                return;
                            }
                        }
                        resolve({status: 200, fp_id: requestInfo.id.toString(), collection_name: collection_name});
                        return;


                    } catch (E) {
                        console.log(E);
                        dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                        dbLogger.logRespTime(reqId, new Date());
                        reject(E);
                        return;
                    }


                });
            }
            /*
             * status for each listings
             */
            var success_listings = [];
            var failed_listings = [];

            customAsync.forEachLimit(bulk_listing_info, 1000, function (data, callback) {
                (async function () {
                    try {
                        if (data.listing_info) {
                            if (!data.product_primary_key) {
                                batch_error = {status: 412, error: "product_primary_key is missing"};
                                callback(batch_error);
                            }
                            let result = await eachListingMove(req.id, data.product_primary_key, data.listing_info);
                            if (result.status !== 200 && result.status !== 412 && result.status !== 204) {
                                batch_error = result;
                                callback(batch_error);
                            } else if (result.status === 412) {
                                missing_buiness_name = missing_buiness_name + 1;
                                failed_listings.push({"product_primary_key": data.product_primary_key, reason: result});
                                callback(null, true);
                            } else {
                                batch_count = batch_count + 1;
                                success_listings.push({"product_primary_key": data.product_primary_key, result});
                                callback(null, true);
                            }
                        } else {
                            batch_error = {status: 412, error: "param listing info is missing in each list"};
                            dbLogger.setLogger(req.id, "ERROR", new Date(), "param listinginfo is missing in each list");
                            callback(batch_error);
                        }
                    } catch (E) {
                        console.log(E);
                        batch_error = {status: 500, error: E.message};
                        callback(batch_error);
                    }
                })();
            }, async function (err) {
                var status_message = `total--${total_count}--missing params--${missing_buiness_name} --inserted -- ${batch_count}`;

                console.log("status_message======");
                console.log(status_message);
                if (err) {
                    console.log("batch_error");
                    console.log(batch_error);
                    dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), batch_error.toString());
                    console.log(status_message);
                    res.send(batch_error);
                    return;
                } else {


                    var staging_summary = {
                        total_listings: total_count,
                        failed_listings: missing_buiness_name,
                        added_listings: batch_count
                    };

                    dbLogger.setLogger(req.id, "REQUEST-INFO", new Date(), requestInfo);


                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        status: 200,
                        batch_id: batch_id,
                        "success_listings": success_listings,
                        "failed_listings": failed_listings,
                        meta: {"req_reference_id": req.id, staging_summary}});


                    /*
                     * send to Analysis
                     */

                    if (batch_count !== 0) {
                        let result = await saveToLeads.sendBulkAnalysis(requestInfo,
                                {
                                    "batch_id": batch_id,
                                    "success_listings": success_listings,
                                    "failed_listings": failed_listings
                                });

                        dbLogger.setLogger(req.id, "BULK_ANALYSIS_RESPONSE", new Date(), result);
                    }




                    /**
                     * batch status maintainence in separate collection
                     */

                    var batch_status = {
                        batch_id: batch_id,
                        "batch_request_reference_id": req.id,
                        staging_summary
                    };
                    console.log(status_message);
                    await saveToLeads.saveBatchStatus(batch_status);
                    dbLogger.setLogger(req.id, "BATCH_INFO", new Date(), status_message);


                }
            });

        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: E.message,
                meta: {"req_reference_id": req.id}

            });
            return;
        }
    })();
};