


if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}

var dotize = require("dotize");
var local_database_conn = require(__base).local_database;
var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;
var dbLogger = require(__dblogger);
var _ = require('underscore');
var refined_search = "http://107.21.99.225:9200/dp_refined_projects/refined_projects/_search";
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);
var util = require('util');
var listing_source = ["public", "private"];
var countrie_list = ["us", "gb", "ca", "nz", "uk", "au"];

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

var listing_keys = {
    "id": "_id",
    "bb_added": "",
    "sales_volume": "business.sales_volume",
    "sales_volume_currency_symbol": "business.sales_volume_currency_symbol",
    "business_name": "business.name",
    "website": "domain_data.hostname",
    "street_address": "address.street_address",
    "locality": "location.lat",
    "region": "address.region",
    "postal_code": "address.postal_code",
    "emails": "business.emails",
    "phone_numbers": "business.phone_numbers",
    "opportunity_score": "page_analysis.opportunity_score",
    "opportunity_grade": "page_analysis.opportunity_grade",
    "years_in_business": "business.years_in_business_grade",
    "employees_size": "business.employees_on_site_grade",
    "revenue_site": "business.revenue_at_site_grade",
    "contacts_count": "contact_info.emails_count",
    "business_location_count": "business.locations_count",
    "latitude": "location.lat",
    "longitude": "location.lon",
    "listing_source": "business.listing_source",
    "is_customer": "",
    "category_ids": "business.buzz_category_ids",
    "neustar_category_ids": "business.neustar_category_ids",
    "last_analysis_date": "dates.dp_moved.sec",
    "recommended_products_id": "recommended_products_id",
    "total_spend": "business.total_adspend"
};




function removeDuplicates(input) {
    var arr = [];
    for (var i = 0; i < input.length; i++) {
        if (!arr.includes(input[i])) {

            if ((+input[i]).constructor !== Number) {
                continue;
            }
            if (isNaN((+input[i]))) {
                continue;
            }

            let temp = input[i].split("");

            if (temp.length > 10 && (temp[0] === "0" || temp[0] === "1")) {
                temp.splice(0, 1);
                input[i] = temp.join("");

            }

            if (temp.length === 10) {
                arr.push(input[i]);
            }

        }
    }
    return arr.slice(0, 2);
}
;


