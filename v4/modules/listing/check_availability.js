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
var ObjectId = require(__base).objcetId;
var db_name = require(__base).db_name;
var local_database_conn = require(__base).local_database;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);



var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;
var countrie_list = ["us", "gb", "ca", "nz", "uk", "au"];

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



function getAvaialability(input, collection_name, reqId) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                console.log(collection_name)
                var filterArray = [];
                for (let key in input) {
                    try {
                        var result = await getEachKey(key);
                    } catch (E) {
                        dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                        console.log(E.message);

                        return {status: 204, error: E.message};

                    }
                    let nestedList = result.element_path.split(".");
                    var temp = "";

                    for (i = 0; i < nestedList.length; i++) {
                        if (i === 0) {
                            temp = temp + nestedList[i];
                        } else {
                            temp = temp + `.${nestedList[i]}`;
                        }
                    }
                    temp = temp + `.raw`;
                    var eachQuery = {
                        term: {}
                    };
                    eachQuery["term"][`${temp}`] = input[key];
                    filterArray.push(eachQuery);



                }
                filterArray.push({"or": [{"term": {"business.is_master_record": "yes"}}, {"missing": {"field": "business.is_master_record"}}]});

                var result = await client.search({index: elastic_indexes[`${collection_name}`],
                    type: elastic_types[`${collection_name}`],
                    body: {
                        "size": 1,
                        "_source": false,
                        "query": {
                            "filtered": {
                                "filter": {
                                    "and": filterArray

                                }
                            }
                        }
                    }
                });
                if (result && result.hits.total > 0) {

                    let bucketArray = result.hits.hits;
                    var fpId = "";
                    for (let key  in bucketArray) {
                        fpId = bucketArray[key]._id;
                    }
                    return {status: 200, fp_id: fpId};
                } else {
                    dbLogger.setLogger(reqId, "ERROR", new Date(), "No listings found");
                    return {status: 204, message: "No listings found"};
                }

            } catch (E) {
                logger.fileLogger.error(E);
                dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                return {status: 500, error: E.message};
            }

        })());
    });
}

module.exports = function (req, res) {
    (async function () {
        try {
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body", meta: {"request_reference_id": req.id}});
                return;
            }

            if (req.body.business_name || req.body.host_name) {
                if (!req.body.country_code) {
                    res.send({"status": 412, error: "country_code is manatory",
                        meta: {"request_reference_id": req.id}});
                    return;
                } else if (!_.contains(countrie_list, req.body.country_code)) {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), ` country_code ${ req.body.country_code} is not avaialable`);
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({"status": 412, error: ` country_code ${ req.body.country_code} is not avaialable`, meta: {"request_reference_id": req.id}});
                    return;
                }

                let input = req.body;
                var result = await getAvaialability(input, "leads_with_url", req.id);

                if (result.status === 204)
                    result = await getAvaialability(input, "leads_without_url", req.id);
                dbLogger.logRespTime(req.id, new Date());
                res.send({result, meta: {"request_reference_id": req.id}});
                return;

            } else {
                dbLogger.logRespTime(req.id, new Date());
                res.send({"status": 412, error: " either business_name or hostname is mandatory", meta: {"request_reference_id": req.id}});
            }
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: "Something went wrong please try again",
                meta: {"request_reference_id": req.id}

            });
        }

    })();
};