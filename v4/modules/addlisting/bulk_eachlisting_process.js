/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var saveToLeads = require('../save_leads_data/save_leads.js');
var ObjectId = require(__base).objcetId;
var local_database_conn = require(__base).local_database;
var analysis_engine_db = local_database_conn.db("analysis_engine_db");
const customAsync = require('async');

/*
 * 
 * save  child elements into their collections
 */
function saveIntoCollections(collection_name, data) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";
            collection = analysis_engine_db.collection(`${collection_name}`);
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
            collection = analysis_engine_db.collection("master_keys_document");

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
                res.send({status: 412, error: "request must contain body"});
                return;
            }


            if (!req.body.bulk_listings) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request  must contain param  bulk_listings");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request  must contain param  bulk_listings"});
                return;
            }
            if (!req.body.callback_url) {
                res.send({status: 412, error: "callback_url is needed"});
                return;
            }


            var bulk_listing_info = req.body.bulk_listings;
            var batch_id = Math.floor(Date.now() / 1000).toString();
            var total_count = req.body.bulk_listings.length;
            var requestInfo = {
                req_reference_id: req.id,
                batch_id: batch_id,
                "product_callback_url": req.body.callback_url,
                priority: 1,
                monthly_refresh: "no",
                collection_name: "",
                id: ""

            };
            res.send(
                    {status: 200,
                        message: "Reecived listings and started processing",
                        batch_status_url: "",
                        meta: {
                            batch_id: batch_id,
                            req_reference_id: requestInfo.req_reference_id
                        }

                    });
            var batch_count = 0;
            var batch_error = "";
            var failed_count = 0;
            var missing_buiness_name = 0;
            function eachListingMove(reqId, product_prim_key, listing_info) {

                return new Promise(async (resolve, reject) => {

                    resolve((async function () {
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
                             * business info
                             */
                            try {


                                /*
                                 * validation part
                                 */
                                if (!listing_info.business_name) {
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain business name");
                                    dbLogger.logRespTime(req.id, new Date());
                                    throw new Error("listing_info must contain business name")

                                }
                                if (!listing_info.locality) {
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain locality");
                                    dbLogger.logRespTime(req.id, new Date());
                                    throw new Error("listing_info must contain locality ");
                                }
                                if (!listing_info.region) {
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain region");
                                    dbLogger.logRespTime(req.id, new Date());
                                    throw new Error("listing_info must contain region ")
                                }
                                if (!listing_info.postal_code) {
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain postal_code");
                                    dbLogger.logRespTime(req.id, new Date());
                                    throw new Error("listing_info must contain postal_code ");
                                }
                                if (!listing_info.country_code) {
                                    dbLogger.setLogger(req.id, "ERROR", new Date(), "listing_info must contain country_code");
                                    dbLogger.logRespTime(req.id, new Date());
                                    throw new Error("listing_info must contain country_code ");
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
                                            return {status: 412, error: `No collection  found for  ${key}`};
                                        }



                                    } catch (E) {
                                        console.log(E.message);
                                        dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                                        dbLogger.logRespTime(req.id, new Date());
                                        return {status: 412, error: E.message};
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

                            } catch (E) {
                                console.log("Errrror ");
                                console.log(E.message);
                                /*
                                 * *********saving failed listings  ***************
                                 */

                                listing_info.api_info_log = {};
                                listing_info["api_info_log"]["req_reference_id"] = reqId;
                                listing_info["api_info_log"]["product_primary_key"] = product_prim_key;
                                listing_info["api_info_log"]["batch_id"] = batch_id;
                                listing_info["api_info_log"]["failure_reason"] = E.message;
                                try {
                                    await saveToLeads.saveToFailedListings(requestInfo, "failed_listings_to_insert", listing_info);
                                    console.log("NO business");
                                    return {status: 412, error: "missing params"};
                                } catch (E) {
                                    return {status: 500, error: E.message};
                                }

                            }

                            /*
                             **********************save to StagingDB *********************************************
                             */

                            var collection_name = "";
                            if (listing_info.business_website) {   // leads with website
                                try {
                                    console.log("with website")
                                    collection_name = "leads_with_url";
                                    /*
                                     * is masters_record status for 
                                     *  addlisting from product  
                                     */
                                    dp_collections.leads_with_url.business["listing_source"] = ["dp_private"];
                                    dp_collections.leads_with_url.business["is_master_record"] = 'no';
                                    /*
                                     * API info log status
                                     */
                                    dp_collections.leads_with_url.api_info_log = {};
                                    dp_collections.leads_with_url.api_info_log["req_reference_id"] = req.id;
                                    dp_collections.leads_with_url.api_info_log["status"] = 1;
                                    dp_collections.leads_with_url.api_info_log["product_callback_url"] = req.body.callback_url;
                                    dp_collections.leads_with_url.api_info_log["batch_id"] = batch_id;
                                    dp_collections.leads_with_url.api_info_log["product_primary_key"] = product_prim_key;
                                    var result = await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, dp_collections[`leads_with_url`]);
                                    requestInfo.id = result;
                                    requestInfo.collection_name = collection_name;
                                    dbLogger.setLogger(reqId, "INFO", new Date(), "Save to StagingDB into leads wtih url");
                                    dbLogger.logRespTime(reqId, new Date());
                                } catch (E) {
                                    console.log(E);
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 500, error: E.message};
                                }

                            } else { // leads with out website
                                try {
                                    console.log(" with out website");
                                    collection_name = "leads_without_url";
                                    dp_collections.leads_without_url = Object.assign({}, dp_collections.leads_with_url);
                                    /*
                                     * is masters_record status for 
                                     *  addlisting from product  
                                     */
                                    dp_collections.leads_without_url.business["listing_source"] = ["dp_private"];
                                    dp_collections.leads_without_url.business["is_master_record"] = 'no';
                                    /*
                                     * API info log status
                                     */
                                    dp_collections.leads_without_url.api_info_log = {};
                                    dp_collections.leads_without_url.api_info_log["req_reference_id"] = req.id;
                                    dp_collections.leads_without_url.api_info_log["status"] = 1;
                                    dp_collections.leads_without_url.api_info_log["product_callback_url"] = req.body.callback_url;
                                    dp_collections.leads_without_url.api_info_log["batch_id"] = batch_id;
                                    dp_collections.leads_without_url.api_info_log["product_primary_key"] = product_prim_key;
                                    var result = await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, dp_collections[`leads_without_url`]);
                                    requestInfo.id = result;
                                    requestInfo.collection_name = collection_name;
                                    dbLogger.setLogger(reqId, "INFO", new Date(), "Save to StagingDB with leads w/o url");
                                    dbLogger.logRespTime(reqId, new Date());
                                } catch (E) {
                                    console.log(E);
                                    dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 500, error: E.message};
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
                                            var result = await saveToLeads.sendBulkAnalysis(requestInfo);
                                            return {status: result.status};
                                        }

                                    }

                                } catch (E) {
                                    console.log(E);
                                    logger.fileLogger.error(E);
                                    dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {
                                        status: 500, error: "Something went wrong please try again"

                                    };
                                }
                            }


                        } catch (E) {
                            console.log(E);
                            dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                            dbLogger.logRespTime(reqId, new Date());
                            return {status: 500, error: E.message};
                        }
                    })());
                });
            }


