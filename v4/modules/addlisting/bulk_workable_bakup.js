/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var saveToLeads = require('../save_leads_data/save_leads.js');

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
                dbLogger.setLogger(req.id, "ERROR", new Date(), "params must contain bulk_listings");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: " params must contain bulk_listings"});
                return;
            }
            if (!req.body.callback_url) {
                res.send({status: 412, error: "param callback_url is needed"});
                return;
            }


            var bulk_listing_info = req.body.bulk_listings;
            var batch_id = Math.floor(Date.now() / 1000).toString();
            var total_count = req.body.bulk_listings.length;
            var requestInfo = {
                req_reference_id: req.id,
                batch_id: batch_id,
                "product_callback_url": req.body.callback_url

            };
            var batch_count = ""
            var batch_error = "";
            var failed_count = "";
            var missing_buiness_name = ""

            function eachListingMove(reqId, listing_info) {

                return new Promise(async (resolve, reject) => {

                    resolve((async function () {
                        try {
                            var leadsData = {

                            };

                            /*
                             * business info
                             */
                            if (listing_info.business_name) {

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
                                /*
                                 * *********saving failed listings  ***************
                                 */

                                listing_info.api_info_log = {};
                                listing_info["api_info_log"]["req_reference_id"] = reqId;
                                if (listing_info["product_primary_key"])
                                    listing_info["api_info_log"]["product_primary_key"] = listing_info["product_primary_key"];
                                listing_info["api_info_log"]["batch_id"] = batch_id;
                                try {
                                    await saveToLeads.saveToFailedListings(requestInfo, "failed_listings_to_insert", listing_info);
                                    return {status: 412, error: "No business name"};
                                } catch (E) {
                                    return {status: 500, error: E.message};
                                }

                            }
                            if (listing_info.address) {
                                let address = listing_info.address;
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

                            leadsData["api_info_log"]["req_reference_id"] = reqId;
                            leadsData["api_info_log"]["status"] = 1;
                            leadsData["api_info_log"]["product_callback_url"] = req.body.callback_url;
                            leadsData["api_info_log"]["batch_id"] = batch_id;
                            leadsData["api_info_log"]["product_primary_key"] = req.body["product_primary_key"];

                            /*
                             **********************save to StagingDB *********************************************
                             */

                            var collection_name = "";
                            if (leadsData.business.website) {   // leads with website
                                try {
                                    collection_name = "leads_with_url";
                                    await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, leadsData);


                                    dbLogger.setLogger(reqId, "INFO", new Date(), "Save to StagingDB into leads wtih url");
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 200};
                                } catch (E) {
                                    console.log(E);
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 500, error: E.message};
                                }

                            } else { // leads with out website
                                try {

                                    collection_name = "leads_without_url";
                                    let result = await saveToLeads.saveToLeadsBulk(requestInfo, collection_name, leadsData);


                                    dbLogger.setLogger(reqId, "INFO", new Date(), "Save to StagingDB with leads w/o url");
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 200};

                                } catch (E) {
                                    console.log(E);
                                    dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                                    dbLogger.logRespTime(reqId, new Date());
                                    return {status: 500, error: E.message};
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

            for (let eachListing  in bulk_listing_info) {
                try {
                    let data = bulk_listing_info[eachListing];
                    if (data.listing_info) {
                        let result = await eachListingMove(req.id, data.listing_info);
                        if (result.status !== 200 && result.status !== 412) {
                            batch_error = result;
                            break;
                        } else if (result.status === 412) {
                            missing_buiness_name = missing_buiness_name + 1;
                        } else {
                            batch_count = batch_count + 1;
                        }
                    } else {
                        batch_error = {status: 412, error: "param listing info is missing in each list"};
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "param listinginfo is missing in each list");
                        break;
                    }
                } catch (E) {
                    batch_error = E;
                    break;
                }
            }
            var status_message = `total--${total_count}--missing--${missing_buiness_name} --inserted -- ${batch_count}`;
            if (batch_error) {
                console.log(batch_error);
                dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                dbLogger.setLogger(req.id, "ERROR", new Date(), batch_error.toString());
                res.send(batch_error);
            } else {
                let result = await saveToLeads.sendBulkAnalysis(requestInfo);
                dbLogger.setLogger(req.id, "INFO", new Date(), status_message);
                res.send(result);
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