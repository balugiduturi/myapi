/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var leads_with_url = require('../addlisting/leads_with_url.js');
var leads_with_out_url = require('../addlisting/leads_with_out_url.js');

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
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
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

            var leadsData = {

            };




            /*
             * business info
             */
            if (listing_info.business_name) {

                leadsData.business = {};
                /*
                 * partner_id is must for dp_private
                 */
                leadsData["business"]["buzz_partner_id"] = listing_info.partner_id;

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
                 * logging addlisting from product  
                 */
                leadsData["business"]["is_master_record"] = false;
                /*
                 * listing_source as dp_private for correntain Db
                 */
                leadsData["business"]["listing_source"] = ["dp_private"];



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


            leadsData.additionalInfo = {};
            additionalInfo = _.omit(listing_info, (value, key, object) => {
                let omitKeys = ["business_name", "website", "emails", "phone_numbers", "address", "categories", "keywords","partner_id","fp_id"];
                return _.contains(omitKeys, key);
            });
            if (additionalInfo)
                leadsData["additionalInfo"] = additionalInfo;






            /*
             * save to StagingDB
             */

            if (leadsData.business.website) {   // leads with website
                try {
                    let result = await leads_with_url.saveToLeadsWith_URL(req.id, leadsData);
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
                    let result = await leads_with_out_url.saveToLeadsWith_Out_URL(req.id, leadsData);
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