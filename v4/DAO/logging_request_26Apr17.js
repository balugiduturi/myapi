/* 
 * To trace each stop the request sent by the user
 * logging into db as schema @libPath: "../logs/log_scheam.js"
 * @author tulsi
 * 
 */
const MongoClient = require('mongodb').MongoClient;
var dbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";

var logReqUrl = function (localId, url, reqTime, reqType, cb) {
    var MongoConnection = new Promise(function (resolve, reject) {
        MongoClient.connect(dbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000}, (err, res) => {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });

    MongoConnection.catch(dbError => {
        console.log("dbError in logReqUrl");
        console.log(dbError);
    });
    MongoConnection.then(database => {
        var insertPromise = new Promise((resolve, reject) => {
            var db = database.db('data_us');
            var db;
            var collection = db.collection('technology_finder_api_logger24Apr17');
            console.log("in logReqURl");
            collection.findOne({reqId: localId}, (err, doc) => {
                if (!err) {

                    if (doc !== null) {
                        collection.update({reqId: localId}, {requestType: reqType, requestParams: {url: url}, requestTime: reqTime}, (updateFailed, updated) => {
                            if (!updateFailed) {
                                db.close();
                                resolve("updated req Crettion");
                            } else {
                                db.close();
                                reject(updateFailed);
                            }
                        });
                    } else {
                        collection.insert({reqId: localId, requestType: reqType, requestParams: {url: url}, requestTime: reqTime}, function (error, result) {
                            if (!error) {
                                db.close();
                                resolve("inserted");
                            } else {
                                db.close();
                                reject(error);
                            }
                        });
                    }
                } else {
                    db.close();
                    reject(err);
                }
            });

        });
        insertPromise.then((res) => {
            console.log("res ", res);
            cb(null, "inserted");
        });
        insertPromise.catch((err) => {
            console.log("errr====", err);
            cb(err);
        });


    });

};
var setLogger = function (reqId, type, createdAt, message) {


    var MongoConnection = new Promise(function (resolve, reject) {
        MongoClient.connect(dbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000}, (err, res) => {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });
    MongoConnection.catch(dbError => {
        console.log("dbError in logReqUrl");
        console.log(dbError);
    });
    MongoConnection.then((database) => {
        var updateLogger = new Promise((resolve, reject) => {
            var db = database.db('data_us');
            var db;
            var collection = db.collection('technology_finder_api_logger24Apr17');
            collection.findOne({"reqId": reqId}, (err, doc) => {

                if (!err) {
                    if (doc !== null) {
                        collection.update({reqId: reqId}, {$push: {logs: {"type": type, "message": message, "createdAt": createdAt}}}, (updateFailed, updated) => {
                            if (!updateFailed) {
                                db.close();
                                resolve(updated.result.nModified);
                            } else {
                                db.close();
                                reject(updateFailed);
                            }
                        });
                    } else {
                        collection.insert({"reqId": reqId, logs: {"type": type, "message": message, "createdAt": createdAt}}, (failed, inserted) => {
                            if (!failed) {
                                db.close();
                                resolve("inserted at log -error");
                            } else {
                                db.close();
                                reject(failed);
                            }
                        });
                    }
                } else {
                    db.close();
                    reject(err);
                }
            });


        });
        updateLogger.then((res) => {
            console.log("updateLog");
            console.log(res);
        });
        updateLogger.catch((err) => {
            console.log(err);
        });
    });

};
var logRespTime = function (reqId,reqTime,responseTime) {
    
    var MongoConnection = new Promise(function (resolve, reject) {
        MongoClient.connect(dbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000}, (err, res) => {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });
    MongoConnection.catch(dbError => {
        console.log("dbError in logReqUrl");
        console.log(dbError);
    });
    MongoConnection.then((database) => {
        let logRespTime = new Promise(function (resolve, reject) {
            var db = database.db('data_us');
            var db;
            var collection = db.collection('technology_finder_api_logger24Apr17');
            console.log("reqId-------",reqId);
            collection.update({"reqId": reqId},{$set:{responseTime:responseTime,totalTime:(responseTime-reqTime)}}, (updateFailed,updated) => {
             if(!updateFailed){
                 db.close();
                 resolve(updated.result.nModified);
             } else {
                 db.close();
                 reject(updateFailed);
             }
            });
        });
        logRespTime.then((res)=>{
            console.log("logResp");
            console.log(res);
        });
        logRespTime.catch((err)=>{
           console.log(err);
        });
    });
};
module.exports.logReqUrl = logReqUrl;
module.exports.setLogger = setLogger;
module.exports.logRespTime = logRespTime;

























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
