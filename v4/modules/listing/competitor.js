/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}

var _ = require('underscore');
var logger = require(__base);
var dbLogger = require(__dblogger);
const util = require('util');
const geo_distance = "32186.9m"; // Radius 20Miles = 32186.9m

var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;

const logic_type = 2;// 1 - Old Logic & 2 - New Priority Logic
global.__priorityArr = {
    E: ["C", "D", "B"],
    D: ["B", "C", "A"],
    C: ["A", "B"],
    B: ["A"],
    A: ["A"]
};

/**
 * 
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */


module.exports = function (req, res) {
    (async function () {
        try {
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body"});
                return;
            }

            if ((req.body && req.body.fp_id && req.body.category_type && req.body.categories) && (req.body.category_type === "google" || req.body.category_type === "GOOGLE" || req.body.category_type === "NEUSTAR" || req.body.category_type === "neustar")) {

                /*Static*/
//                let inputId = "569e8ea62f92e2bc28f48cfe";
//                let catType = "google";
//                let categoryIds = [25,59];
                //console.log("Categories ",categoryIds);

                /*Dynamic*/
                let inputId = req.body.fp_id;
                let catType = (req.body.category_type) ? req.body.category_type.toLowerCase() : "google";
                //console.log("Cat Type ", catType);
                let categoryIds = req.body.categories;

                var searchDoc = await  clientSearch(inputId, catType);
                if (!searchDoc) {
                    console.log("called again")
                    searchDoc = await callAgain(inputId, catType,3000);
                }
                
                //console.log('Search Doc ',searchDoc);
                //console.log("Priority Array ",__priorityArr[searchDoc["grade"]]);              
                //console.log("Priority Array ",__priorityArr);
                //process.exit();

                if (searchDoc && !searchDoc["err_msg"]) {
                    searchDoc['cat_ids'] = categoryIds;
                    //console.log('Search Doc ',searchDoc);return;

                    /* competitor search logic */
                    var compResult_ids = await clientSearchCompetitor(searchDoc, catType);
                    if (compResult_ids && compResult_ids.length > 0) {

                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 200, competitors: compResult_ids, meta: {request_ref_id: req.id}});
                    } else {
                        dbLogger.setLogger(req.id, "INFO", new Date(), "No Competetors Found For Id " + inputId);
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 500, error: "No Competitors Found", meta: {request_ref_id: req.id}});
                    }
                } else if (searchDoc && searchDoc["err_msg"]) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), searchDoc["err_msg"]);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({"status": 500, error: searchDoc["err_msg"], meta: {request_ref_id: req.id}});
                } else {

                    dbLogger.setLogger(req.id, "INFO", new Date(), "No Listing Found For Id " + inputId + "\n");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({"status": 500, error: "No Listing Found For Id " + inputId + "\n", meta: {request_ref_id: req.id}});
                }
            } else {
                dbLogger.setLogger(req.id, "INFO", new Date(), "Mandatory field is missing in request params");
                dbLogger.logRespTime(req.id, new Date());
                res.send({"status": 412, error: "Please Check FP Id or Category Type or Categories", meta: {request_ref_id: req.id}});
            }
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.setLogger(req.id, "ERROR", new Date(), "Request must contain body");
            dbLogger.logRespTime(req.id, new Date());
            res.send({status: 500, error: "Something went wrong please try again", meta: {request_ref_id: req.id}});
        }
    })();
};

/*
 * 
 * @param {type} inputId
 * @param {type} catType
 * @returns {Promise}
 */
function callAgain(inputId, catType,time) {
    return new Promise(async(resolve, reject) => {
        setTimeout(async function () {
            var searchDoc = "";
            searchDoc = await clientSearch(inputId, catType);
            resolve(searchDoc);
        }, time);
    });
}

/**
 * 
 * @param {type} inputId
 * @param {type} catType
 * @returns {Promise}
 */
