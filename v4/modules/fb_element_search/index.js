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

var local_database_conn = require(__base).local_database;
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var elastic_indexes = mongo_elstic_collections_indexes.elastic_indexes;
var elastic_types = mongo_elstic_collections_indexes.elastic_types;
var dbLogger = require(__dblogger);
var _ = require('underscore');
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);

function getFBData(input) {
    return new Promise(async (resolve, reject) => {
        try {
            var query = await prepareElasticQuery(input);
            var result = await client.search(
                    {index: `${elastic_indexes["leads_with_url"]},${elastic_indexes["leads_without_url"]}`,
                        type: `${elastic_types["leads_with_url"]},${elastic_types["leads_without_url"]}`,
                        body: query
                    });

            if (result && result.hits.total > 0) {
                var bucketArray = result.hits.hits;
                var facebook_data = "";
                for (let key in bucketArray) {
                    facebook_data = bucketArray[key]._source.social.facebook;
                }
                resolve(facebook_data);
            } else {
                reject(new Error("No listings found "));
            }

        } catch (E) {
            reject(E);
        }
    });
}


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

function prepareElasticQuery(input) {
    return new Promise(async (resolve, reject) => {
        try {
            var filterArray = [];

            for (let key in input) {


                try {
                    var result = await getEachKey(key);
                } catch (E) {
                    reject(E);
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

                var eachQuery = {};
                if (temp === "_id") {
                    eachQuery = {
                        term: {}
                    };
                    eachQuery["term"][`${temp}`] = input[key];
                } else {
                    temp = temp + `.sort`;
                    eachQuery = {
                        match_phrase: {}
                    };
                    eachQuery["match_phrase"][`${temp}`] = input[key];
                }


                filterArray.push(eachQuery);

            }

            var body = {
                "_source": ["social.facebook"],
                "size": 1,
                "query": {
                    "filtered": {
                        "filter": {
                            "and": filterArray

                        }
                    }
                },
                "sort": [
                    {"social.facebook.likes": {"order": "desc", "ignore_unmapped": true}}
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
            let text = "request must contain body";
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
            return;
        }
        var input = req.body;

        if (req.body.fp_id) {
            let result = await getFBData(input);
            res.send({"status": 200, "data": result, meta: {"req_reference_id": req.id, "source": "fp_id"}});
            return;
        }
        if (!req.body.country_code) {
            let text = "request must contain country_code";
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
            return;
        }

        var failed_value = "";
        var condition2 = ["hostname", "business_name", "country_code"];
        function validateListingInfo(value) {
            if (!_.contains(condition2, value)) {
                return false;
            } else {
                if (!req.body[`${value}`]) {
                    failed_value = value;
                } else {
                    return true;
                }

            }
        }

        if (failed_value) {
            let text = `request must contain ${failed_value}`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
            return;
        }




        if (Object.keys(req.body).every(validateListingInfo)) {

            let result = await getFBData(input);
            res.send({"status": 200, "data": result, meta: {"req_reference_id": req.id, "source": "hostname or business_name"}});
            return;
        } else {

            if (!req.body.business_name) {
                let text = `request must contain business_name`;
                dbLogger.setLogger(req.id, "ERROR", new Date(), text);
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
                return;
            }
            if (!req.body.locality) {
                let text = `request must contain locality`;
                dbLogger.setLogger(req.id, "ERROR", new Date(), text);
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
                return;
            }
            if (!req.body.region) {
                let text = `request must contain region `;
                dbLogger.setLogger(req.id, "ERROR", new Date(), text);
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: text, meta: {"req_reference_id": req.id}});
                return;
            }

            let result = await getFBData(input);
            res.send({"status": 200, "data": result, meta: {"req_reference_id": req.id, "source": "address"}});
            return;


        }




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