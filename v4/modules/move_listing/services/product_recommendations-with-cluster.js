/*
 * Description : This file will update recommended products & buzz_score  * Created : 2018 06 06
 * Author : Tulsiram
 * Email : tulasiram@buzzboard.com
 * 
 */



const MongoClient = require('mongodb').MongoClient;
var ObjectId = require("mongodb").ObjectId;
const cluster = require('cluster');

var localDbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";

var recommend_products = require("./product_recommendations/recommendations.js");
var update_score = require("./update_score/update_score.js");

const NUMBER_CHILD_PROCESS = 1; // Don't change this value untill you discuss with Author of this file




var MongoSettings = {
    local: {
        database: "data_us",
        collection: "leads_with_url"
    }
};



const limit = 50000;


// init
if (cluster.isMaster) {
    // var numWorkers = require('os').cpus().length;
    for (var i = 0; i < NUMBER_CHILD_PROCESS; i++) {
        cluster.fork(); //creating child process
    }
    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        // console.log('Starting a new worker');

        if (code !== 3) {
            cluster.fork();
        }

    });
} else {
    console.log("Intialize the Code");
    iterateBatch.call();
}



function iterateBatch() {
    (async function () {
        var local_collection = "";
        var local_db = "";
        var local_dbo = "";
        var local_connection = "";
        var cursor = "";
        var success = 0;
        var exists = 0;
        var failed_to_update = 0;
        var total_docs_ran = 0;
        var failed_generation = 0;
        var doc_not_found_for_update = 0;
        local_connection = await MongoClient.connect(localDbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
        console.log("Mongo Connection established");

        local_db = MongoSettings.local.database;
        local_dbo = local_connection.db(local_db);
        local_collection = MongoSettings.local.collection;

        function updateData(data, collection_name) {
            return new Promise(async (resolve, reject) => {
                try {
                    var collection = "";
                    collection = local_dbo.collection(local_collection);
                    if (!collection) {
                        reject(new Error(`${collection_name} not found`));
                    } else {
                        let doc = "";
                        doc = await collection.save(data);
                        resolve(doc);
                    }
                } catch (E) {
                    reject(E);
                }
            });
        }
        cursor = await local_dbo.collection(local_collection).find({"_log.elastic_moved": 0}).batchSize(100);
//        cursor = await local_dbo.collection(local_collection).find({"domain_data.valid": 1});
//        cursor = await local_dbo.collection(local_collection).find({"_id": ObjectId("569e5fea2f92e2bc288d085e")});


        var stop_limit = await cursor.count();
        if (stop_limit === 0) {
            console.log("ALL DONE------", new Date());
            process.exit(3);
        }
        var total_count = limit;
        console.log("cursor-value count ----", stop_limit);
        console.log("totalcount ---", total_count);
        cursor.forEach(async (doc) => {
            try {

                if (doc !== null || doc !== 'undefined') {
                    total_docs_ran = total_docs_ran + 1;


                    try {

                        if (doc["domain_data"] && doc["domain_data"]["valid"] === 1) {


                            /***************buzz_score STARTS*******************/
//                            var buzz_score_data = "";
//                            var fp_score = "";
//                            let buzz_result = "";
//                            buzz_result = await update_score(doc);
//                            buzz_score_data = buzz_result["buzz_score_data"];
//                            fp_score = buzz_result ["fp_score"];
//                            if (buzz_score_data) {
//                                if (doc["page_analysis"]) {
//                                    doc["page_analysis"]["opportunity_count"] = buzz_score_data['opportunity_count'];
//                                    doc["page_analysis"]["opportunity_score"] = buzz_score_data['opportunity_score'];
//                                    doc["page_analysis"]["opportunity_grade"] = buzz_score_data['opportunity_grade'];
//
//                                    doc["fp_score"] = fp_score;
//
//                                    if (doc["_log"]) {
//                                        doc["_log"]["new_score"] = true;
//                                        doc["_log"]["fp_score"] = true;
//                                    }
//                                    if (doc["dates"]) {
//                                        doc["dates"]["opportunity_score_date"] = new Date();
//                                        doc["dates"]["fp_element_wise_score_date"] = new Date();
//                                    }
//                                }
//
//
//                            }
                            /*************buzz_score ENDS**************************/




                            /***************** recommended products STARTS ************/
                            var products_result = "";
                            products_result = await recommend_products(doc);

                            if (products_result) {


                                doc["recommended_products_details"] = products_result;

                                if (products_result["product_ids"]) {
                                    doc["recommended_products_id"] = products_result["product_ids"];
                                }

                                if (products_result["product_names"]) {
                                    doc["recommended_products"] = products_result["product_names"];
                                }



                                if (doc["dates"]) {
                                    doc["dates"]["product_recommendations_ran_updated_with_nodejs"] = new Date();
                                }
                            }

                            /***************** recommended products STARTS ************/

                            if (!doc["_log"]) {
                                doc["_log"] = {};
                            }

                            doc["_log"]["product_recommendations_ran_updated_with_nodejs"] = 1;
                            doc["_log"]["elastic_moved"] = 1;

                            var result = "";
                            result = await updateData(doc);
                            if (!result.result.n) {
                                let text = `${doc._id} not found`;
                                doc_not_found_for_update = doc_not_found_for_update + 1;
                                console.log(text);
                            } else if (result.result.nModified) {
                                success = success + 1;
                            } else {
                                failed_to_update = failed_to_update + 1;
                            }

                        } else {
                            failed_to_update = failed_to_update + 1;
                        }

                    } catch (E) {
                        console.log(`error_doc_id---${doc._id}`, E.message);
                        failed_generation = failed_generation + 1;
                    }


                    if ((success + failed_generation + failed_to_update) !== 0 && (success + failed_generation + failed_to_update) % 1000 === 0) {
                        console.log("total_docs_ran===", total_docs_ran, "sucess==", success, "last updated doc_id==", doc._id, "doc_notupdated===", failed_to_update, "exists ==", exists, "failed_generation ==", failed_generation);
                    }
                    if ((success + failed_generation + failed_to_update) >= total_count) {

                        console.log("total_docs_ran===", total_docs_ran, "sucess==", success, "last updated doc_id==", doc._id, "doc_notupdated===", failed_to_update, "notupdated_id==", doc._id, "exists ==", exists, "failed_generation ==", failed_generation);
                        console.log(`===========================ITERATE AGAIN=========================${new Date()}========`);
                        await local_db.close();
                        process.exit(3);
                    }


                } else {
                    console.log("document  null or undefined");
                    if ((success + failed_generation + failed_to_update) >= total_count) {
                        console.log("ALL DONE FOR ITERATION");
                        console.log("total_docs_ran===", total_docs_ran, "sucess==", success, "last updated doc_id==", doc._id, "doc_notupdated===", failed_to_update, "notupdated_id==", doc._id, "exists ==", exists, "failed_generation ==", failed_generation);
                        console.log(`===========================ITERATE AGAIN=========================${new Date()}========`);
                        await local_db.close();
                        process.exit(3);
                    }
                }
            } catch (E) {
                console.log(E);
                process.exit();
            }

        });

    })();
}