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

module.exports = function (req, res) {
    (async function () {
        try {
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body"});
                return;
            }
            var listing_info = req.body.listing_info;

            if (!listing_info.fp_id) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "fp_id is missing");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "fp_id is missing"});
                return;
            }
            if (!listing_info.partner_id) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain partner_id");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "partner_id is missing"});
                return;
            }
            if (!req.body.callback_url) {
                res.send({status: 412, error: "param callback_url is needed"});
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
             * business info
             */
            if (listing_info.business_name) {

                if (!leadsData["business"]) {
                    leadsData.business = {};
                }

                if (listing_info.business_name)
                    leadsData["business"]["name"] = listing_info.business_name;
                if (listing_info.website)
                    leadsData["business"]["website"] = listing_info.website;
                if (listing_info.emails)
                    leadsData["business"]["emails"] = listing_info.emails;
                if (listing_info.phone_numbers)
                    leadsData["business"]["phone_numbers"] = listing_info.phone_numbers;
                if (listing_info.categories.type === "neustar")
                    leadsData["business"]["neustar_category_ids"] = listing_info.categories.ids;
                if (listing_info.categories.type === "google")
                    leadsData["business"]["buzz_category_ids"] = listing_info.categories.ids;
                if (listing_info.keywords)
                    leadsData["business"]["listing_keywords"] = listing_info.keywords;


                /*
                 * is masters_record status for 
                 *  addlisting from product  
                 */
                leadsData["business"]["listing_source"] = ["dp_private"];
                leadsData["business"]["is_master_record"] = false;


            } else {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain business name");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain business name"});
                return;
            }
            /*
             *  address info
             */

            if (listing_info.address) {

                if (!leadsData["address"]) {
                    leadsData.address = {};
                }
                let address = listing_info.address;

                if (address.street_name)
                    leadsData.address["street_address"] = address.street_name;
                if (address.city)
                    leadsData.address["locality"] = address.city;
                if (address.state)
                    leadsData.address["region"] = address.state;
                if (address.postal_code)
                    leadsData.address["postal_code"] = address.postal_code;
                if (address.country_code)
                    leadsData.address["country_code"] = address.country_code;

                leadsData.address["country"] = address.country ? address.country : "";
            }

            if (listing_info.social) {

                let social = listing_info.social;

                for (let key in social) {

                    let  element_path = await getEachKey(key);
                    console.log(element_path);
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
                            var exp = `leadsData.${temp} = social[key]`;
                            eval(exp);
                        } else {
                            var keyExist = `leadsData.${temp}`;
                            console.log(eval(keyExist));
                            if (!eval(keyExist)) {
                                var exp = `leadsData.${temp} = {}`;
                                eval(exp);
                            }


                        }


                    }

                }


                res.send(leadsData);
                return;

            }



            /*
             * *******************************save to StagingDB ***********************************
             */

            if (leadsData.business.website) {   // leads with website
                try {
                    let result = await saveLeads.saveToLeadsWith_URL(req.id, leadsData);
                    let id = "";
                    _.each(result.ops, (value) => {
                        id = value._id;
                    });
                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB for edit listing into leads wtih url");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        "status": 200,
                        "fp_id": id

                    });
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
                    let result = await saveLeads.saveToLeadsWith_Out_URL(req.id, leadsData);
                    let id = "";
                    _.each(result.ops, (value) => {
                        id = value._id;
                    });
                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB for edit listing with leads w/o url");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        "status": 200,
                        "fp_id": id

                    });
                    return;
                } catch (E) {
                    console.log(E);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        status: 500, error: "Something went wrong please try again` "

                    });
                    return;
                }

            }

        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: "Something went wrong please try again"

            });

        }
    })();
};