//            for (let eachListing  in bulk_listing_info) {
//                try {
//                    let data = bulk_listing_info[eachListing];
//                    if (data.listing_info) {
//                        if (!data.product_primary_key) {
//                            batch_error = {stattus: 412, error: "product_primary_key is missing"};
//                            break;
//                        }
//                        let result = await eachListingMove(req.id, data.product_primary_key, data.listing_info);
//                        if (result.status !== 200 && result.status !== 412 && result.status !== 204) {
//                            batch_error = result;
//                            break;
//                        } else if (result.status === 412) {
//                            missing_buiness_name = missing_buiness_name + 1;
//                        } else {
//                            batch_count = batch_count + 1;
//                        }
//                    } else {
//                        batch_error = {status: 412, error: "param listing info is missing in each list"};
//                        dbLogger.setLogger(req.id, "ERROR", new Date(), "param listinginfo is missing in each list");
//                        break;
//                    }
//                } catch (E) {
//                    batch_error = E;
//                    break;
//                }
//            }

            customAsync.forEach(bulk_listing_info, function (data, callback) {
                (async function () {
                    try {
                        if (data.listing_info) {
                            if (!data.product_primary_key) {
                                batch_error = {stattus: 412, error: "product_primary_key is missing"};
                                callback(batch_error);
                                return;
                            }
                            let result = await eachListingMove(req.id, data.product_primary_key, data.listing_info);
                            if (result.status !== 200 && result.status !== 412 && result.status !== 204) {
                                batch_error = result;
                                callback(batch_error);
                            } else if (result.status === 412 || result.status === 204) {
                                missing_buiness_name = missing_buiness_name + 1;
                                callback(null, true);
                            } else if (result.status === 200) {
                                batch_count = batch_count + 1;
                                callback(null, true);
                            }
                        } else {
                            batch_error = {status: 412, error: "param listing info is missing in each list"};
                            dbLogger.setLogger(req.id, "ERROR", new Date(), "param listinginfo is missing in each list");
                            callback(batch_error);
                        }
                    } catch (E) {
                        batch_error = {status: 500, error: E.message};
                        callback(batch_error);
                    }
                })();
            }, async function (err) {
                var status_message = `total--${total_count}--missing params--${missing_buiness_name} --inserted -- ${batch_count}`;
                var batch_status = {
                    requestInfo: requestInfo,
                    staging_summary: {
                        total: total_count,
                        failed_listings: missing_buiness_name,
                        added_listings: batch_count,
                        error: ""

                    }


                };
                if (err) {
                    console.log("batch_error");
                    console.log(err);
                    dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), err.toString());
                    console.log(status_message);
                    batch_status.error = err;
                    await saveToLeads.saveBatchStatus(batch_status);
                    dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                    dbLogger.logRespTime(req.id, new Date());
                    console.log(status_message);
                } else {

//                    var result = await saveToLeads.sendBulkAnalysis(requestInfo);
                    /**
                     * batch status maintainence in separate collection
                     */

                    await saveToLeads.saveBatchStatus(batch_status);
                    dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                    dbLogger.logRespTime(req.id, new Date());
                    console.log(status_message);
                }
            });
