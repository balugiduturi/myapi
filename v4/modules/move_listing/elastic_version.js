 var elasticsearch = require('elasticsearch');
const util = require('util');
 var dbLogger = require(__dblogger);
var mongo_elstic_collections_indexes = require("../../connections/indexes_and_mongo_collections.js");
var version_elastic_indexes=mongo_elstic_collections_indexes.version_elastic_indexes
var version_elastic_types=mongo_elstic_collections_indexes.version_elastic_types
var elasticClientInstance = null;


if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}



 module.exports = function (version_info,doc_mongo_id,document,type,req_reference_id,reqId,mongo_collection_instance) {
      return new Promise(async function (resolve, reject) {
        var elasticConnParams = {
            index: version_elastic_indexes[type],
            type: version_elastic_types[type]
        };
        var  mongoId= doc_mongo_id;
        var versioning_id=document["_id"];
          var string_version;
     if(document["business"])
      string_version=(document["business"]["version"]);
  if(string_version===0 ||  string_version)
      string_version=string_version.toString();
    if(!string_version){
        version_info["elastic"][version_elastic_types[type]].push({ version: false,"type":version_elastic_types[type],"index":version_elastic_indexes[type],"reason":"document don't have verion","doc_id":doc_mongo_id});
//        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), { version: false,"type":version_elastic_types[type],"index":version_elastic_indexes[type],"reason":"document don't have verion","doc_id":doc_mongo_id});
          dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), { version: false,"type":version_elastic_types[type],"index":version_elastic_indexes[type],"reason":"document don't have verion","doc_id":doc_mongo_id});
         mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set:{"_log.elastic_version_moved":false,"elastic_version_err_discription":"document don't have verion"} })
         resolve();
           return null;
    }
         try {

            var elasticDocsArry = [];

            if (document["_id"])
                delete document["_id"]
            var dumyIndex = {
                _index: elasticConnParams.index,
                _type: elasticConnParams.type,
                _id: versioning_id.toString()
            };
            var indexObj = {index: dumyIndex};

            elasticDocsArry.push(indexObj);
            elasticDocsArry.push(document);
            var elsatic_updated_obj = await  elasticbulkInsert(elasticDocsArry);
            if (elsatic_updated_obj && elsatic_updated_obj.err) {
                var obj = {
                    "_log.elastic_version_moved": false,
                    "_log.elastic_version_err_discription": elsatic_updated_obj.err
                }
                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_version_moved: false, "doc_id": versioning_id, reason: elsatic_updated_obj.err,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
                version_info["elastic"][version_elastic_types[type]].push(move_info_err_obj)
                var loggerObj={elastic_version_moved: false, "doc_id": versioning_id, reason: elsatic_updated_obj.err,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
                dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)
//                      dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
 
            } else if (elsatic_updated_obj && elsatic_updated_obj.res && elsatic_updated_obj.res.errors) {
     var failed_reason;
                if(elsatic_updated_obj.res.items[0].index.error && elsatic_updated_obj.res.items[0].index.error.reason)
                  failed_reason=elsatic_updated_obj.res.items[0].index.error
//                  failed_reason=elsatic_updated_obj.res.items[0].index.error.reason 
//                if(!failed_reason && elsatic_updated_obj.res.items[0].index.error.caused_by)
//                      failed_reason=elsatic_updated_obj.res.items[0].index.error.caused_by   
      if(!failed_reason)
                  failed_reason="elastic return error true but reason is empty"
                var obj = {
                    "_log.elastic_version_moved": false,
                    "_log.elastic_version_err_discription": failed_reason,
                }
 
                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_version_moved: false, "doc_id": versioning_id, reason: failed_reason,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
                version_info["elastic"][version_elastic_types[type]].push(move_info_err_obj)
                  var loggerObj={elastic_version_moved: false, "doc_id": versioning_id, reason:failed_reason,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
                dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)
//                    dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
 
            } else if (elsatic_updated_obj && !elsatic_updated_obj.res.errors) {


                var obj = {
                    "_log.elastic_version_moved": true,
                    "_log.elastic_version_err_discription": null,
                    "dates.elastic_version_moved": new Date()
                }

                mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
                var move_info_err_obj = {elastic_version_moved: true, "doc_id": versioning_id,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
                version_info["elastic"][version_elastic_types[type]].push(move_info_err_obj)
                  var loggerObj={elastic_version_moved: true, "doc_id": versioning_id,"type":version_elastic_types[type],"index":version_elastic_indexes[type]}
             }
             resolve()
        } catch (exception) {
            var obj = {
                "_log.elastic_version_moved": false,
                "_log.elastic_version_err_discription": exception,
            }

            mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
            var move_info_err_obj = {elastic_version_moved: false, "doc_id": versioning_id, reason: exception}
            version_info["elastic"][version_elastic_types[type]].push(move_info_err_obj)
             var loggerObj={elastic_version_moved: false, "doc_id": versioning_id, reason: exception,"type":type}
            dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), loggerObj)
//                      dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
             resolve()

        }


    })

}

//index into elastic

function elasticbulkInsert(elasticDocsArry) {
    return new Promise(function (resolve, reject) {
        client.bulk({
            body: elasticDocsArry
        }, function (err, res) {
            if (err)
                resolve({"err": err})
            else
                resolve({"res": res})
        });
    })


}