function clientSearch(inputId, catType) {
    return new Promise(async function (resolve, reject) {
        try {

            var result = await client.search(
                    {index: `${elastic_indexes["leads_with_url"]},${elastic_indexes["leads_without_url"]}`,
                        type: `${elastic_types["leads_with_url"]},${elastic_types["leads_without_url"]}`,
                        body: prepareEalsticQuery(inputId)});
            if (result && result.hits.total > 0) {
                let listing = result.hits.hits[0];
                let source = listing._source;
                var doc = {};
                doc._id = listing._id;
                if (source && source.page_analysis && source.page_analysis.opportunity_grade)
                    doc.grade = source.page_analysis.opportunity_grade;
                if (source && source.page_analysis && source.page_analysis.opportunity_grade)
                    doc.base_grade = source.page_analysis.opportunity_grade;
                if (source && source.page_analysis && source.page_analysis.opportunity_score)
                    doc.score = source.page_analysis.opportunity_score;
                if (source && source.address && source.address.country_code)
                    doc.country_code = source.address.country_code;
                if (source && source.location) {
                    doc.lat = source.location.lat;
                    doc.lon = source.location.lon;
                }
                if (source && source.domain_data && source.domain_data.hostname)
                    doc.hostname = source.domain_data.hostname;

                /*if (catType === "google" && source.business.buzz_category_ids) {
                 doc["cat_ids"] = source.business.buzz_category_ids;
                 } else if (catType === "neustar" && source.business.neustar_category_ids) {
                 doc["cat_ids"] = source.business.neustar_category_ids;
                 }
                 if (!doc["country_code"] || !doc["lat"] || !doc["hostname"] || !doc["cat_ids"])*/

                if (!doc["country_code"]) {
                    resolve({"err_msg": "Country not available for this listing"});
                } else if (!doc["lat"]) {
                    resolve({"err_msg": "Location not available for this listing"});
                }
//                else if (!doc["hostname"]) {
//                    resolve({"err_msg": "hostname not available for this listing"});
//                }
                else
                    resolve(doc);
            } else {
                resolve(null);
            }
        } catch (E) {
            logger.fileLogger.error(E);
            resolve({"error": E});
        }
    });
}

/**
 * 
 * @param {type} searchDoc
 * @param {type} catType
 * @returns {Promise}
 */
function clientSearchCompetitor(searchDoc, catType) {
    return new Promise(async function (resolve, reject) {
        //console.log(searchDoc);
        let searchDoc_grade = searchDoc["grade"];

        try {
            if (logic_type === 1) {
                var result = await client.search({index: elastic_indexes["leads_with_url"],
                    type: elastic_types["projects"],
                    body: prepareCatQuery(searchDoc, catType)});
            } else if (logic_type === 2) {
                //console.log("Priority Array ",__priorityArr[searchDoc_grade].length);
                for (var i = 0, len = __priorityArr[searchDoc_grade].length; i < len; i++) {
                    //console.log("i - "+i);console.log(__priorityArr[searchDoc_grade][i]);

                    searchDoc["grade"] = __priorityArr[searchDoc_grade][i];
                    var result = await client.search({index: elastic_indexes["leads_with_url"],
                        type: elastic_types["projects"],
                        body: prepareCatQuery(searchDoc, catType)});
                    if (result && result.hits.total > 0) {
                        break;
                    }
                }

                /*__priorityArr[searchDoc["grade"]].forEach(function(element_grade) {
                 console.log(element_grade);
                 var result = await client.search({index: elastic_indexes["leads_with_url"], 
                 type: elastic_types["projects"], 
                 body: prepareCatQuery(searchDoc, catType)});
                 });*/
                //process.exit();
            }

            if (result && result.hits.total > 0) {
                var uniqueLists = [];
                let competitors = result.hits.hits;
                let competitors_ids = competitors.map(function (item) {
                    //return item._id;
                    if (uniqueLists.length > 0) {
                        //console.log(uniqueLists);

                        if (uniqueLists.length > 2) {
                            return  null;
                        }
                        let result = _.findWhere(uniqueLists, {website: item._source.domain_data.hostname});

                        if (result) {
                            return  null;
                        }
                    }

                    var resobject = {};
                    resobject.fp_id = item._id;
                    resobject.business_name = item._source.business.name;
                    //resobject.website = item._source.business.website;
                    resobject.website = item._source.domain_data.hostname;
                    if (item._source.business.phone_numbers)
                        resobject.business_phone_numbers = item._source.business.phone_numbers;
                    if (item._source.business.emails)
                        resobject.business_emails = item._source.business.emails;
                    if (item._source.address.street_address)
                        resobject.street_address = item._source.address.street_address;
                    if (item._source.address.locality)
                        resobject.city = item._source.address.locality;
                    if (item._source.address.region)
                        resobject.state = item._source.address.region;
                    if (item._source.address.postal_code)
                        resobject.postal_code = item._source.address.postal_code;
                    if (item._source.location.lat)
                        resobject.geo_lat = item._source.location.lat;
                    if (item._source.location.lon)
                        resobject.geo_lon = item._source.location.lon;
                    if (item._source.address.country)
                        resobject.country = item._source.address.country;
                    if (item._source.page_analysis.opportunity_grade)
                        resobject.opportunity_grade = item._source.page_analysis.opportunity_grade;
                    if (item._source.page_analysis.opportunity_score)
                        resobject.opportunity_score = item._source.page_analysis.opportunity_score;
                    if (catType === "neustar")
                        resobject.category_ids = item._source.business.neustar_category_ids;
                    else
                        resobject.category_ids = item._source.business.buzz_category_ids;

                    uniqueLists.push({website: item._source.domain_data.hostname});
                    return resobject;
                });

                let finalCompetitors = competitors_ids.filter(function (value) {
                    return value !== null;

                });

                resolve(finalCompetitors);
                return;
            } else {
                resolve(null);
                return;
            }
        } catch (E) {
            logger.fileLogger.error(E);
            resolve({"error": E});
            return;
        }

    });
}

