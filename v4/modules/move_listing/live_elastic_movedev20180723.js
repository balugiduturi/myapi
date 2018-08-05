
const local_database_name = "analysis_engine_db"
var elasticsearch = require('elasticsearch');
const util = require('util');
const MongoClient = require('mongodb').MongoClient;
var dbLogger = require(__dblogger);
var objcetId = require('mongodb').ObjectId
var mongo_elstic_collections_indexes = require("../../connections/indexes_and_mongo_collections.js");
var elastic_indexes = mongo_elstic_collections_indexes.elastic_indexes;
var elastic_types = mongo_elstic_collections_indexes.elastic_types;

if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}



module.exports = function (reqId, req_reference_id, moved_info, type, document, mongo_collection_instance) {
    return new Promise(async function (resolve, reject) {

        var elasticConnParams = {
            index: elastic_indexes[type],
            type: elastic_types[type]


        };
        var mongoId = document["_id"];


        /* master elsatic insert*/
        try {

 
            if (document["_id"])
                delete document["_id"]
       
             var indexDoc = {
              index: elasticConnParams.index,
              type: elasticConnParams.type,
              id: mongoId.toString()
            };
           
           
             indexDoc["body"]=document;
           
              var elsatic_updated_obj = await  elasticInsert(indexDoc);
            if (elsatic_updated_obj && elsatic_updated_obj.err) {

                var obj = {
                    "_log.elastic_moved": false,
                    "_log.elastic_err_discription": elsatic_updated_obj.err
                }
                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_moved: false, "doc_id": mongoId, reason: elsatic_updated_obj.err, "type": elastic_types[type], "index": elastic_indexes[type]}

                var loggerObj = {elastic_moved: false, "doc_id": mongoId, reason: elsatic_updated_obj.err, "type": elastic_types[type], "index": elastic_indexes[type]}
                dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)

                moved_info["elastic"][elastic_types[type]].push(move_info_err_obj)




            } else if (elsatic_updated_obj && elsatic_updated_obj.res && elsatic_updated_obj.res.errors) {
                console.log(" i am in error cause : ", elsatic_updated_obj.res.items[0].index.error)
                console.log(" elsatic_updated_obj.res.items[0] ", elsatic_updated_obj.res.items[0])
                var failed_reason;
                if (elsatic_updated_obj.res.items[0].index.error && elsatic_updated_obj.res.items[0].index.error)
                    failed_reason = elsatic_updated_obj.res.items[0].index.error
                if (!failed_reason)
                    failed_reason = "elastic return error true but reason is empty"

                var obj = {
                    "_log.elastic_moved": false,
                    "_log.elastic_err_discription": failed_reason,
                };

                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_moved: false, "doc_id": mongoId, reason: failed_reason, "type": elastic_types[type], "index": elastic_indexes[type]}
                moved_info["elastic"][elastic_types[type]].push(move_info_err_obj)
                var loggerObj = {elastic_moved: false, "doc_id": mongoId, reason: failed_reason, "type": elastic_types[type], "index": elastic_indexes[type]}
                dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)

            } else if (elsatic_updated_obj && !elsatic_updated_obj.res.errors) {

                var obj = {
                    "_log.elastic_moved": true,
                    "_log.elastic_err_discription": null,
                    "dates.elastic_moved": new Date(),
                    "dates.dp_moved":new Date()
                };

                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_moved: true, "doc_id": mongoId}
                moved_info["elastic"][elastic_types[type]].push(move_info_err_obj)
                var loggerObj = {elastic_moved: true, "doc_id": mongoId, "type": elastic_types[type], "index": elastic_indexes[type]}

            }

            resolve();
        } catch (exception) {
            var obj = {
                "_log.elastic_moved": false,
                "_log.elastic_err_discription": exception.message,
            }

            mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
            var move_info_err_obj = {elastic_moved: false, "doc_id": mongoId, reason: exception}
            moved_info["elastic"][elastic_types[type]].push(move_info_err_obj)
            var loggerObj = {elastic_moved: false, "doc_id": mongoId, reason: exception, "type": elastic_types[type], "index": elastic_indexes[type]}
            dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)

            resolve();

        }


    })

}


////index into elastic
//
//function elasticbulkInsert(elasticDocsArry) {
//    return new Promise(function (resolve, reject) {
//        client.bulk({
//            body: elasticDocsArry
//        }, function (err, res) {
//            if (err)
//                resolve({"err": err})
//            else
//                resolve({"res": res})
//        });
//    })
//
//
//}

//index into elastic

function elasticInsert(indexDoc) {
    return new Promise(function (resolve, reject) {
        client.index(indexDoc, function (err, res) {
                    if (err){
                       resolve({"err": err})
                         
                    }
                         
                    else{
                  resolve({"res": res})
 
//      updateErrorDocs(errorsIds, sucessIds, collection);
                    }
                        
                });
    })


}