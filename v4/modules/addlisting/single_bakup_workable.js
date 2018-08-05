/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');

var saveLeads = require('../save_leads_data/save_leads.js');

module.exports = function (req, res) {
    (async function () {
        try {

            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body"});
                return;
            }
            if (!req.body.listing_info) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "params must contain listing_info");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "params must contain listing_info"});
                return;
            }

            var listing_info = req.body.listing_info;
            var leadsData = {

            };
            if (!req.body.callback_url) {
                res.send({status: 412, error: "param callback_url is needed"});
                return;
            }

            /*
             * business info
             */
            if (listing_info.business.name) {

                leadsData.business = {};

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
                leadsData["business"]["is_master_record"] = 'yes';


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
                let address = listing_info.address;

                if (!address.city) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain city");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 412, error: "address must contain city "});
                    return;
                }
                if (!address.state) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "address must contain state");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 412, error: "address must contain state "});
                    return;
                }
                if (!address.postal_code) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "address must contain postal_code");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 412, error: "address must contain postal_code "});
                    return;
                }
                if (!address.country_code) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "address must contain country_code");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({status: 412, error: "address must contain country_code "});
                    return;
                }


                leadsData.address = {};
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
            } else {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must address");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must address "});
                return;
            }




            /*
             * additional information
             */
            leadsData.additionalInfo = {};

            additionalInfo = _.omit(listing_info, (value, key, object) => {
                let omitKeys = ["business_name", "website", "emails", "phone_numbers", "address", "categories", "keywords"];
                return _.contains(omitKeys, key);
            });
            if (additionalInfo)
                leadsData["additionalInfo"] = additionalInfo;


            leadsData.api_info_log = {};

            leadsData["api_info_log"]["req_reference_id"] = req.id;
            leadsData["api_info_log"]["status"] = 1;
            leadsData["api_info_log"]["product_callback_url"] = req.body.callback_url;


            /*
             **********************save to StagingDB *********************************************
             */


            var requestInfo = {
                req_reference_id: req.id,
                "product_callback_url": req.body.callback_url

            };
            var collection_name = "";
            if (leadsData.business.website) {   // leads with website
                try {
                    collection_name = "leads_with_url";
                    let result = await saveLeads.saveToLeadsSingle(requestInfo, collection_name, leadsData);


                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB into leads wtih url");
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


                    dbLogger.setLogger(req.id, "INFO", new Date(), "Save to StagingDB with leads w/o url");
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
            /*
             * *********************save to staging DB Ends *****************************************
             */

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