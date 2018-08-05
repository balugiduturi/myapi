global.__base = __filename;
global.__v4root = __dirname;
var fs = require('fs');
const log4js = require('log4js');
const EventEmitter = require('events');
const path = require('path');
const cluster = require('cluster');
const express = require('express');
var https = require('https');
var http = require('http');
var RateLimit = require('express-rate-limit');
const crypto = require('crypto');
const btoa = require('btoa');
const SMTPmailer = require('./modules/email_service/send_alert.js');


/*
 * ssl authentication
 * 
 */
var privateKey = fs.readFileSync('./bin/ssl/api.discover-prospects.com.key', 'utf8');
var certificate = fs.readFileSync('./bin/ssl/api.discover-prospects.com.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const api = express();
const pk_sk = {
    "d705cc6602fe1d255e24271b3e409cf2a9a3ec15": "f2a02af9e453e1521009fdc565cc198a",
    "d705cc6602fe1d255e24271b3e4057657659cf2a9a3ec15": "f2a02af9e453e1521009fdc565cc198assdfs"
};
var errorMessage = {status: 429, message: "Too many hits created from this IP, please try again after some time"};

var createAccountLimiter = new RateLimit({
    windowMs: 1 * 1 * 1000, // 1 seconds window
    delayAfter: 1, // begin slowing down responses after the first request
    max: 10, // start blocking after  if 10 requests per 1 second
    message: JSON.stringify(errorMessage)
});

process.setMaxListeners(0);




if (process.env.NODE_ENV === 'production') {
    process.env.port = 8086;
    process.env.hostname = "107.21.99.225:";
} else if (process.env.NODE_ENV === 'development') {
    process.env.port = 8086;
    process.env.hostname = "107.22.170.45";
} else if (process.env.NODE_ENV === 'staging') {
    process.env.port = 8086;
    process.env.hostname = "104.197.251.69";
} else {
    process.env.port = 8086;
    process.env.hostname = "104.197.251.69";
}


var localMongoConnectionisAlive = false;
var liveMongoConnectionisAlive = false;

const bodyParser = require('body-parser'); //Url content parsing
const md5 = require('md5'); //Encryptption
const MongoClient = require('mongodb').MongoClient;
const OAuth2Server = require('oauth2-server');
var objcetId = require('mongodb').ObjectId;
var localDbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";
//var DPConnUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";
var DPConnUrl = 'mongodb://dp_root:xyz1236tgbnhy7@107.21.99.225:27017/admin';




(async () => {
    log4js.loadAppender('file');
    log4js.addAppender(log4js.appenders.file(__dirname + '/logs/pattern-bugs.log'), 'patternbugs');
    var logger = log4js.getLogger('patternbugs');




    var options = {
        reconnectTries: 60, // 60 attempts
        reconnectInterval: 1000 //  time between two attempts  ---overall 60 secs
    }

    var local_database = await MongoClient.connect(localDbUrl, options);
    localMongoConnectionisAlive = true;

    var live_database = await MongoClient.connect(DPConnUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
    liveMongoConnectionisAlive = true;

    local_database.on('close', function () {
        localMongoConnectionisAlive = false
        SMTPmailer.sendEmail(`Mongo Connection Failed... ${new Date()}`,
                `localdatabase connection failed.. ${new Date()}, ProcessId : ${process.pid}`)

        setTimeout(async () => {
            if (!localMongoConnectionisAlive) {

                SMTPmailer.sendEmail(`Reconnection timed out Failed trying again... ${new Date()}`,
                        `localdatabase connection failed trying again ... ${new Date()}, ProcessId : ${process.pid}`)
                local_database = await MongoClient.connect(localDbUrl, options);
            }

        }, 70000)


    })

    live_database.on('close', function () {
        liveMongoConnectionisAlive = false
        SMTPmailer.sendEmail(`Mongo Connection Failed... ${new Date()} , ProcessId : ${process.pid}`,
                `Livedatabase connection failed.. ${new Date()}`)


        setTimeout(async () => {

            if (!liveMongoConnectionisAlive) {

                SMTPmailer.sendEmail(`Reconnection timed out Failed trying again... ${new Date()}`,
                        `Livedatabase connection failed trying again ... ${new Date()}, ProcessId : ${process.pid}`)
                live_database = await MongoClient.connect(DPConnUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});

            }
        }, 70000)



    })




    local_database.on('reconnect', function () {
        SMTPmailer.sendEmail(`Mongo ReConnected... ${new Date()}`,
                `localdatabase ReConnected.. ${new Date()}`),
                localMongoConnectionisAlive = true;
    })

    live_database.on('reconnect', function () {
        SMTPmailer.sendEmail(`Mongo ReConnected ... ${new Date()}`,
                `Livedatabase ReConnected .. ${new Date()}`),
                liveMongoConnectionisAlive = true;
    })



    var db_name = {
        live: "live_analysis_engine_db",
        local: "analysis_engine_db"
    };




    module.exports.db_name = db_name;
    module.exports.local_database = local_database;
    module.exports.live_database = live_database;
    module.exports.fileLogger = logger;
    module.exports.objcetId = objcetId;

    /*
     * importing DB logger after exporting  databases
     */
    var dbLogger = require('./DAO/logging_request');






    var autosuggest_router = require('./routes/autosuggest.routes.js');
    var listing_router = require('./routes/listing.routes.js');
    var master_language_router = require('./routes/master_language.routes.js');

    var responsive_device_list = require('./routes/responsive_device_list.routes.js');
    var listing_move_to_elastic_mongo = require('./routes/listing_move_to_elastic_mongo.routes.js');
    var add_listing_router = require('./routes/addlisting.routes.js');
    var search_posts = require('./routes/search_posts.routes.js');
    var master_elements = require('./routes/master_elements.routes.js');
    var domain_registrant_details = require('./routes/domain_registrant_details.routes.js');
    var api_logger = require('./routes/db_logger.routes.js');
    var categories_router = require('./routes/categories.routes.js');
    var website_search_router = require('./routes/website_search.routes.js');
    function getUniqueId() {

        var date = new Date();
        var components = [
            date.getYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        ];

        var id = components.join("");
        return id;
    }

    var reqTimeLogger = function (req, res, next) {


        //        /************* Signature Authentication Start *****************/
        //        var key = req.body.key ? req.body.key : "";
        //        var signature = req.body.signature ? req.body.signature : "";
        //        var data = req.body.data ? req.body.data : "";
        //        if (!key || !signature || !data) {
        //            res.send({status: 201, error: "Authentication keys are missing"});
        //            return;
        //        }
        //        var hmac = crypto.createHmac('sha384', pk_sk[key]).update(data).digest('hex');
        //        console.log(hmac);
        //        if (signature !== hmac) {
        //            res.send({status: 201, error: "Signature Invalid"});
        //            return;
        //        }
        //        req.body = JSON.parse(new Buffer(data, 'base64').toString('ascii'));
        //        /************* Signature Authentication End *****************/
        //        

        (async function () {
            let clientIP = "";
            req.id = md5(req.url + getUniqueId());
            if (req.ip)
                clientIP = req.ip;
            console.log("init-reqID=======", req.id);
            console.log("req-headers=====", req.headers);

            await dbLogger.logReqUrl(req.id, clientIP, req.originalUrl, new Date(), req.method);
            dbLogger.logHeaders(req.id, req.headers)
            dbLogger.setLogger(req.id, "REQ_TYPE", new Date(), ` type  ${typeof req.body}`);
            if (req.body) {
                var body = req.body;
                bdoy = JSON.stringify(body);
                await dbLogger.setLogger(req.id, "REQ_BODY", new Date(), btoa(bdoy));
            } else
                await dbLogger.setLogger(req.id, "REQ_BODY", new Date(), "Request Body Is Empty");

            next();

        })();

    };



    if (cluster.isMaster) {
        var numWorkers = require('os').cpus().length;
        for (var i = 0; i < numWorkers; i++) {
            cluster.fork(); //creating child process
        }
        cluster.on('exit', function (worker, code, signal) {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            cluster.fork();
        });
    } else {
        api.use(bodyParser.urlencoded({extended: true}));
        api.use(bodyParser.json());
        api.use(express.static('public'));

        api.oauth = new OAuth2Server({
            model: require('./OAuth/model.js'),
            grants: ['client_credentials'],
            debug: true,
            accessTokenLifetime: null
        });

        api.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            return next();
        });

        /**/
        api.use('/', function (req, res, next) {
            console.log("liveMongoConnectionisAlive ", liveMongoConnectionisAlive)
            console.log("localMongoConnectionisAlive ", localMongoConnectionisAlive)
            if (localMongoConnectionisAlive && liveMongoConnectionisAlive)
                next()
            else {
                res.send({
                    status: 500,
                    message: "Mongo Connection interrupted please try after some time"
                })
            }

        });

        api.all('/oauth/token', api.oauth.grant());

        api.use('/v4', api.oauth.authorise());
        api.use('/v4', api.oauth.errorHandler());
        api.use('/logger/', [api_logger]);


        api.use('/v4/autosuggest', createAccountLimiter, reqTimeLogger, [autosuggest_router]);
        api.use('/v4/listing', createAccountLimiter, reqTimeLogger, [listing_router]);
        api.use('/v4/master_languages', createAccountLimiter, reqTimeLogger, [master_language_router]);

        api.use('/v4/master_responsive_devices', createAccountLimiter, reqTimeLogger, [responsive_device_list]);
        api.use('/v4/move_listing', createAccountLimiter, reqTimeLogger, [listing_move_to_elastic_mongo]);
        api.use('/v4/addlisting', createAccountLimiter, reqTimeLogger, [add_listing_router]);


        api.use('/v4/addlisting', createAccountLimiter, reqTimeLogger, [add_listing_router]);
        api.use('/v4/search_posts', createAccountLimiter, reqTimeLogger, [search_posts]);
        api.use('/v4/master_elements', createAccountLimiter, reqTimeLogger, [master_elements]);
        api.use('/v4/domain', reqTimeLogger, [domain_registrant_details]);
        api.use('/v4/categories/', createAccountLimiter, reqTimeLogger, [categories_router]);
        api.use('/v4/prospects/', createAccountLimiter, reqTimeLogger, [website_search_router]);
        api.use('*', function (req, res) {
            res.send({status: 404, message: "The requested resource could not be found."});
        });


        var httpServer = http.createServer(api);
        var httpsServer = https.createServer(credentials, api);

        if (process.env.NODE_ENV === 'production') {


            const httpSecure_server = httpsServer.listen(process.env.port);//https://
            httpSecure_server.timeout = 0;
            module.exports = httpSecure_server;

            const http_server = httpServer.listen(8089);//http://
            http_server.timeout = 0;

        } else {

            const http_server = httpServer.listen(process.env.port);//http://
            http_server.timeout = 0;



        }



        console.log('Magic happens on port --', process.env.port);
        console.log('Process ' + process.pid + ' is listening to all incoming requests');




    }

})();






