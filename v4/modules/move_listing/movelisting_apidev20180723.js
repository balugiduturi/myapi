/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var logger = require(__base);
var dbLogger = require(__dblogger);
var move_listing = require("./index.js");
var update_score = require('./update_score.js');
var util = require('util');
const SMTPmailer = require(`${__v4root}/modules/email_service/send_alert.js`);


var send_response_to_prodcut_callback = require("./send_response_to_prodcut_callback.js");







module.exports = function (req, res) {

    (async function () {
        try {
            await dbLogger.move_data_api_log_logReqUrl(req.id, "", req.originalUrl, new Date(), req.method);
            console.log("********** Received Request From Analysis Engine *************")
            console.log("*********************************************")
console.log("*********************************************")
            console.log("********** Request Received  At *************",new Date())

            if (!req.body) {
                //                dbLogger.setLogger(bodyObj["req_reference_id"], "INFO", new Date(), "body missing manditory info " + bodyObj);
                res.send({ status: 412, error: "Request Must Contain Body" });
                console.log("********** Request Must Contain Body ************* ", req.body)
                return;
            }
            dbLogger.setLogger(req.id, "MOVE-LISTING-BODY", new Date(), req.body);
            if (req.body && (!req.body.req_reference_id)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed req_reference_id ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({ status: 412, error: "body missing manditory filed req_reference_id" });

                return;
            }
            dbLogger.push_req_ids_by_req_reference_id(req.id, req.body.req_reference_id, req.body.fp_id)
            if (req.body && (!req.body.fp_id)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory field fp_id ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({ status: 412, error: "body missing manditory field fp_id" });
                return;
            }


            if (req.body && (!req.body.product_callback_url)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed product_callback_url ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({ status: 412, error: "body missing manditory filed product_callback_url" });
                return;
            }
            if (req.body && (!req.body.leads_collection)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed leads_collection ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({ status: 412, error: "body missing manditory filed leads_collection" });
                return;
            }

            var bodyObj = req.body;
            dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "request Recieved from analysis engine to move " + bodyObj["fp_id"] + " to live ,move listing req id :" + req.id);
            dbLogger.setLogger(req.id, "INFO", new Date(), "request Recieved from analysis engine to move " + bodyObj["fp_id"] + " to live ,move listing req id :" + req.id);

            var localreq = req;
            var parentObjRefId = bodyObj["req_reference_id"];

            res.send({ status: 200, "message": "started data moving" })

            var product_request_body = {};
            try {
                bodyObj["collections"] = ["yext_info", "brand_mentions_data", "adwords_data", 'bing_adwords_data', 'display_adbeat_data']
                console.log("********** Started Moving Data From Staging To Live And Versioning*************")


                var buzz_score = {
                    status: false,
                    score_changed: "NO",
                    error: null
                }
                try {
                    let result = "";
                    result = await update_score(localreq.id, bodyObj['fp_id'], bodyObj['leads_collection']);
                    if (result === true) {
                        buzz_score['status'] = true;
                        buzz_score['score_changed'] = "YES";
                    } else {
                        buzz_score['status'] = true;
                        buzz_score['score_changed'] = "NO";
                    }
                    console.log("BUZZ RUNS SUCESSFULLY.................................");
                } catch (E) {
                    console.log("BUZZ__SCORE ERRROR..................................");
                    buzz_score['status'] = true;
                    buzz_score['error'] = E;
                    console.log(E);
                }

                var move_info = await move_listing(localreq.id, bodyObj["req_reference_id"], bodyObj)
                move_info['buzz_score'] = buzz_score;




                dbLogger.move_data_api_log_setLogger(localreq.id, "MOVED_INFO", new Date(), move_info);


                if (move_info && !move_info["error"]) {
                    try {


                        move_info["reference_request_id"] = bodyObj["req_reference_id"]
                        console.log("********** Completed Moving Data From Staging To Live And Versioning************* ")

                        var signals_info = {
                            signals: "",
                            custom_args: ""

                        };

                        if (bodyObj["request_info"]) {
                            if (bodyObj["request_info"]["signals"]) {
                                signals_info.signals = bodyObj["request_info"]["signals"];
                            }
                            if (bodyObj["request_info"]["custom_args"]) {
                                signals_info.custom_args = bodyObj["request_info"]["custom_args"];
                            }
                        }


                        product_request_body["status"] = 200;
                        product_request_body["fp_id"] = bodyObj["fp_id"];
                        product_request_body["signals"] = signals_info.signals;
                        product_request_body["custom_args"] = signals_info.custom_args;






                        // mongo status starts
                        if (move_info.moved_info["mongo"]) {
                            var mongo = "";
                            if (move_info.moved_info["mongo"]["leads_with_url"]) {
                                mongo = move_info.moved_info["mongo"]["leads_with_url"];

                            } else if (move_info.moved_info["mongo"]["leads_without_url"]) {

                                mongo = move_info.moved_info["mongo"]["leads_without_url"];
                            }
                            // let mongo_status = mongo.find(function (value) {
                            //     return value["mongo_moved"];
                            // });

                            let mongo_status = mongo[0];
                            //-------------mongo status ends---------------



                            // elastic status starts
                            if (move_info.moved_info["elastic"]) {
                                var elastic = "";
                                if (move_info.moved_info["elastic"]["business"]) {
                                    elastic = move_info.moved_info["elastic"]["business"];

                                } else if (move_info.moved_info["elastic"]["projects"]) {
                                    elastic = move_info.moved_info["elastic"]["projects"];
                                }


                                // let elastic_status = elastic.find(function (value) {
                                //     return value["elastic_moved"];
                                // });

                                let elastic_status = elastic[0];
                                //-------------elastic status ends---------------



                                if (!mongo_status.mongo_moved || !elastic_status.elastic_moved) {
                                    product_request_body["status"] = 500;
                                    product_request_body['code'] = 1;
                                    product_request_body["reason"] = {
                                        elastic_status: elastic_status,
                                        mongo_status: mongo_status
                                    };



                                }

                            } else {
                                product_request_body["status"] = 500;
                                product_request_body['code'] = 2;
                                product_request_body["reason"] = {
                                    reason: `move_info.moved_info["elastic"] is not avaialable`
                                };
                            }
                        } else {
                            product_request_body["status"] = 500;
                            product_request_body['code'] = 3;
                            product_request_body["reason"] = {
                                reason: `move_info.moved_info["mongo"] is not avaialable`
                            };
                        }



                    } catch (E) {
                        product_request_body["status"] = 500;
                        product_request_body['code'] = 4;
                        product_request_body["reason"] = {
                            moveException: E.message,
                            move_info: move_info
                        };
                        dbLogger.setLogger(localreq.id, "MOVE_ERROR", new Date(), E);
                    }
                } else {
                    console.log("********** Moving Terminated************* ")
                    dbLogger.move_data_api_log_setLogger(localreq.id, "ERROR", new Date(), move_info);
                    product_request_body["status"] = 500;
                    product_request_body['code'] = 5;
                    product_request_body["reason"] = {
                        moveException: move_info
                    };

                }



                if (product_request_body["status"] === 500) {

                    SMTPmailer.sendEmail(`Listing generation failed ..${parentObjRefId} --${localreq.id}--  ${new Date()}`,
                            `  from ${process.env.NODE_ENV} ..... ${new Date()} 
                          ${util.inspect(product_request_body, false, null)}
                        `);

                }

console.log("*********************************************")
console.log("*********************************************")
            console.log("**********Success Move Product Hit At *************",new Date())

                let response = await send_response_to_prodcut_callback(product_request_body,
                        localreq.body.product_callback_url, localreq.body.req_reference_id);
            console.log("**********Success Move AfterProduct Hit At *************",new Date())

                dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-RESPONSE", new Date(), response);
                dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());


            } catch (moveException) {
                try {
                    console.log("Exception while moving ", moveException.message)
                    dbLogger.move_data_api_log_setLogger(localreq.id, "ERROR", new Date(), moveException.message);

                    product_request_body["status"] = 500;
                    product_request_body['code'] = 6;
                    product_request_body["reason"] = {
                        "moveException": moveException.message
                    };

                    SMTPmailer.sendEmail(`Listing generation failed ..  ${parentObjRefId} --${localreq.id}----${new Date()}`,
                            `  from ${process.env.NODE_ENV} ..... ${new Date()} 
                  ${util.inspect(product_request_body, false, null)}
                  
                `);


console.log("*********************************************")
console.log("*********************************************")
  console.log("********** Move Exception Product Hit At *************",new Date())
                    let response = await send_response_to_prodcut_callback(product_request_body, localreq.body.product_callback_url, localreq.body.req_reference_id);
                                console.log("**********  Move Exception AfterProduct Hit At *************",new Date())

                    dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-RESPONSE", new Date(), response);
                    dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());
                } catch (E) {
                    console.log(E);
                    dbLogger.move_data_api_log_setLogger(localreq.id, "ERROR", new Date(), moveException.message);
                }
            }




        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            dbLogger.move_data_api_log_logRespTime(req.id, new Date());
            dbLogger.move_data_api_log_setLogger(req.id, "ERROR", new Date(), E);
            res.send({
                status: 500, error: E.message
            });
            return;

        }
    })();
};

function updatestatus() {
    return new Promise(function (resolve, reject) {

    })
}