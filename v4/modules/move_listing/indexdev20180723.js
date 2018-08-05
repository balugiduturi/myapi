//var logger = require(__base);
var mongo_move = require('./live_mongo_move.js');
var indexingIntoElastic = require('./live_elastic_move.js');
const MongoClient = require('mongodb').MongoClient;
var objcetId = require('mongodb').ObjectId;
const customAsync = require('async')

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var format_doc_to_index = require("./format_doc_to_for_live.js");
var format_business_data = require("./format_business_data.js");
var mongo_version = require("./mongo_version.js")
var elastic_version = require("./elastic_version.js")
var dbLogger = require(__dblogger);

var local_database_conn = require(__base).local_database;
var live_database_conn = require(__base).live_database;
var util = require("util");
var elasticsearch = require('elasticsearch');
const deleteByQuery = require('elasticsearch-deletebyquery');
// var live_database = require(__base).live_database

const live_child_database_name = mongo_elstic_collections_indexes.mongo_databases["live_child"];

var local_master_data_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var local_child_data_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_child"]);

var staging_mongo_collections = mongo_elstic_collections_indexes.staging_mongo_collections;
var version_mongo_collections = mongo_elstic_collections_indexes.version_mongo_collections;
var staging_elastic_indexes = mongo_elstic_collections_indexes.elastic_indexes;
var staging_elastic_types = mongo_elstic_collections_indexes.elastic_types;
var version_elastic_types = mongo_elstic_collections_indexes.version_elastic_types;



if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;

} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}