function match_element_es_to_ds(doc) {
    return new Promise(async (resolve, reject) => {
        try {
            var formattedObject = {};
            var epochTime = "";
            var formattedMonth = "";
            var formattedYear = "";
            try {
                formattedObject["id"] = doc._id;
                formattedObject["bb_added"] = false;
                formattedObject["sales_volume"] = doc["business"] &&
                        doc["business"]["sales_volume"] ?
                        doc["business"]["sales_volume"] : "";

                formattedObject["sales_volume_currency_symbol"] = doc["business"] &&
                        doc["business"]["sales_volume_currency_symbol"] ?
                        doc["business"]["sales_volume_currency_symbol"] : "";

                formattedObject["business_name"] = doc["business"] &&
                        doc["business"]["name"] ?
                        doc["business"]["name"] : "";

                formattedObject["website"] = doc["domain_data"] &&
                        doc["domain_data"]["hostname"] ?
                        doc["domain_data"]["hostname"] : "";

                formattedObject["street_address"] = doc["address"] &&
                        doc["address"]["street_address"] ?
                        doc["address"]["street_address"].replace(",,", ",").trim() : "";

                formattedObject["locality"] = doc["address"] &&
                        doc["address"]["locality"] ?
                        doc["address"]["locality"] : "";

                formattedObject["region"] = doc["address"] &&
                        doc["address"]["region"] ?
                        doc["address"]["region"] : "";

                formattedObject["postal_code"] = doc["address"] &&
                        doc["address"]["postal_code"] ?
                        doc["address"]["postal_code"] : "";

                formattedObject["emails"] = doc["business"] &&
                        doc["business"]["emails"] && doc["business"]["emails"].length > 0 ?
                        doc["business"]["emails"] : "";

                formattedObject["phone_numbers"] = doc["business"] &&
                        doc["business"]["phone_numbers"] && doc["business"]["phone_numbers"].length > 0 ?
                        removeDuplicates(doc["business"]["phone_numbers"]) : "";

                formattedObject["opportunity_score"] = doc["page_analysis"] &&
                        doc["page_analysis"]["opportunity_score"] ?
                        doc["page_analysis"]["opportunity_score"] : "";

                formattedObject["opportunity_grade"] = doc["page_analysis"] &&
                        doc["page_analysis"]["opportunity_grade"] ?
                        doc["page_analysis"]["opportunity_grade"] : "";

                formattedObject["years_in_business"] = doc["business"] &&
                        doc["business"]["years_in_business_grade"] ?
                        doc["business"]["years_in_business_grade"] : "";

                formattedObject["employees_size"] = doc["business"] &&
                        doc["business"]["employees_on_site_grade"] ?
                        doc["business"]["employees_on_site_grade"] : "";

                formattedObject["revenue_site"] = doc["business"] &&
                        doc["business"]["revenue_site"] ?
                        doc["business"]["revenue_site"] : "";

                formattedObject["contacts_count"] = doc["contact_info"] &&
                        doc["contact_info"]["emails_count"] ?
                        doc["contact_info"]["emails_count"] : "";

                formattedObject["business_location_count"] = doc["business"] &&
                        doc["business"]["locations_count"] ?
                        doc["business"]["locations_count"] : "";

                formattedObject["latitude"] = doc["location"] &&
                        doc["location"]["lat"] ?
                        doc["location"]["lat"] : 0;

                formattedObject["longitude"] = doc["location"] &&
                        doc["location"]["lon"] ?
                        doc["location"]["lon"] : 0;

                formattedObject["listing_source"] = doc["business"] &&
                        doc["business"]["listing_source"] ?
                        doc["business"]["listing_source"] : ['dp_public'];

                formattedObject["is_customer"] = false;

                formattedObject["listing_source"] = doc["business"] &&
                        doc["business"]["listing_source"] ?
                        doc["business"]["listing_source"] : ['dp_public'];

                formattedObject["category_ids"] = doc["business"] &&
                        doc["business"]["buzz_category_ids"] ?
                        doc["business"]["buzz_category_ids"] : [];

                formattedObject["neustar_category_ids"] = doc["business"] &&
                        doc["business"]["neustar_category_ids"] ?
                        doc["business"]["neustar_category_ids"] : [];


                formattedObject["last_analysis_date"] = doc["dates"] &&
                        doc["dates"]["dp_moved"] ?
                        (doc["dates"]["dp_moved"]['sec'] ?
                                (
                                        epochTime = new Date(doc["dates"]["dp_moved"]['sec'] * 1000),
                                        formattedMonth = monthNames[epochTime.getMonth()],
                                        formattedYear = epochTime.getFullYear(),
                                        formattedMonth + " " + formattedYear
                                        ) : []) : null;


                formattedObject["recommended_products_id"] = doc["recommended_products_id"] ?
                        doc["recommended_products_id"] : [];

                formattedObject["total_spend"] = doc['business'] &&
                        doc['business']['total_adspend'] ?
                        doc['business']['total_adspend'] : 0;




                resolve(formattedObject);
                return;
            } catch (E) {
                reject(E);
                return;
            }


        } catch (E) {
            reject(E);
            return;
        }
    });
}