/**
 * 
 * @param {type} fp_id
 * @returns {nm$_competitor.prepareEalsticQuery.query}
 */
function prepareEalsticQuery(fp_id) {
    var query = {
        "size": 1,
        "query": {
            "filtered": {
                "filter": {
                    "and": [
                        {"terms": {"_id": [fp_id]}}
                    ]
                }
            }
        }
    };
    return query;
}

/**
 * 
 * @param {type} search_params
 * @param {type} cat_type
 * @returns {nm$_competitor.prepareCatQuery.query|undefined}
 */
function prepareCatQuery(search_params, cat_type) {

    var qry = [{"not": {"terms": {"business.listing_source": ["dp_private"]}}}, {"not": {"term": {"business.is_master_record": "no"}}}];
    if (search_params && search_params["grade"]) {
        if (logic_type === 2) {
            qry.push({"terms": {"page_analysis.opportunity_grade.raw": [search_params["grade"]]}});
            if (search_params["base_grade"] === "A" && search_params['score'])
                qry.push({"range": {"page_analysis.opportunity_score": {"gte": search_params["score"]}}});
        } else
            qry.push({"range": {"page_analysis.opportunity_grade.raw": {"lte": search_params["grade"]}}});
    } else {
        qry.push({"terms": {"page_analysis.opportunity_grade.raw": ["A", "B"]}});
    }
    if (search_params && search_params["country_code"])
        qry.push({"term": {"address.country_code": "us"}});
    if (search_params && search_params["lat"])
        qry.push({"geo_distance": {"distance": geo_distance, "location": {"lat": search_params["lat"], "lon": search_params["lon"]}}});
    if (cat_type === "neustar")
        qry.push({"terms": {"business.neustar_category_ids": search_params["cat_ids"]}});
    else
        qry.push({"terms": {"business.buzz_category_ids": search_params["cat_ids"]}});
    if (search_params && search_params["hostname"])
        qry.push({"not": {"term": {"domain_data.hostname.raw": search_params["hostname"]}}});
    qry.push({"not": {"terms": {"_id": [search_params["_id"]]}}});
    qry.push({"exists": {"field": "address.street_address"}});
    var query = {
        "size": 30,
        "_source": {
            "include": ["address.*", "business.*", "page_analysis.opportunity_grade", "page_analysis.opportunity_score", "location.*", "domain_data.hostname"]
        },
        "sort": [
            //{"page_analysis.opportunity_grade": {"order": "asc"}}
            {"page_analysis.opportunity_score": {"order": "desc", "ignore_unmapped": true}}
        ],
        "query": {
            "filtered": {
                "filter": {
                    "and": [qry]
                }
            }
        }
    };

    //console.log("cat query ", util.inspect(query, false, null));//process.exit();
    return query;
}