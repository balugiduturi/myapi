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
var ObjectId = require(__base).objcetId;
var analysis_engine_db = local_database_conn.db("analysis_engine_db");
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

/*
 * 
 * check fp_id is valid or not;
 */
function checkListing(fpId) {

    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";

            collection = analysis_engine_db.collection("leads_with_url");
            var leadsDoc = await collection.findOne({"_id": ObjectId(fpId)});
            if (!leadsDoc) {

                collection = analysis_engine_db.collection("leads_without_url");
                var leadsWithOut_Doc = await collection.findOne({"_id": ObjectId(fpId)});

                if (!leadsWithOut_Doc) {
                    resolve(false);
                } else {
                    resolve({doc: leadsWithOut_Doc, collection: "leads_without_url"});
                }
            } else {
                resolve({doc: leadsDoc, collection: "leads_with_url"});
            }

        } catch (E) {
            reject(E);
        }
    });
}

function iscorentinDB(fpId) {
    return new Promise(async(resolve, reject) => {
        try {
            var collection = "";
            collection = analysis_engine_db.collection("leads_with_url");


            var doc = await collection.findOne({"_id": ObjectId(fpId)});
            if (!doc) {
                collection = analysis_engine_db.collection("leads_without_url");
                let fp_business_doc = await collection.findOne({"_id": ObjectId(fpId)});
                if (!fp_business_doc) {
                    reject(new Error("No Listing found"));
                } else {
                    resolve(fp_business_doc);
                }

            } else {
                if (doc.business) {
                    if (doc.business.is_master_record && doc.business.is_master_record === "no") {
                        console.log("in-----", doc.business.is_master_record);
                        resolve(true);
                    } else {
                        resolve(false);
                    }


                } else {
                    resolve(false);
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
                res.send({status: 412, error: "request must contain body", req_reference_id: req.id});
                return;
            }
            if (!req.body.listing_info) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain listing_info");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "param listing_info is missing", req_reference_id: req.id});
                return;
            }
            var listing_info = req.body.listing_info;
            if (!listing_info.fp_id) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "fp_id is missing");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "fp_id is missing", req_reference_id: req.id});
                return;
            }

            if (!listing_info.business_name) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "business_name is missing");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "business_name is missing", req_reference_id: req.id});
                return;
            }
            if (!req.body.callback_url) {
                res.send({status: 412, error: "param callback_url is needed", req_reference_id: req.id});
                return;
            }

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
            var new_website_forExistFpbusiness = false;










            /*
             * 
             * ************  check fp_id validation *********************
             */

            var fpData = "";

            fpData = await checkListing(listing_info.fp_id);
            if (!fpData) {
                res.send({status: 412, error: "fp_id is not valid"});
                return;
            } else {
                if (fpData.collection === "leads_with_url") {
                    dp_collections[`leads_with_url`] = fpData.doc;
                } else {
                    if (listing_info.business_website) {
                        new_website_forExistFpbusiness = true;
                        dp_collections[`leads_with_url`] = fpData.doc;  // exist business_name  with out fp and
                    } else {
                        dp_collections[`leads_with_url`] = fpData.doc;
                    }
                }
            }



            var requestInfo = {
                req_reference_id: req.id,
                "product_callback_url": req.body.callback_url,
                id: "",
                "collection_name": "",
                priority: 1,
                monthly_refresh: "no"

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
                "product_callback_url": req.body.callback_url,

            };

            /*
             * 
             * addding elements against
             * master keys provided 
             */

            var fine_tune_info = {
                social: {},
                categories: {}
            };
            for (let key in listing_info) {
                try {
                    console.log("key ---", key);
                    var element_path = "";
                    var temp_collection = "";
                    var element_data = await getEachKey(key);


                    temp_collection = element_data.common_collection;
                    element_path = element_data.element_path;
                    if (!dp_collections[`${temp_collection}`]) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), `No collection found for  ${key}`);
                        res.send({status: 204, error: `No collection  found for  ${key}`});
                        return;
                    }



                } catch (E) {
                    console.log(E.message);
                    dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 500, error: E.message});
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

                        /*
                         * for flagging finetune_info
                         */
                        if (temp.startsWith("social")) {
                            fine_tune_info[`${key}`] = listing_info[key];
                        }
                        if (temp.startsWith("business.neustar_category_ids")) {
                            fine_tune_info[`${key}`] = listing_info[key];
                        }
                        if (temp.startsWith("business.neustar_category_lables"))
                            fine_tune_info[`${key}`] = listing_info[key];

                        if (temp.startsWith("business.buzz_category_ids"))
                            fine_tune_info[`${key}`] = listing_info[key];
                        if (temp.startsWith("business.category_labels"))
                            fine_tune_info[`${key}`] = listing_info[key];

                    } else {
                        var keyExist = `dp_collections["${temp_collection}"].${temp}`;
                        if (!eval(keyExist)) {
                            var exp = `dp_collections["${temp_collection}"].${temp} = {}`;
                            eval(exp);
                        }


                    }


                }

            }




            if (dp_collections[`leads_with_url`].business.website) {
                Object.assign(dp_collections.leads_with_url.business, business);
                Object.assign(dp_collections.leads_with_url, {api_info_log: api_info_log});
            } else {
                Object.assign(dp_collections.leads_without_url.business, business);
                Object.assign(dp_collections.leads_without_url, {api_info_log: api_info_log});
            }



            /*
             * adding signal_info & cmd_args coming from the product
             *  
             *
             */
            if (listing_info.signal_info) {
                requestInfo.signal_info = listing_info.signal_info;
            }
            if (listing_info.cmd_args) {
                requestInfo.cmd_args = listing_info.cmd_args;
            }


            /*
             * 
             * adding finetune_info
             */

            dp_collections[`leads_with_url`].fine_tune_info = fine_tune_info;




            /****************************************************************************************************************
             *                      Save to Stagin DB Starts
             ****************************************************************************************************************
             */

            try {

                var iscorentin = "";
                iscorentin = await iscorentinDB(listing_info.fp_id);
                console.log("iscorrentins----", iscorentin);
                if (iscorentin) {

                    if (new_website_forExistFpbusiness === true) {
                        /*
                         * ******************** ADD  NEW LISTING***************
                         */
                        var collection_name = "";
                        try {

                            /*
                             * placing link for reference with master fpd_id
                             */
                            dp_collections[`leads_with_url`].business.links = {
                                ref_fp_id: dp_collections.leads_with_url._id
                            };

                            delete dp_collections.leads_with_url._id;
                            collection_name = "leads_with_url";

                            var result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, dp_collections[`leads_with_url`]);

                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads with url");
                            dbLogger.logRespTime(req.id, new Date());
                            requestInfo.id = result;
                            requestInfo.collection_name = collection_name;

                        } catch (E) {
                            console.log(E);
                            dbLogger.logRespTime(req.id, new Date());
                            res.send({
                                status: 500, error: "Something went wrong please try again"
                            });
                            return;
                        }

                    } else {
                        /*
                         * 
                         *  ******************* UPDATE  same data with same fp_id *********************
                         */

                        dp_collections.leads_with_url._id = ObjectId(dp_collections.leads_with_url._id);

                        var collection_name = "";

                        if (dp_collections[`leads_with_url`].business.website) {   // leads with website
                            try {
                                collection_name = "leads_with_url";




                                let result = await saveLeads.updateTOLeadsSingle(requestInfo, collection_name, dp_collections[`leads_with_url`]);
                                dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads with url");
                                dbLogger.logRespTime(req.id, new Date());
                                requestInfo.id = result;
                                requestInfo.collection_name = collection_name;

                            } catch (E) {
                                console.log(E);
                                dbLogger.logRespTime(req.id, new Date());
                                res.send({
                                    status: 500, error: E.message
                                });
                                return;
                            }

                        } else { // leads with out website
                            try {

                                collection_name = "leads_without_url";
                                Object.assign(dp_collections.leads_without_url, dp_collections.leads_with_url);


                                let result = await saveLeads.updateTOLeadsSingle(requestInfo, collection_name, dp_collections[`leads_without_url`]);


                                dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url");
                                dbLogger.logRespTime(req.id, new Date());
                                requestInfo.id = result;
                                requestInfo.collection_name = collection_name;
                            } catch (E) {
                                console.log(E);
                                dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                                dbLogger.logRespTime(req.id, new Date());

                                res.send({

                                    status: 500, error: "Something went wrong please try again "

                                });
                                return;
                            }

                        }
                    }
                } else { //NOT existing CORRENTIN ****
                    console.log("Not Correntin");

                    /*
                     **********************save to StagingDB with new fp_id ******************************************
                     */

                    /*
                     * placing link for reference with master fp_id
                     */
                    dp_collections[`leads_with_url`].business.links = {
                        ref_fp_id: dp_collections.leads_with_url._id
                    };
                    delete dp_collections.leads_with_url._id;
                    var collection_name = "";

                    if (dp_collections[`leads_with_url`].business.website) {   // leads with website
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
                            res.send({
                                status: 500, error: "Something went wrong please try again"
                            });
                            return;
                        }

                    } else { // leads with out website
                        try {

                            collection_name = "leads_without_url";
                            Object.assign(dp_collections.leads_without_url, dp_collections.leads_with_url);


                            var result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, dp_collections[`leads_without_url`]);


                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url");
                            dbLogger.logRespTime(req.id, new Date());
                            requestInfo.id = result;
                            requestInfo.collection_name = collection_name;
                        } catch (E) {
                            console.log(E);
                            dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
                            dbLogger.logRespTime(req.id, new Date());

                            res.send({

                                status: 500, error: "Something went wrong please try again "

                            });
                            return;
                        }

                    }
                }


                /****************************************************************************************************************
                 *                      Save to Stagin DB ENDS
                 ****************************************************************************************************
                 */


                /**
                 * 
                 * sending for analysis
                 * 
                 */

                var finalResult = "";
                finalResult = await saveLeads.sendSingleAnalysis(requestInfo);

                dbLogger.setLogger(req.id, "INFO", new Date(), `analysis response-- ${finalResult}`);
                if (finalResult.status) {
                    res.send({
                        status: finalResult.status,
                        message: finalResult.message,
                        fp_id: requestInfo.id,
                        req_reference_id: finalResult.reference_request_id
                    });
                    return;
                } else {
                    res.send({
                        status: 500,
                        message: "Analysis Failed",
                        fp_id: requestInfo.id,
                        req_reference_id: requestInfo.req_reference_id
                    });
                    return;
                }


            } catch (E) {
                res.send({status: 404, error: E.message});
                return;
            }

        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: E.message

            });
        }
    })();
};