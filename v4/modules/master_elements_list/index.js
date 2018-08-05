 var dbLogger = require(__dblogger);
var live_database_conn = require(__base).live_database
var db_name = require(__base).db_name;
module.exports = function (req, res) {

    try {
        var master_lang_database = live_database_conn.db(db_name.live);
        var master_lang_collection = master_lang_database.collection("master_keys_document");
        master_lang_collection.find({"element_status":"Active"},{"element_name":1,"element_key":1,"basic_signals":1,"website_dependent":1,"data_type":1,"_id":0}).toArray(function (err, languageArray) {

            if (err) {
               
                dbLogger.setLogger(req.id, "ERROR", new Date(), err);
                    dbLogger.logRespTime(req.id, new Date());
                res.send({"error": {"status": 500, "message": "Internal Server Error"}})
            } else {
                     dbLogger.logRespTime(req.id, new Date());
                res.send({elements: languageArray, "meta": {status: 200, "message": "Success","count":languageArray.length}})
//                 console.log("language_array ",languageArray)
            }


        });

//    ogger.myEmitter.emit(`responseTime${req.id}`, new Date());
    } catch (execption) {
         dbLogger.setLogger(req.id, "ERROR", new Date(), execption);
                    dbLogger.logRespTime(req.id, new Date());
        res.send({"error": {"status": 500, "message": "Internal Server Error"}})

    }

};

