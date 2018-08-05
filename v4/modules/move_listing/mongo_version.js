var local_database_conn = require(__base).local_database;
var dbLogger = require(__dblogger);
var objcetId = require('mongodb').ObjectId
var mongo_elstic_collections_indexes = require("../../connections/indexes_and_mongo_collections.js");
 const version_database_name = mongo_elstic_collections_indexes.mongo_databases["versioning"]
var staging_database_name = mongo_elstic_collections_indexes.mongo_databases["staging"]

 module.exports=function(version_info,req_fp_id,doc_id,document, version_collection,req_reference_id,reqId) {
     console.log(" version_collection ",version_collection, "doc_id : ",doc_id )
    return new Promise(async function(resolve,reject){
         doc_id=objcetId(doc_id)
              var staging_database_db=local_database_conn.db(staging_database_name)
             var staging_collection=staging_database_db.collection(version_collection)
     try {
         
    if (document["_id"])
        delete document["_id"];
    var string_version;
    if(document["business"])
      string_version=(document["business"]["version"]);
  if(string_version===0 ||  string_version)
      string_version=string_version.toString();
    if(!string_version){
         version_info["mongo"][version_collection].push({ version: false,"collection":version_collection,"reason":"document don't have verion","doc_id":doc_id});
//        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), { version: false,"collection":version_collection,"reason":"document don't have verion","doc_id":doc_id});
          dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), { version: false,"collection":version_collection,"reason":"document don't have verion","doc_id":doc_id});
         staging_collection.update({"_id": {$in: [doc_id]}}, {$set:{"_log.mongo_version_moved":false,"mongo_version_moved_error":"document don't have verion"} })
                 resolve(null);
           return null;
    }
            var findQuery={"fp_id":req_fp_id,"business.version":document["business"]["version"]};
              var versionDb = local_database_conn.db("version_db");           
        var versionCollection = versionDb.collection(version_collection);
//           versionCollection.findAndModify({query:findQuery,update:{"1":"hai"},upsert:true},function(err,update){
           var versioned_doc=  await versionCollection.findAndModify(findQuery,[["_id", "asc"]],document,{upsert:true,new: true} )
           var versioning_id=versioned_doc.value._id
            version_info["mongo"][version_collection].push({ version: true,"doc_id":versioning_id,"collection":version_collection});
             staging_collection.update({"_id": {$in: [doc_id]}}, {$set:{"_log.mongo_version_moved":true,"dates.mongo_version_moved":new Date()} })

                 resolve(versioned_doc.value);
    }
    catch(exception){
        console.log("exception version "+exception)
        version_info["mongo"][version_collection].push({ moved: false,"reason":exception.message,"doc_id":doc_id});
//        dbLogger.setLogger(req_reference_id, "ERROR", new Date(), exception.message);
          dbLogger.move_data_api_log_setLogger(reqId, "ERROR", new Date(), exception.message);
         staging_collection.update({"_id": {$in: [doc_id]}}, {$set:{"_log.mongo_version_moved":false,"mongo_version_moved_error":exception.message} })
          resolve(null)
     }
    
        
    })
 
}