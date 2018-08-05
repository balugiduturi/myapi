


const local_database_name = "analysis_engine_db";

if (process.env.NODE_ENV === 'production') {
  var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
  var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}
const util = require('util');
const MongoClient = require('mongodb').MongoClient;
var dbLogger = require(__dblogger);


module.exports = function(reqId, req_reference_id, moved_info, type, document, mongo_collection_instance) {

  return new Promise(async function(resolve, reject) {
    var elasticConnParams = {
      index: "analysis_engine_db",
      type: type
     
    };
    var mongoId = document["_id"]

      /* master elsatic insert*/
    try {
     var elasticDocsArry = [];
      if (document["_id"])
        delete document["_id"]
      var dumyIndex = {
        _index: elasticConnParams.index,
        _type: elasticConnParams.type,
        _id: mongoId.toString()
      };
      var indexObj = {
        index: dumyIndex
      };
      elasticDocsArry.push(indexObj);
      elasticDocsArry.push(document);
      var elsatic_updated_obj = await elasticbulkInsert(elasticDocsArry);
      if (elsatic_updated_obj && elsatic_updated_obj.err) {
        var obj = {
          "_log.elastic_moved": false,
          "_log.elastic_err_discription": elsatic_updated_obj.err
        }
        mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
        var move_info_err_obj = {elastic_moved: false,"doc_id": mongoId,reason: elsatic_updated_obj.err}
        moved_info["elastic"][type].push(move_info_err_obj)
        var loggerObj = {elastic_moved: false,"doc_id": mongoId,reason: elsatic_updated_obj.err,"type": type}
        dbLogger.setLogger(reqId, "ERROR", new Date(), loggerObj)
        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
        //                moved_info["elastic"].push({"type":type,moved:false,reason:elsatic_updated_obj.err})

      } else if (elsatic_updated_obj && elsatic_updated_obj.res && elsatic_updated_obj.res.errors) {
        if (elsatic_updated_obj.res.items[0].index.error)
          var failed_reason = elsatic_updated_obj.res.items[0].index.error.reason
        if (elsatic_updated_obj.res.items[0].index.error.caused_by)
          failed_reason = failed_reason + ", " + elsatic_updated_obj.res.items[0].index.error.caused_by
        var obj = {
          "_log.elastic_moved": false,
          "_log.elastic_err_discription": failed_reason,
        }

        mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
        var move_info_err_obj = {elastic_moved: false,"doc_id": mongoId,reason: failed_reason,"type": type,"index": type}
        moved_info["elastic"][type].push(move_info_err_obj)
        var loggerObj = {elastic_moved: false,"doc_id": mongoId,reason: failed_reason,"type": type}
        dbLogger.setLogger(reqId, "ERROR", new Date(), loggerObj)
        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
        //                 moved_info["elastic"].push({"type":type,moved:false,reason:elsatic_updated_obj.res.items[0].index.error})

      } else if (elsatic_updated_obj && !elsatic_updated_obj.res.errors) {
        var obj = {"_log.elastic_moved": true,"_log.elastic_err_discription": null,"dates.elastic_moved": new Date()}

        mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
        var move_info_err_obj = {elastic_moved: true,"doc_id": mongoId}
        moved_info["elastic"][type].push(move_info_err_obj)
        var loggerObj = {elastic_moved: true,"doc_id": mongoId,"type": type}
        //                dbLogger.setLogger(reqId, "INFO", new Date(), loggerObj)
        //                    dbLogger.setLogger(req_reference_id, "INFO", new Date(), loggerObj)
        //                moved_info["elastic"].push({"type":type,moved:true})
      }
    
      resolve()
    } catch (exception) {
      var obj = {"_log.elastic_moved": false,"_log.elastic_err_discription": exception,}

      mongo_collection_instance.update({"_id": {$in: [mongoId]}}, {$set: obj})
      var move_info_err_obj = {elastic_moved: false,"doc_id": mongoId,reason: exception}
      moved_info["elastic"][type].push(move_info_err_obj)
      var loggerObj = {elastic_moved: false,"doc_id": mongoId,reason: exception,"type": type}
      dbLogger.setLogger(reqId, "ERROR", new Date(), loggerObj)
      dbLogger.setLogger(req_reference_id, "ERROR", new Date(), loggerObj)
      //                  moved_info["elastic"].push({"type":type,moved:false,reason:exception})
      resolve()
    }
  })
}

//index into elastic

function elasticbulkInsert(elasticDocsArry) {
  return new Promise(function(resolve, reject) {
    client.bulk({
      body: elasticDocsArry
    }, function(err, res) {
      if (err)
        resolve({
          "err": err
        })
      else
        resolve({
          "res": res
        })
    });
  })


}
