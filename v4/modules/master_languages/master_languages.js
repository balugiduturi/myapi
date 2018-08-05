var dbLogger = require(__dblogger);
var db_name = require(__base).db_name;
var live_database_conn = require(__base).live_database;


module.exports = function (req, res) {

    try {
        var master_lang_database = live_database_conn.db(db_name.live);
        var master_lang_collection = master_lang_database.collection("master_language");
        master_lang_collection.find({}, {"language_name": 1, "language_code": 1, "_id": 0}).toArray(function (err, languageArray) {

            if (err) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), err);
                dbLogger.logRespTime(req.id, new Date());

                res.send({"error": {"status": 500, "message": "Internal Server Error"}})
            } else {
                dbLogger.logRespTime(req.id, new Date());
                res.send({data: languageArray, "meta": {status: 200, "message": "Success"}})
//                 console.log("language_array ",languageArray)
            }


        });

//    ogger.myEmitter.emit(`responseTime${req.id}`, new Date());
    } catch (execption) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), err);
        dbLogger.logRespTime(req.id, new Date());
        res.send({"error": {"status": 500, "message": "Internal Server Error"}})

    }

};