module.exports = async function (reqId, req_reference_id, update_listing_info) {
    return new Promise(async function (resolve, reject) {



        function getmasterDoc(collection, query) {
            return new Promise(async function (resolve, reject) {
                try {
                    var data_collection = local_master_data_db.collection(collection)
                    var documnent = await data_collection.findOne(query)
                    //          //console.log("documnent ",documnent)
                    resolve(documnent)
                } catch (E) {
                    reject(E);
                }

            })
        }

        function moveSubCollections(req_fp_id, update_collections, req_reference_id, reqId, master_doc_version) {
            console.log("********* supporting Collection Move And Versioning Started *****************");
            return new Promise(async function (resolve, reject) {




                await Promise.all(update_collections.map(async function (element_collection) {
                    try {
                        var element_collection_name = staging_mongo_collections[element_collection]
                        moved_info["elastic"][staging_elastic_types[element_collection]] = []
                        moved_info["mongo"][element_collection_name] = []
                        version_info["elastic"][version_elastic_types[element_collection]] = []
                        version_info["mongo"][version_mongo_collections[element_collection]] = []


                        if (element_collection_name === "facebook_posts_data" || element_collection_name === "twitter_posts_data" || element_collection_name === "google_posts_data") {
                            var removedFromMongoObj = await removeDocsFromLiveMongoByFP_ID(element_collection_name, req_fp_id, req_reference_id)
                            if (removedFromMongoObj && removedFromMongoObj.error) {
                                var move_info_obj_elastic = {moved: false, reason: "MONGO : error while deleting docs from " + element_collection + " by fp id :" + req_fp_id}
                                moved_info["mongo"][element_collection].push(move_info_obj_mongo)
                                return null
                            }
                            var removedFromElasticObj = await removeDocsFromLiveElasticByFP_ID(staging_elastic_indexes[element_collection], staging_elastic_types[element_collection], req_fp_id, req_reference_id)
                            if (removedFromElasticObj && removedFromElasticObj.error) {
                                var move_info_obj_elastic = {moved: false, reason: "ELASTIC :  error while deleting docs from index : " + staging_elastic_indexes[element_collection] + ", Collection:" + staging_elastic_types[element_collection] + " by fp id :" + req_fp_id}
                                moved_info["mongo"][element_collection].push(move_info_obj_mongo)
                                return null
                            }
                        }
                        var analysis_search_query = {"fp_id": req_fp_id.toString()}
                        var sub_docs = await getsubDoc(element_collection, analysis_search_query)

                        if (element_collection_name)
                            var local_element_collection_instance = local_child_data_db.collection(element_collection_name)
                        else {
                            dbLogger.setLogger(req_reference_id, "INFO", new Date(), "no constant   found for this" + element_collection + " collection");
                            var move_info_obj_mongo = {moved: false, reason: "no constant   found for this collection"}
                            moved_info["mongo"][element_collection].push(move_info_obj_mongo)
                            version_info["mongo"][version_mongo_collections[element_collection]].push(move_info_obj_mongo)
                            var move_info_obj_elastic = {moved: false, reason: "no constant   found for this collection"}
                            moved_info["elastic"][staging_elastic_types[element_collection]].push(move_info_obj_elastic)
                            version_info["elastic"][version_elastic_types[element_collection]].push(move_info_obj_elastic)
                            //                    resolve()
                            return null;
                        }
                        /* moving data to mongo*/
                        //                 
                        if (sub_docs && sub_docs.length > 0) {
                            var promiseArray = [];
                            for (var element in sub_docs) {
                                var subdoc = sub_docs[element]

                                var sub_doc_to_formatted = Object.assign({}, sub_docs[element])
                                if (sub_doc_to_formatted["_log"])
                                    delete sub_doc_to_formatted["_log"]
                                if (sub_doc_to_formatted["dates"])
                                    delete sub_doc_to_formatted["dates"]
                                var sub_doc_mongo_id = subdoc["_id"]



                                await mongo_move(reqId, req_reference_id, moved_info, element_collection_name, sub_doc_to_formatted)
                                await indexingIntoElastic(reqId, req_reference_id, moved_info, element_collection, sub_doc_to_formatted, local_element_collection_instance)

                                var sub_ref_id = sub_doc_mongo_id.toString();




                                /**********************Mongo VERSION SUB_DOC START **********************************/

                                //                        if (element_collection_name === "facebook_posts_data" || element_collection_name === "twitter_posts_data" || element_collection_name === "google_posts_data") {
                                //
                                //                        } else {
                                //                            if (!sub_doc_to_formatted["business"])
                                //                                sub_doc_to_formatted["business"] = {};
                                //                            sub_doc_to_formatted["business"]["version"] = master_doc_version;
                                //                            
                                //                            
                                //                            var mongo_versionedDocumnet = await mongo_version(version_info, req_fp_id, sub_ref_id, sub_doc_to_formatted, version_mongo_collections[element_collection], req_reference_id, reqId)
                                ////                             console.log("********* Supporting Collection "+version_mongo_collections[element_collection]+"Mongo Version Compelted Completed  ***************** mongo_versionedDocumnet._id :",mongo_versionedDocumnet._id)
                                //
                                //                            if (mongo_versionedDocumnet && mongo_versionedDocumnet._id)
                                //                                await elastic_version(version_info, sub_doc_mongo_id, mongo_versionedDocumnet, element_collection, req_reference_id, reqId, local_element_collection_instance)
                                ////                               console.log("********* Supporting Collection "+version_mongo_collections[element_collection]+"Elastic Version Compelted Completed  ***************** mongo_versionedDocumnet._id :",mongo_versionedDocumnet._id)
                                //
                                //                        }

                                /**********************Mongo VERSION SUB_DOC ENDS **********************************/
                            }
                        } else {

                            dbLogger.setLogger(req_reference_id, "INFO", new Date(), "no documnent found in " + element_collection + " for this fp_Id " + req_fp_id);
                            var move_info_obj_mongo = {moved: false, reason: "no documnent found for this   fp_Id " + req_fp_id}
                            moved_info["mongo"][element_collection].push(move_info_obj_mongo)
                            version_info["mongo"][version_mongo_collections[element_collection]].push(move_info_obj_mongo)
                            var move_info_obj_elastic = {moved: false, reason: "no documnent found for this   fp_Id " + req_fp_id}
                            moved_info["elastic"][staging_elastic_types[element_collection]].push(move_info_obj_elastic)
                            version_info["elastic"][version_elastic_types[element_collection]].push(move_info_obj_elastic)
                        }
                    } catch (Exception) {
                        dbLogger.setLogger(req_reference_id, "INFO", new Date(), Exception.message);
                        var move_info_obj_mongo = {moved: false, reason: Exception.message}
                        moved_info["mongo"][element_collection].push(move_info_obj_mongo)
                        version_info["mongo"][version_mongo_collections[element_collection]].push(move_info_obj_mongo)
                        var move_info_obj_elastic = {moved: false, reason: Exception.message}
                        moved_info["elastic"][staging_elastic_types[element_collection]].push(move_info_obj_elastic)
                        version_info["elastic"][version_elastic_types[element_collection]].push(move_info_obj_elastic)
                    }
                }));

                resolve();
            });


        }


        function removeDocsFromLiveMongoByFP_ID(element_collection_name, req_fp_id, req_reference_id) {
            return new Promise(async function (resolve, reject) {
                try {
                    var live_data_db = live_database_conn.db(live_child_database_name);
                    var live_data_collection = live_data_db.collection(element_collection_name);
                    await live_data_collection.remove({"fp_id": req_fp_id}, {multi: true})
                    resolve()
                } catch (Exception) {
                    dbLogger.setLogger(req_reference_id, "ERROR", new Date(), "Removing from " + element_collection_name + " failed,Reason  : ", Exception.message);
                    resolve({error: Exception.message})
                }
            })
        }




        function removeDocsFromLiveElasticByFP_ID(index, type, fp_id, req_reference_id) {

            return new Promise(async function (resolve, reject) {
                try {

                    client.deleteByQuery({
                        index: index,
                        type: type,
                        body: {
                            query: {
                                term: {fp_id: fp_id}
                            }
                        }
                    }, function (err, res) {

                        if (err) {
                            console.log("removing elastic supporting by fp id failed " + err)
                            dbLogger.setLogger(req_reference_id, "ERROR", new Date(), " err : Removing from type " + type + " failed,Reason  : ", err);

                            resolve({"error": err});

                        } else if (res && res.items && res.items[0].index.error) {
                            var failed_reason = "";
                            if (res.items[0].index.error && res.items[0].index.error.reason)
                                var failed_reason = failed_reason + res.items[0].index.error.reason
                            if (res.items[0].index.error.caused_by)
                                var failed_reason = failed_reason + res.items[0].index.error.caused_by
                            dbLogger.setLogger(req_reference_id, "ERROR", new Date(), "res.err : Removing from type " + type + " failed,Reason  : ", failed_reason);

                            resolve({error: failed_reason})
                        } else {
                            resolve({"res": res})
                        }

                    });



                } catch (Exception) {
                    console.log("Exception  Removing from type " + type + " failed,Reason  : ", Exception)
                    dbLogger.setLogger(req_reference_id, "ERROR", new Date(), "Exception : Removing from type " + type + " failed,Reason  : ", Exception);
                    resolve({error: Exception})
                }
            })
        }

        function getsubDoc(collection, query) {
            return new Promise(async function (resolve, reject) {
                try {
                    var data_collection = local_child_data_db.collection(collection)
                    var documnent = await data_collection.find(query).toArray()
                    resolve(documnent);
                } catch (E) {
                    reject(E);
                }

            })
        }





        var moved_info = {}
        var version_info = {};
        moved_info["mongo"] = {}
        moved_info["data_urls"] = {};

        if (process.env.NODE_ENV === 'production' ||
                process.env.NODE_ENV === 'staging') {
            moved_info["data_urls"] ["mongo_url"] = "104.197.218.69:27017";
            moved_info["data_urls"] ["elastic_url"] = "http://107.21.99.225:9200";

        } else {
            moved_info["data_urls"] ["mongo_url"] = "104.197.218.69:27017";
            moved_info["data_urls"] ["elastic_url"] = "http://es1.discover-prospects.com:9200";
        }


        moved_info["elastic"] = {};
        version_info["mongo"] = {};
        version_info["elastic"] = {};
        try {


            /* recived sub collections*/
            var update_collections = update_listing_info["collections"]
            /* received master collection*/
            var from_req_masterCollection = update_listing_info["leads_collection"]
            var masterCollection = staging_mongo_collections[from_req_masterCollection]
            var req_fp_id = update_listing_info["fp_id"];
            var master_query = {"_id": objcetId(req_fp_id)}
            var local_master_data_collection_instance = local_master_data_db.collection(masterCollection)

            /* master leadsWithUrl or_lead with out url data move */
            if (masterCollection) {
                var masterCollection_Name = [staging_elastic_types[from_req_masterCollection]]
                moved_info["elastic"][staging_elastic_types[from_req_masterCollection]] = []
                moved_info["mongo"][masterCollection] = []
                version_info["elastic"][version_elastic_types[from_req_masterCollection]] = []
                version_info["mongo"][version_mongo_collections[from_req_masterCollection]] = []


                /*getting master leads doc*/
                var leads_documnt = await getmasterDoc(staging_mongo_collections[masterCollection], master_query);
                if (!leads_documnt) {
                    dbLogger.setLogger(reqId, "INFO", new Date(), "there is no   document in " + masterCollection + " for this fp_Id " + req_fp_id);
                    dbLogger.setLogger(req_reference_id, "INFO", new Date(), "there is no   document in " + masterCollection + " for this fp_Id " + req_fp_id);
                    resolve({message: "process terminated", error: "no documnets found in " + masterCollection + " for " + req_fp_id + " fp id"})
                    return null;
                }

                if (leads_documnt.hasOwnProperty("dates")) {
                    leads_documnt["dates"]["dp_moved"] = new Date()


                } else {
                    leads_documnt["dates"] = {};
                    leads_documnt["dates"]["dp_moved"] = new Date();
                }
                var doc_id = leads_documnt["_id"];
                var master_doc_version = leads_documnt["business"]["version"]
                var formatted_doc;
                /* assigning doc and which is not disyurb original i.e leads_documnt*/
                var doc_to_format = Object.assign({}, leads_documnt)
                if (masterCollection === "leads_without_url")
                    formatted_doc = format_business_data(doc_to_format);
                else
                    formatted_doc = format_doc_to_index(doc_to_format);


                if (formatted_doc && formatted_doc["error"]) {
                    if (leads_documnt["_id"])
                        delete leads_documnt["_id"];



                    if (!leads_documnt["_log"])
                        leads_documnt["_log"] = {};

                    leads_documnt["_log"]["elastic_moved"] = false;
                    leads_documnt["_log"]["elastic_err_discription"] = formatted_doc["error"].toString()
                    local_master_data_collection_instance.update({"_id": {$in: [doc_id]}}, {$set: leads_documnt})

                    dbLogger.setLogger(reqId, "ERROR", new Date(), formatted_doc["error"].toString());
                    dbLogger.setLogger(req_reference_id, "ERROR", new Date(), formatted_doc["error"].toString());
                    resolve({message: "not moved", error: formatted_doc["error"].toString()})
                    return null;
                }




                /* moving master data to mongo collection  */
                await mongo_move(reqId, req_reference_id, moved_info, masterCollection, formatted_doc)
                console.log("********* Master Collection " + masterCollection + "Mongo Move Compelted Completed  ***************** doc_id :", doc_id)
                await indexingIntoElastic(reqId, req_reference_id, moved_info, from_req_masterCollection, formatted_doc, local_master_data_collection_instance)
                console.log("********* Master Collection " + from_req_masterCollection + "Elastic Move Compelted Completed  ***************** doc_id :", doc_id)



                //                /*******    version START*************/
                //                formatted_doc["fp_id"] = req_fp_id;
                //                if ((moved_info["mongo"]["leads_with_url"] && moved_info["mongo"]["leads_with_url"][0]["mongo_moved"] && moved_info["elastic"]["projects"][0]["elastic_moved"]) || (moved_info["mongo"]["leads_without_url"] && moved_info["mongo"]["leads_without_url"][0]["mongo_moved"] && moved_info["elastic"]["business"] && moved_info["elastic"]["business"][0]["elastic_moved"])) {
                //                    console.log("*****************Master Versioning Started ***************")
                //                    var leades_versioned_doc = await mongo_version(version_info, req_fp_id, doc_id, formatted_doc, version_mongo_collections[from_req_masterCollection], req_reference_id, reqId)
                //                    console.log("********* Master Collection " + version_mongo_collections[from_req_masterCollection] + "Mongo Versioning Compelted Completed  ***************** doc_id :", doc_id)
                //
                //                    if (leades_versioned_doc && leades_versioned_doc["_id"]) {
                //                        await elastic_version(version_info, doc_id, leades_versioned_doc, from_req_masterCollection, req_reference_id, reqId, local_master_data_collection_instance)
                //                        console.log("********* Master Collection " + from_req_masterCollection + "Elastic Versioning Compelted Completed  ***************** leades_versioned_doc._id :", leades_versioned_doc["_id"])
                //                    } else {
                //                        dbLogger.setLogger(reqId, "ERROR", new Date(), "nod ocumnet found for this fp id :" + req_fp_id + " in " + masterCollection);
                //                        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), "nod ocumnet found for this fp id :" + req_fp_id + " in " + masterCollection);
                //                    }
                //
                //                  
                //
                //
                //                }
                //               /*******    version ENDS*************/

                if (update_collections && update_collections.length > 0) {

                    await moveSubCollections(req_fp_id, update_collections, req_reference_id, reqId, master_doc_version)
                    resolve({message: "process completed", error: null, moved_info: moved_info, "version_info": version_info})
                    var posts_collection = ["facebook_posts_data", "twitter_posts_data", 'google_posts_data']
                    console.log("MOVED_INFO_WITH_POSTS before")
                    await moveSubCollections(req_fp_id, posts_collection, req_reference_id, reqId, master_doc_version)
                    console.log("MOVED_INFO_WITH_POSTS after")
                    dbLogger.move_data_api_log_setLogger(reqId, "MOVED_INFO_WITH_POSTS", new Date(), moved_info);


                } else {
                    dbLogger.setLogger(reqId, "INFO", new Date(), " Process terminated because failed to move either elastic or mongo");
                    dbLogger.setLogger(req_reference_id, "INFO", new Date(), " Process terminated because failed to move either elastic or mongo");
                    resolve({message: "Process terminated because failed to move either elastic or mongo", error: null, moved_info: moved_info, "version_info": version_info})
                }
            } else {
                dbLogger.setLogger(reqId, "INFO", new Date(), "requested collection " + update_listing_info["leads_collection"] + "not exists ");
                dbLogger.setLogger(req_reference_id, "INFO", new Date(), "requested collection " + update_listing_info["leads_collection"] + "not exists ");
                resolve({message: "requested collection " + update_listing_info["leads_collection"] + "not exists ", error: null, moved_info: moved_info, "version_info": version_info})

            }

        } catch (Exception) {
            dbLogger.setLogger(reqId, "ERROR", new Date(), Exception);
            dbLogger.setLogger(req_reference_id, "ERROR", new Date(), Exception);
            resolve({message: "process terminated", error: Exception})
        }

    });
};
//}




/* moving sub collections info to live*/