//            var status_message = `total--${total_count}--missing params--${missing_buiness_name} --inserted -- ${batch_count}`;
//            if (batch_error) {
//                console.log("batch_error");
//                console.log(batch_error);
//                dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
//                dbLogger.setLogger(req.id, "ERROR", new Date(), batch_error.toString());
//                console.log(status_message);
//                res.send(batch_error);
//                return;
//            } else {
//                if (batch_count === 0) {
//                    res.send({
//                        status: 204,
//                        error: "No listings added"
//                    });
//                    return;
//                }
//                requestInfo.summary = {
//                    total_listings: total_count,
//                    failed_listings: missing_buiness_name,
//                    added_listings: batch_count,
//                };
//                var result = await saveToLeads.sendBulkAnalysis(requestInfo);
//                /**
//                 * batch status maintainence in separate collection
//                 */
//                let batch_status = {
//                    requestInfo: requestInfo,
//                    staging_summary: {
//                        total: total_count,
//                        missing_params_listings: missing_buiness_name,
//                        saved_to_staging: batch_count
//
//                    }
//
//
//                };
//                await saveToLeads.saveBatchStatus(batch_status);
//                dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
//                dbLogger.logRespTime(req.id, new Date());
//                console.log(status_message);
//
//                res.send(result);
//                return;
//            }



        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: "Something went wrong please try again"

            });
            return;
        }
    })();
};