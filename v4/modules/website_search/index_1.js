


if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}

var local_database_conn = require(__base).local_database;
var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;
var dbLogger = require(__dblogger);
var _ = require('underscore');
var refined_search = "http://107.21.99.225:9200/dp_refined_projects/refined_projects/_search";
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);
var util = require('util');


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

function seachWithHostName(reqId, input) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection_name = 'leads_with_url';
            if (input.is_refine_search) {
                collection_name = 'refined_projects';
            }

            console.log("type ---------------", elastic_types[`${collection_name}`]);
            console.log("index ---------------", elastic_indexes[`${collection_name}`]);
            var elasticQuery = host_name_search_query(reqId, input);
            resolve(elasticQuery)
            return;
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
                    eachList["_id"] = bucketArray[key]._id;
                    Object.assign(eachList, bucketArray[key]._source);
                    listings.push(eachList);
                }

                results['listings'] = listings;
                results['meta'] = {
                    'status': "OK",
                    "total_listings_found": result && result.hits.total,
                    "listings_returned": listings.length

                };
                resolve(results);
            } else {
                dbLogger.setLogger(reqId, "ERROR", new Date(), "No listings found");
                resolve({status: 204, message: "No listings found"});
            }

        } catch (E) {
            reject(E);
        }
    });
}

function host_name_search_query(reqId, input) {



    return new Promise(async (resolve, reject) => {
        var filterArray = [];
        try {
            for (let key in input) {
                var result = "";
                try {
                    if (key === "is_refine_search" ||
                            key === "host_name") {
                    } else {
                        result = await getEachKey(key);
                    }

                } catch (E) {
                    dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                    console.log(E.message);
                    reject(E);
                }
                if (result) {
                    let nestedList = result.element_path.split(".");
                    var temp = "";
                    for (i = 0; i < nestedList.length; i++) {
                        if (i === 0) {
                            temp = temp + nestedList[i];
                        } else {
                            temp = temp + `.${nestedList[i]}`;
                        }
                    }
                    var eachQuery = {
                        term: {}
                    };
                    eachQuery["term"][`${temp}`] = input[key];
                    filterArray.push(eachQuery);
                }
            }

            filterArray.push({
                "query": {
                    "match_phrase": {
                        "domain_data.hostname": {
                            "query": input.host_name

                        }
                    }
                }
            })


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
                }
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

        if (!req.body.host_name) {
            let text = `request must contain host_name`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"req_reference_id": req.id}
            });
            return;
        }

        if (!req.body.country_code) {
            let text = `request must contain country_code`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"req_reference_id": req.id}
            });
            return;
        }

        if (!req.body.buzz_partner_id) {
            let text = `request must contain buzz_partner_id`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"req_reference_id": req.id}
            });
            return;
        }
        if (!req.body.hasOwnProperty('is_refine_search')) {
            let text = `request must contain partner_id`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"req_reference_id": req.id}
            });
            return;
        }
        if (req.body.is_refine_search === 0 || req.body.is_refine_search === 1) {

        } else {
            let text = `is_refine_search must be 0 or 1 `;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: {"req_reference_id": req.id}
            });
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
            meta: {"req_reference_id": req.id}
        });
        return;
    }
};