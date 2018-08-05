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
    var query = {"_id": {$in: [ObjectId("5a953db9d4517717c786f808"),
                ObjectId("5a952d69dfed8155cb6896cd"),
                ObjectId("5a9e8b9ac9289319b8172afa"),
                ObjectId("5a9e9150171387118455aaf1"),
                ObjectId("5a9e96c793192922b44ff053"),
                ObjectId("5a9eaa03f96e4243ec1d9b6c"),
                ObjectId("5a9eab9fef62101ad45b4bce")

            ]}};

//    var query = {"domain_data.valid": {"$gt": 1}};
    var failed_to_remove = 0;
    var remove_success = 0;
    var removed_sucesss_elastic = 0;
    var failed_remove_elastic = 0;
    var dev_collection = dev_db.collection(`${collection_name}`);
    var live_collection = live_db.collection(`${live_collection_name}`);
    var counter = 0;
    function updateListings() {
        return new Promise(async (resolve, reject) => {
            try {


                var cursor = await dev_collection.find(query, {"_id": 1});
                console.log("calculating the length")
                var totalCount = await cursor.count();
                console.log(totalCount);
                cursor.forEach(async doc => {

                    await deleteEachlisting(doc._id);
                    counter = counter + 1;
                    if (counter % 7 === 0) {
                        console.log("completed =====", counter);
                        console.log("failed_to_remove====", failed_to_remove);
                        console.log("removed_sucesss_elastic====", removed_sucesss_elastic);
                        console.log("failed_remove_elastic====", failed_remove_elastic);


                    }

                });
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

    function deleteEachlisting(fpId) {
        return new Promise(async (resolve, reject) => {
            try {
                try {
                    let  result = await live_collection.remove({"_id": fpId});
                    await dev_collection.update({_id: fpId},
                            {
                                $set: {
                                    "_log.delete_invalid": true
                                }
                            }
                    );
                    remove_success = remove_success + 1;
                    console.log("remove_success===", remove_success, fpId)
                } catch (E) {
                    console.log(`${E.message}============`, fpId);
                    failed_to_remove = failed_to_remove + 1;
                }


                try {

                    let elastic_result = await localclient.delete({
                        index: elatic_index,
                        type: elastic_type,
                        id: fpId.toString()
                    });
                    removed_sucesss_elastic = removed_sucesss_elastic + 1;
                    resolve(true);
                } catch (E) {
                    console.log(`${E.message}===in Elastic=========`, fpId);
                    failed_remove_elastic = failed_remove_elastic + 1;
                    resolve(false);
                }




            } catch (E) {
                console.log(E.message);
                reject(E);
            }
        });
    }


})();

