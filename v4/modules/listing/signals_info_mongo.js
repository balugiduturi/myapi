/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var _ = require('underscore');
var logger = require(__base);
var dbLogger = require(__dblogger);
var ObjectId = require(__base).objcetId;
var util = require("util");





var local_database_conn = require(__base).local_database;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);

var local_master_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_master"];
var local_child_database_name = mongo_elstic_collections_indexes.mongo_databases["staging_child"];

var local_master_db = local_database_conn.db(local_master_database_name);
var local_child_db = local_database_conn.db(local_child_database_name);

var master_keys_document = local_child_db.collection("master_keys_document");

var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;












module.exports = function (req, res) {
    (async function () {
        try {
            var temp_indexes = {};
            var business = false;

            function formatPage_dates(dateInDoc) {
                let formattedDateObj = {};
                let formatDate = (dateInDoc.getTime()) / 1000;

                formatDate = formatDate.toString();
                formatDate = formatDate.split(".");
                if (!formatDate[1]) {
                    formatDate[1] = 0;
                }

                formattedDateObj = {"sec": parseInt(formatDate[0]), "usec": parseInt(formatDate[1])};



                return formattedDateObj["sec"];
            }

            Object.keys(elastic_indexes).forEach(function (key) {
                temp_indexes[`${key}`] = "";
            });

            function checkElement(element_path, source) {
                return new Promise(async (resolve, reject) => {
                    try {
                        if (!source) {
                            resolve(null);
                            return;
                        }

                        let field_found = true;
                        let usec_format = false;
                        fields = element_path.split('.');
                        if (fields[fields.length - 1] === ".sec") {
                            let temp = fields.slice(0, fields[fields.length - 1]);
                            fields = [];
                            fields = temp;
                            usec_format = true;
                        }
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
                            if (usec_format) {
                                fieldSource = formatPage_dates(fieldSource);
                            }
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

                        if (collection === "facebook_posts_data" ||
                                collection === "twitter_posts_data" ||
                                collection === "google_posts_data") {
                            resolve(null);
                        }

                        if (!elastic_types[`${collection}`]) {
                            resolve(null);
                        }
                        var query = {};

                        if (collection === "leads_with_url" || collection === "leads_without_url") {
                            query = {
                                "_id": ObjectId(fpId)

                            };
                        } else {

                            query = {
                                "fp_id": fpId
                            };
                        }

                        if (!temp_indexes[`${collection}`]) {
                            try {
                                temp_indexes[`${collection}`] = await getDocument(collection, query);
                            } catch (E) {
                                dbLogger.setLogger(req.id, "SIGNAL_ERROR", new Date(), E.message);
                                resolve(null);
                            }


                        }


                        if (temp_indexes[`${collection}`]) {
                            try {
                                var data = "";
                                data = await checkElement(element_path, temp_indexes[`${collection}`]);

                                resolve(data);


                            } catch (E) {

                                dbLogger.setLogger(req.id, "SIGNAL_ERROR", new Date(), E.message);
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



            function checkProjectsFpId(collection_name, fp_id) {
                return new Promise(async (resolve, reject) => {
                    try {
                        var collection = "";
                        let doc = "";
                        collection = local_master_db.collection(collection_name);
                        doc = await collection.findOne({"_id": ObjectId(fp_id)});

                        if (!doc) {
                            console.log("No listings found in Projects");
                            reject(new Error(`There is no listing with this fp_id ==== ${fp_id}`));
                        } else {
                            resolve(doc._id);
                        }

                    } catch (E) {
                        reject(E);
                    }
                });
            }

            function getDocument(collection_name, query) {
                return new Promise(async (resolve, reject) => {
                    try {
                        var collection = "";
                        let doc = "";
                        if (collection_name === "leads_with_url" || collection_name === "leads_without_url") {
                            collection = local_master_db.collection(collection_name);
                        } else {
                            collection = local_child_db.collection(collection_name);
                        }

                        doc = await collection.find(query).sort({"$natural": -1}).toArray();

                        if (!doc && doc[0]) {
                            resolve(false);
                        } else {
                            resolve(doc[0]);
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

                dbLogger.setLogger(req.id, "RES_BODY_SIGNALS", new Date(), {
                    status: 412, error: "request must contain body",
                    meta: {
                        req_reference_id: req.id
                    }
                });

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
                    await checkProjectsFpId("leads_with_url", input.fp_id);
                } catch (E) {
                    await checkProjectsFpId("leads_without_url", input.fp_id);
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
                        console.log(E);
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

                dbLogger.setLogger(req.id, "RES_BODY_SIGNALS", new Date(), util.inspect({
                    data,
                    meta: {
                        req_reference_id: req.id
                    }
                }));

                dbLogger.logRespTime(req.id, new Date());

                res.send({
                    data,
                    meta: {
                        req_reference_id: req.id
                    }
                });

            } else {
                dbLogger.logRespTime(req.id, new Date());

                dbLogger.setLogger(req.id, "RES_BODY_SIGNALS", new Date(), {
                    "status": 412,
                    error: "params fp_id is mandatory",
                    meta: {
                        req_reference_id: req.id
                    }
                });

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
            dbLogger.setLogger(req.id, "RES_BODY_SIGNALS", new Date(), {
                status: 500, error: E.message,
                meta: {
                    req_reference_id: req.id
                }
            });
            res.send({
                status: 500, error: E.message,
                meta: {
                    req_reference_id: req.id
                }
            });

        }
    })();
};