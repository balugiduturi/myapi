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
                reject(new Error("No Element found"));
            } else {
                if (doc.element_path) {
                    resolve(doc.element_path);
                } else {
                    reject(new Error("Element path not found"));
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
            collection = analysis_engine_db.collection("leads_with_url");
            let doc = await collection.findOne({"_id": ObjectId(fpId)});
            if (!doc) {
                resolve(false);
            } else {
                resolve(doc);
            }

        } catch (E) {
            reject(E);
        }
    });
}

function iscorentinDB(fpId) {
    return new Promise(async(resolve, reject) => {
        try {
            collection = analysis_engine_db.collection("leads_with_url");
            let doc = await collection.findOne({"_id": ObjectId(fpId)});
            if (!doc) {
                reject(new Error("No Listing found"));
            } else {
                if (doc.business) {
                    if (doc.business.is_master_record && doc.business.is_master_record === "yes") {
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
            /*
             * 
             * ************  check fp_id validation *********************
             */
            let fpData = await checkListing(listing_info.fp_id);
            if (!fpData) {
                res.send({status: 412, error: "fp_id is not valid"});
                return;
            } else {
                var leadsData = fpData;
            }




            /*
             * is masters_record status for 
             *  addlisting from product  
             */
            if (leadsData.business) {
                leadsData["business"]["listing_source"] = ["dp_private"];
                leadsData["business"]["is_master_record"] = 'yes';
            } else {
                leadsData.business = {};
                leadsData["business"]["listing_source"] = ["dp_private"];
                leadsData["business"]["is_master_record"] = 'yes';
            }

            /*
             * API info log status
             */

            if (leadsData.api_info_log) {


                leadsData["api_info_log"]["req_reference_id"] = req.id;
                leadsData["api_info_log"]["status"] = 1;
                leadsData["api_info_log"]["product_callback_url"] = req.body.callback_url;
            } else {

                leadsData.api_info_log = {};

                leadsData["api_info_log"]["req_reference_id"] = req.id;
                leadsData["api_info_log"]["status"] = 1;
                leadsData["api_info_log"]["product_callback_url"] = req.body.callback_url;
            }



            for (let key in listing_info) {
                try {
                    var element_path = "";
                    element_path = await getEachKey(key);
                } catch (E) {
                    console.log(E.message);
                    continue;
                }
                let nestedList = element_path.split(".");
                var temp = "";
                console.log(nestedList.length);
                for (i = 0; i < nestedList.length; i++) {
                    if (i === 0) {
                        temp = temp + nestedList[i];
                    } else {
                        temp = temp + `.${nestedList[i]}`;
                    }
                    if (i === nestedList.length - 1) {
                        var exp = `leadsData.${temp} = listing_info[key]`;
                        eval(exp);
                    } else {
                        var keyExist = `leadsData.${temp}`;
//                            console.log(eval(keyExist));
                        if (!eval(keyExist)) {
                            var exp = `leadsData.${temp} = {}`;
                            eval(exp);
                        }


                    }


                }

            }


            /****************************************************************************************************************
             *                      Save to Stagin DB Starts
             ****************************************************************************************************
             */
            try {
                var iscorentin = "";
                iscorentin = await iscorentinDB(listing_info.fp_id);


                if (iscorentin) {
                    /*
                     * 
                     *  ******************* UPDATE  same data with same fp_id *********************
                     */


                    var requestInfo = {
                        req_reference_id: req.id

                    };
                    var collection_name = "";
                    if (leadsData.business.website) {   // leads with website
                        try {
                            collection_name = "leads_with_url";
                            let result = await saveLeads.saveToLeadsEdit(requestInfo, collection_name, leadsData);


                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads wtih url for Editlisr");
                            dbLogger.logRespTime(req.id, new Date());
                            res.send(result);
                            return;
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
                            let result = await saveLeads.saveToLeadsEdit(requestInfo, collection_name, leadsData);


                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url for Editlisr");
                            dbLogger.logRespTime(req.id, new Date());
                            res.send(result);
                            return;
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

                } else {

                    /*
                     **********************save to StagingDB with new fp_id ******************************************
                     */

                    delete leadsData._id;

                    var requestInfo = {
                        req_reference_id: req.id,
                        "product_callback_url": req.body.callback_url

                    };
                    var collection_name = "";
                    if (leadsData.business.website) {   // leads with website
                        try {
                            collection_name = "leads_with_url";
                            let result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, leadsData);


                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads wtih url for Editlisr");
                            dbLogger.logRespTime(req.id, new Date());
                            res.send(result);
                            return;
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
                            let result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, leadsData);


                            dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url for Editlisr");
                            dbLogger.logRespTime(req.id, new Date());
                            res.send(result);
                            return;
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