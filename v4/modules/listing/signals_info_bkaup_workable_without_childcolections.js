/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var _ = require('underscore');
var logger = require(__base);
var dbLogger = require(__dblogger);

if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    console.log("in local client");
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}

//var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var local_database_conn = require(__base).local_database;
var analysis_engine_db = local_database_conn.db("analysis_engine_db");
var master_keys_document = analysis_engine_db.collection("master_keys_document");


var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;

function check(value) {
    return new Promise((resolve, reject) => {


        master_keys_document.findOne({"element_key": value.trim()}, (err, doc) => {
            if (!err) {
                if (doc) {
                    if (doc.element_path) {
                        resolve(doc.element_path);
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
function checkElement(source, input) {
    return new Promise(async (resolve, reject) => {

        var data = {
            "signals_found": {},
            "not_analyzed": [],
            "keys_not_found": []
        };
        var signals = input.signals;

        for (var signal in signals) {
            try {
                var element_path = await check(signals[signal]);

            } catch (E) {
                data["keys_not_found"].push(signals[signal]);
                continue;
            }

            let field_found = true//adwords_data.semrush.cost
            fields = element_path.split('.'); //[adwords_data,semrush,cost]
            var fieldSource = source;//{"ad":{"sem:{"cost":}}}} 
            for (var field in fields) { //{"sem:}//{"cost":}
                if (fieldSource[fields[field]]) {

                    fieldSource = fieldSource[fields[field]];
                    field_found = true;
                } else {
                    field_found = false;
                }
            }
            if (field_found) {
                data.signals_found[signals[signal]] = fieldSource;
//                               console.log(value,fieldSource)
            } else {
                data["not_analyzed"].push(signals[signal]);
            }
        }
        console.log(data);
        resolve(data);
    });
}
function checkFpId(reqId, input) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                var result = await client.search({index: elastic_indexes['leads_with_url'],
                    type: elastic_types['leads_with_url'],
                    body: {
                        "query": {
                            "filtered": {
                                "filter": {
                                    "and": [
                                        {
                                            "query": {
                                                "match_phrase": {
                                                    "_id": `${input.fp_id}`
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                });
                if (result && result.hits.total > 0) {

                    var docs = result.hits.hits;
                    var data = "";
                    for (var doc_index in docs) {
                        doc = docs[doc_index]
                        let source = doc._source;
                        data = await checkElement(source, input);

                    }
                    if (!data) {
                        return {status: 204, message: "No listings found"};
                    } else {
                        return {status: 200, data: data};
                    }


                } else {
                    return {status: 204, message: "No listings found"};
                }

            } catch (E) {
                dbLogger.setLogger(reqId, "ERROR", new Date(), E.message);
                logger.fileLogger.error(E);
                return {status: 500, error: E.message};
            }
        })());
    });
}
;

module.exports = function (req, res) {
    (async function () {
        try {
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "request must contain body",
                    meta: {
                        req_reference_id: req.id
                    }});
                return;
            }
            if (req.body.fp_id) {
                let input = req.body;
                var result = await checkFpId(req.id, input);
                dbLogger.logRespTime(req.id, new Date());
                res.send({result,
                    meta: {
                        req_reference_id: req.id
                    }});

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
                status: 500, error: "Something went wrong please try again",
                meta: {
                    req_reference_id: req.id
                }
            });

        }

    })();


};