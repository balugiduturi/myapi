/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var _ = require('underscore');
var logger = require(__base);
var dbLogger = require(__dblogger);
var ObjectId = require(__base).objcetId;
if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    console.log("in local client");
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}

//var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var local_database_conn = require(__base).local_database;



var mongo_elstic_collections_indexes = require("../../connections/indexes_and_mongo_collections.js");

var local_master_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_master"];
var local_child_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_child"];


var local_master_db = local_database_conn.db(local_child_database_name);
var master_keys_document = local_master_db.collection("master_keys_document");


var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;










module.exports = function (req, res) {









    (async function () {
        try {
            var temp_indexes = {};
            var business = false;

            Object.keys(elastic_indexes).forEach(function (key) {
                temp_indexes[`${key}`] = "";
            });

            function checkElement(element_path, source) {
                return new Promise(async (resolve, reject) => {
                    try {
                        if (!source) {
                            console.log("no source");
                            resolve(null);
                            return;
                        }

                        let field_found = true;
                        fields = element_path.split('.');

                        var fieldSource = source;
                        for (var field in fields) {

                            if (fieldSource.hasOwnProperty(`${[fields[field]]}`)) {

                                fieldSource = fieldSource[fields[field]];
                                field_found = true;
                            } else {
                                field_found = false;
                            }
                        }

                        if (field_found) {

                            resolve(fieldSource);
                        } else {
                            resolve(null);
                        }

                    } catch (E) {
                        reject(E);
                    }
                });
            }
            function checkFpId(reqId, element_path, collection, fpId) {
                return new Promise(async (resolve, reject) => {

                    try {

                        if (collection === "leads_with_url") {
                            if (business)
                                collection = "leads_without_url"; //since element-keys available for only fp data
                        }


                        if (!elastic_types[`${collection}`]) {
                            resolve(null);
                        }
                        var filterArray = [];

                        if (collection === "leads_with_url" || collection === "leads_without_url") {
                            filterArray.push({"term": {"_id": `${fpId}`}});
                        } else {
                            filterArray.push({"term": {"fp_id": `${fpId}`}});
                        }

                        if (!temp_indexes[`${collection}`]) {
                            try {
                                temp_indexes[`${collection}`] = await client.search({
                                    index: elastic_indexes[`${collection}`],
                                    type: elastic_types[`${collection}`],
                                    body: {
                                        "query": {
                                            "filtered": {
                                                "filter": {
                                                    "and": filterArray
                                                }
                                            }
                                        }
                                    }
                                });
                            } catch (E) {
                                dbLogger.setLogger(req.id, "SIGNAL_ERROR", new Date(), E.message);
                                resolve(null);
                            }


                        }


                        if (temp_indexes[`${collection}`] && temp_indexes[`${collection}`].hits.total > 0) {
                            try {
                                var docs = temp_indexes[`${collection}`].hits.hits;
                                var data = "";
                                for (var doc_index in docs) {
                                    doc = docs[doc_index];
                                    let source = doc._source;
                                    data = await checkElement(element_path, source);

                                }
                                resolve(data);


                            } catch (E) {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }




                    } catch (E) {
                        dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                        logger.fileLogger.error(E);
                        reject(E);
                    }

                });
            }


            function check(value) {
                return new Promise((resolve, reject) => {


                    master_keys_document.findOne({"element_key": value.trim()}, (err, doc) => {
                        if (!err) {
                            if (doc) {
                                if (doc.element_path && doc.common_collection) {
                                    resolve({element_path: doc.element_path, common_collection: doc.common_collection});
                                } else {
                                    reject(new Error("No element found"));
                                }


                            } else {
                                reject(new Error("No element found"));
                            }


                        } else {
                            console.log(err);
                            reject(false);
                        }

                    });
                });
            }


            function checkElasticFpId(fpId) {
                return new Promise(async (resolve, reject) => {
                    try {
                        var result = "";
                        result = await client.search({
                            index: elastic_indexes["leads_with_url"],
                            type: elastic_types["leads_with_url"],
                            body: {
                                "query": {
                                    "filtered": {
                                        "filter": {
                                            "and": [{"term": {"_id": `${fpId}`}}]
                                        }
                                    }
                                }
                            }
                        });

                        if (result && result.hits.total > 0) {
                            resolve(true);
                        } else {
                            console.log("result.hits.hits======");
                            console.log(result.hits.hits);
                            reject(new Error(`There is no listing with this fp_id ==== ${fpId}`));



                        }
                    } catch (E) {
                        reject(E);
                    }
                });
            }

            function checkElasticBusinessFpId(fpId) {
                return new Promise(async (resolve, reject) => {
                    try {
                        var result = "";
                        result = await client.search({
                            index: elastic_indexes["leads_without_url"],
                            type: elastic_types["leads_without_url"],
                            body: {
                                "query": {
                                    "filtered": {
                                        "filter": {
                                            "and": [{"term": {"_id": `${fpId}`}}]
                                        }
                                    }
                                }
                            }
                        });

                        if (result && result.hits.total > 0) {
                            resolve(true);
                        } else {
                            console.log("result.hits.hits====== in business");
                            console.log(result.hits.hits);
                            reject(new Error(`There is no listing with this fp_id ==== ${fpId}`));
                        }
                    } catch (E) {
                        reject(E);
                    }
                });
            }


            /*
             * ***************************************INIT*********************************************
             */

            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({
                    status: 412, error: "request must contain body",
                    meta: {
                        req_reference_id: req.id
                    }
                });
                return;
            }
            if (req.body.fp_id) {

                var input = req.body;
                try {
                    await checkElasticFpId(input.fp_id);
                } catch (E) {
                    await checkElasticBusinessFpId(input.fp_id);
                    business = true;
                }




                var data = {
                    signals_found: {},
                    "not_analyzed": [],
                    "keys_not_found": []

                };



                for (let signal in input.signals) {
                    var eachSignal = input.signals[signal];
                    try {
                        var elementData = await check(eachSignal);
                    } catch (E) {
                        data["keys_not_found"].push(eachSignal);
                        continue;
                    }

                    var element_path = elementData.element_path;
                    var collection = elementData.common_collection;
                    var result = await checkFpId(req.id, element_path, collection, input.fp_id);

                    if (result === null) {
                        data["not_analyzed"].push(eachSignal);
                    } else {
                        data["signals_found"][`${eachSignal}`] = result;
                    }
                }


                dbLogger.logRespTime(req.id, new Date());
                res.send({
                    data,
                    meta: {
                        req_reference_id: req.id
                    }
                });

            } else {
                dbLogger.logRespTime(req.id, new Date());
                res.send(
                        {
                            "status": 412,
                            error: "params fp_id is mandatory",
                            meta: {
                                req_reference_id: req.id
                            }
                        }
                );
            }

        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.logRespTime(req.id, new Date());
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: E.message,
                meta: {
                    req_reference_id: req.id
                }
            });

        }

    })();


};