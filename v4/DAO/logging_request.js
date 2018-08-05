/* 
 * To trace each stop the request sent by the user
 * logging into db as schema @libPath: "../logs/log_scheam.js"
 * @author tulsi
 * 
 */
//var dbUrl = "mongodb://data_root:xyz1$3^nhy7@10.128.0.3:27017/admin";

var local_database_conn = require(__base).local_database;
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_child_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["api_log_db"]);


global.__dblogger = __filename;

var logReqUrl = function (localId, clientIP, url, reqTime, reqType) {

    return new Promise((resolve, reject) => {
        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update({reqId: localId}, {$set: {reqId: localId, clientIP: clientIP, requestType: reqType, requestParams: {url: url}, requestTime: reqTime}}, {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve("updated req Creation");
            } else {
                reject(updateFailed);
            }
        });


    });
};


var logFpId = function (localId, fpId, createdAt) {

    return new Promise((resolve, reject) => {
        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update(
                {reqId: localId},
                {
                    $set:
                            {
                                fp_id: fpId,
                                "createdAt": createdAt,
                                requestTime: reqTime
                            }
                },
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve("updated req Creation");
            } else {
                reject(updateFailed);
            }
        });


    });
};


var logHeaders = function (localId, headers, createdAt) {

    return new Promise((resolve, reject) => {
        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update(
                {reqId: localId},
                {
                    $set:
                            {
                                headers: headers,
                                "createdAt": createdAt
                            }
                },
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve("updated req Creation");
            } else {
                reject(updateFailed);
            }
        });


    });
};

var logResponse = function (localId, body) {

    return new Promise((resolve, reject) => {
        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update(
                {reqId: localId},
                {
                    $set:
                            {
                                response: body
                            }
                },
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve("updated req Creation");
            } else {
                reject(updateFailed);
            }
        });


    });
};

var setLogger = function (reqId, type, createdAt, message) {

    return new Promise((resolve, reject) => {

        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update({reqId: reqId},
                {$push: {logs: {"type": type, "message": message, "createdAt": createdAt}}},
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve(updated.result.nModified);
            } else {
                reject(updateFailed);
            }
        });
    });



};
var logRespTime = function (reqId, responseTime) {
    return new Promise(function (resolve, reject) {
        var collection = local_child_db.collection('central_api_logger18Jan18');
        collection.update({"reqId": reqId}, {$set: {responseTime: responseTime}}, {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve(updated.result.nModified);
            } else {
                reject(updateFailed);
            }
        });
    });
};
var move_data_api_log_logReqUrl = function (localId, clientIP, url, reqTime, reqType) {

    return new Promise((resolve, reject) => {
        var collection = local_child_db.collection('move_data_api_log');
        collection.update({reqId: localId}, {$set: {reqId: localId, clientIP: clientIP, requestType: reqType, requestParams: {url: url}, requestTime: reqTime}}, {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve("updated req Creation");
            } else {
                reject(updateFailed);
            }
        });


    });
};
var move_data_api_log_setLogger = function (reqId, type, createdAt, message) {
    return new Promise((resolve, reject) => {

        var collection = local_child_db.collection('move_data_api_log');
        collection.update({reqId: reqId},
                {$push: {logs: {"type": type, "message": message, "createdAt": createdAt}}},
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve(updated.result.nModified);
            } else {
                reject(updateFailed);
            }
        });
    });



};
var push_req_ids_by_req_reference_id = function (reqId, req_reference_Id, fp_id) {
    var pushObject = {reqId: reqId, "fp_id": fp_id}
    return new Promise((resolve, reject) => {

        var collection = local_child_db.collection('move_data_api_log');
        collection.update({req_reference_Id: req_reference_Id},
                {$push: {"reqId_fp_id": pushObject}},
                {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve(updated.result.nModified);
            } else {
                reject(updateFailed);
            }
        });
    });



};
var move_data_api_log_logRespTime = function (reqId, responseTime) {
    return new Promise(function (resolve, reject) {
        var collection = local_child_db.collection('move_data_api_log');
        collection.update({"reqId": reqId}, {$set: {responseTime: responseTime}}, {upsert: true}, (updateFailed, updated) => {
            if (!updateFailed) {
                resolve(updated.result.nModified);
            } else {
                reject(updateFailed);
            }
        });
    });
};

module.exports.logReqUrl = logReqUrl;
module.exports.setLogger = setLogger;
module.exports.logRespTime = logRespTime;
module.exports.move_data_api_log_logRespTime = move_data_api_log_logRespTime;
module.exports.move_data_api_log_setLogger = move_data_api_log_setLogger;
module.exports.push_req_ids_by_req_reference_id = push_req_ids_by_req_reference_id;
module.exports.move_data_api_log_logReqUrl = move_data_api_log_logReqUrl;
module.exports.logHeaders = logHeaders;
module.exports.logResponse = logResponse;

























//var logReqUrl = function(localId, url, reqTime, reqType) {
//    
//   MongoClient.connect(dbUrl,{connectTimeoutMS: 90000, socketTimeoutMS: 90000},function(dbError,database){
//      if(!dbError){
//          console.log("connected to db for logging");
//          var db
////          db = database.db('data_us');
//          var collection = db.collection('technology_finder_api_logger24Apr17');
//          
//          collection.insert({reqId:localId,requestType:reqType,requestParams:{url:url},requestTime:reqTime},function(insertErr,inserted){
//              if(insertErr){
//                  console.log("Error at insertion logger");
//              } else {
//                  console.log("inserted");
//              }
//          });
//      } else {
//          console.log("Errror at dbLogging");
//          console.log(dbError);
//      }
//   });
//   
//};
