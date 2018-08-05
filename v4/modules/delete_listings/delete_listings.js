/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(async function () {
    var localDbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";
    var DPConnUrl = "mongodb://dp_root:xyz1236tgbnhy7@107.21.99.225:27017/admin";
    var ObjectId = require('mongodb').ObjectId;
    const MongoClient = require('mongodb').MongoClient;
    var local_database = await MongoClient.connect(localDbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
    var live_database = await MongoClient.connect(localDbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
    var elasticsearch = require('elasticsearch');
    var liveclient = new elasticsearch.Client({
        hosts: [
            '107.21.99.225:9200'
        ],
        requestTimeout: 50000000

    });

    var localclient = new elasticsearch.Client({
        hosts: [
            '104.197.218.69:9200'
        ],
        requestTimeout: 50000000
    });


//    var dev_db = local_database.db("data_us");
//    var collection_name = "leads_with_url";

    var dev_db = local_database.db("analysis_engine_db");
    var collection_name = "leads_with_url";

//    var live_db = live_database.db("ds");
//    var live_collection_name = "ds_projects";

    var live_db = live_database.db("live_analysis_engine_db");
    var live_collection_name = "leads_with_url";

    var elatic_index = "dp_projects";
    var elastic_type = "projects";

    var query = {"_id": {$in: [ObjectId("5ab0db7748ea900a70231b6d"),
                ObjectId("5aafc8ddf38be06932038e04"),
                ObjectId("5aafb8e25b511b6913c949cb"),
                ObjectId("5aaf9de1f38be06932038e03"),
                ObjectId("5aabd373d26b366925343273"),
                ObjectId("5aabc3a4ef6e205046b622b5"),
                ObjectId("5aabbe2e8130b6503528b113"),
                ObjectId("5aabc08b917603501c1565cc")]}};
//    var query = {"domain_data.valid": {"$gt": 1}};



    function updateListings() {
        return new Promise(async (resolve, reject) => {
            try {
                var failed_to_remove = 0;
                var remove_success = 0;
                var removed_sucesss_elastic = 0;
                var failed_remove_elastic = 0;
                var dev_collection = dev_db.collection(`${collection_name}`);
                var live_collection = live_db.collection(`${live_collection_name}`);
                var cursor = await dev_collection.find(query, {"_id": 1});
                console.log("calculating the length")
                console.log(await cursor.count());

                var counter = 0;

                function processItem(error, doc) {
                    if (!error) {
                        if (doc === undefined) {
                            cursor.nextObject(processItem);
                        } else if (doc === null) {
                            resolve({
                                failed_to_remove: failed_to_remove,
                                remove_success: remove_success,
                                removed_sucesss_elastic: removed_sucesss_elastic,
                                failed_remove_elastic: failed_remove_elastic
                            });
                            return;
                        } else {
                            if (doc._id) {
                                (async function () {
                                    try {
                                        console.log(doc)

                                        try {
                                            let  result = await live_collection.remove({"_id": doc._id});
                                            await dev_collection.update({_id: doc._id},
                                                    {
                                                        $set: {
                                                            "_log.delete_invalid": true
                                                        }
                                                    }
                                            );
                                            remove_success = remove_success + 1;

                                        } catch (E) {
                                            console.log(`${E.message}============`, doc._id);
                                            failed_to_remove = failed_to_remove + 1;


                                        }

                                        try {

                                            let elastic_result = await localclient.delete({
                                                index: elatic_index,
                                                type: elastic_type,
                                                id: doc._id.toString()
                                            });
                                            removed_sucesss_elastic = removed_sucesss_elastic + 1;
                                            cursor.nextObject(processItem);

                                        } catch (E) {
                                            console.log(`${E.message}===in Elastic=========`, doc._id);
                                            failed_remove_elastic = failed_remove_elastic + 1;
                                            cursor.nextObject(processItem);

                                        }

                                    } catch (E) {
                                        console.log(E.message);
                                        cursor.nextObject(processItem);
                                    }

                                })();
                            } else {
                                cursor.nextObject(processItem);
                            }
                        }
                    } else {
                        reject(error);
                        return;
                    }

                }
                cursor.nextObject(processItem);


            } catch (E) {
                reject(E);
            }

        });
    }



    try {
        var result = await updateListings();
        console.log(result);
    } catch (E) {
        console.log(E);

    }


})();