function getEachKey(value) {
    return new Promise(async (resolve, reject) => {
        try {
            collection = local_child_db.collection("master_keys_document");
            let doc = await collection.findOne({"element_key": value});
            if (!doc) {
//                resolve(false);
//                return;
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

function getEachElementPath(value) {
    return new Promise(async (resolve, reject) => {
        try {
            collection = local_child_db.collection("master_keys_document");
            let doc = await collection.findOne({"element_path": value});
            if (!doc) {
                reject(new Error(`No element_key with ${value} found`));
                return;
            } else {
                if (doc.element_key && doc.common_collection) {
                    resolve({element_key: doc.element_key, common_collection: doc.common_collection});
                    return;
                } else {
                    reject(new Error(`element_key not found for ${value}`));
                    return;
                }

            }

        } catch (E) {
            reject(E);
            return;
        }
    });
}

function seachWithHostName(reqId, input) {
    return new Promise(async (resolve, reject) => {
        try {

            collection_name = 'leads_with_url';
            input.listing_source = "public";
            var elasticQuery = await host_name_search_query(input);
            var result = await client.search({index: elastic_indexes[`${collection_name}`],
                type: elastic_types[`${collection_name}`],
                body: elasticQuery
            });
            var listings = [];
            var results = {};
            if (result && result.hits.total > 0) {
                var bucketArray = result.hits.hits;
                for (let key  in bucketArray) {
                    let eachList = {};
                    eachList = bucketArray[key]._source;
                    eachList["_id"] = bucketArray[key]._id;
                    eachList = await match_element_es_to_ds(eachList);
                    listings.push(eachList);
                    break;
                }

                results['listings'] = listings;
                results ['meta'] = {
                    "status": "OK",
                    "total_listings_found": result.hits.total,
                    "listings_returned": listings.length,
                    'request_reference_id': reqId
                };
                resolve({
                    results: results
                }
                );
            } else {
                dbLogger.setLogger(reqId, "ERROR", new Date(), "No listings found");
                resolve({status: 204, message: "No listings found", meta: {
                        'request_reference_id': reqId
                    }});
            }

        } catch (E) {
            reject(E);
        }
    });
}

function host_name_search_query(input) {



    return new Promise(async (resolve, reject) => {
        var filterArray = [];
        try {

            filterArray.push({
                "query": {
                    "match_phrase": {
                        "domain_data.hostname.sort": {
                            "query": input.hostname

                        }
                    }
                }
            });
            filterArray.push({
                "terms": {
                    "domain_data.valid": [
                        1
                    ]
                }
            });
            if (input.locality) {
                filterArray.push({
                    "match_phrase": {
                        "address.locality": input.locality
                    }
                });
            }

            if (input.country_code) {
                filterArray.push({
                    "match_phrase": {
                        "address.country_code": input.country_code
                    }
                });
            }
            if (input.region) {
                filterArray.push({
                    "match_phrase": {
                        "address.region": input.region
                    }
                });
            }
            if (input.street_address) {
                filterArray.push({
                    "match_phrase": {
                        "address.street_address": input.street_address
                    }
                });
            }

            if (input.postal_code) {
                filterArray.push({
                    "match_phrase": {
                        "address.postal_code": input.postal_code
                    }
                });
            }

            if (input.listing_source === 'private') {
                filterArray.push({
                    "match_phrase": {
                        "business.buzz_partner_id": input.partner_id
                    }
                });
            } else {
                filterArray.push({
                    "match_phrase": {
                        "business.listing_source": `dp_${input.listing_source}`
                    }
                });
            }
            var body = {
                "from": 0,
                "size": 1,
                "_source": {
                    "include": [
                        "address.*",
                        "business.*",
                        "contact_info.*",
                        "domain_data.hostname",
                        "page_analysis.*",
                        "page_analysis.page_lang",
                        "location",
                        "dates.analysis_date",
                        "dates.dp_moved",
                        "recommended_products.*",
                        "recommended_products_id.*"
                    ],
                    "exclude": [
                        "address.neighborhood",
                        "business.category_labels",
                        "business.category_name"
                    ]
                },
                "query": {
                    "filtered": {
                        "filter": {
                            "and": filterArray

                        }
                    }

                },
                "sort": [
                    {"page_analysis.business_title_match": {"order": "desc", "ignore_unmapped": true}},
                    {"domain_data.valid": {"order": "asc", "ignore_unmapped": true}}
                ]

            };
            resolve(body);
        } catch (E) {
            reject(E);
        }
    });
}
module.exports = async function (req, res) {
    try {
        if (!req.body) {
            let text = "request must contain body"
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
            return;
        }

        if (!req.body.hostname) {
            let text = `request must contain hostname`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"request_reference_id": req.id}
            });
            return;
        }

        if (!req.body.country_code) {
            dbLogger.logRespTime(req.id, new Date());
            res.send({"status": 412, error: "country_code is missing", meta: {"request_reference_id": req.id}});
            return;
        } else if (!_.contains(countrie_list, req.body.country_code)) {
            dbLogger.setLogger(req.id, "ERROR", new Date(), ` country_code ${req.body.country_code} is not avaialable`);
            dbLogger.logRespTime(req.id, new Date());
            res.send({"status": 412, error: ` country_code ${req.body.country_code} is not avaialable`, meta: {"request_reference_id": req.id}});
            return;
        }



        var input = req.body;
        var result = await seachWithHostName(req.id, input);
        res.send(result);
    } catch (E) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), E);
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 500, error: E.message,
            meta: {"request_reference_id": req.id}
        });
        return;
    }
};