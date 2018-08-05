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
var fetchSignals = require("./services/signals_info_mongo_service.js");
var events = require('events').EventEmitter;

var send_response_to_prodcut_callback = require("./send_response_to_prodcut_callback.js");







module.exports = function (req, res) {

    (async function () {
        try {

            await dbLogger.move_data_api_log_logReqUrl(req.id, "", req.originalUrl, new Date(), req.method);
            if (!req.body) {
                res.send({status: 412, error: "Request Must Contain Body"});
                return;
            }
            dbLogger.move_data_api_log_setLogger(req.id, "MOVE-LISTING-REQ-BODY", new Date(), req.body);
            if (req.body && (!req.body.req_reference_id)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed req_reference_id ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({status: 412, error: "body missing manditory filed req_reference_id"});

                return;
            }
            dbLogger.push_req_ids_by_req_reference_id(req.id, req.body.req_reference_id, req.body.fp_id)
            if (req.body && (!req.body.fp_id)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory field fp_id ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({status: 412, error: "body missing manditory field fp_id"});
                return;
            }


            if (req.body && (!req.body.product_callback_url)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed product_callback_url ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({status: 412, error: "body missing manditory filed product_callback_url"});
                return;
            }
            if (req.body && (!req.body.leads_collection)) {
                dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "body missing manditory filed leads_collection ");
                dbLogger.move_data_api_log_logRespTime(req.id, new Date());
                res.send({status: 412, error: "body missing manditory filed leads_collection"});
                return;
            }

            var bodyObj = req.body;
            dbLogger.move_data_api_log_setLogger(req.id, "INFO", new Date(), "request Recieved from analysis engine to move " + bodyObj["fp_id"] + " to live ,move listing req id :" + req.id);
            dbLogger.setLogger(req.id, "INFO", new Date(), "request Recieved from analysis engine to move " + bodyObj["fp_id"] + " to live ,move listing req id :" + req.id);

            var localreq = req;
            var parentObjRefId = bodyObj["req_reference_id"];

            res.send({status: 200, "message": "started data moving"});

            var product_request_body = {};
            try {
                bodyObj["collections"] = ["yext_info", "adwords_data", 'bing_adwords_data', 'display_adbeat_data'];

                var buzz_score = {
                    status: false,
                    score_changed: "NO",
                    error: null
                };
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
                } catch (E) {
                    buzz_score['status'] = true;
                    buzz_score['error'] = E;
                    console.log(E);
                }

                /*
                 * 
                 * status:
                 * 1 --> custom move 
                 * 2 --> default move
                 * 3 --> background move
                 * Note: Donot changes these codes
                 */
                var move_list_emitter = new events.EventEmitter();
                console.log("SLEEEEP for---5500");
                setTimeout(async () => {

                    if (!move_info) {
                        move_list_emitter.emit("move_listing_process", 1);
                    }

                }, 5500);
                var move_info = "";
                var custom_move = "";
                move_info = await move_listing(localreq.id, bodyObj["req_reference_id"], bodyObj);
                if (!custom_move) {
                    move_list_emitter.emit("move_listing_process", 2);
                } else {
                    move_list_emitter.emit("move_listing_process", 3);
                }


                move_list_emitter.on("move_listing_process", async (status) => {
                    move_info['buzz_score'] = buzz_score;

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
                    product_request_body["fp_id"] = bodyObj["fp_id"];
                    product_request_body["signals"] = signals_info.signals;
                    product_request_body["custom_args"] = signals_info.custom_args;


                    if (status === 1) { //custom move
                        console.log("------------custom move---------------");
                        dbLogger.move_data_api_log_setLogger(localreq.id, "MOVED_INFO_FOR_CUSTOM_MOVE", new Date(), move_info);

                        product_request_body["status"] = 307;

                        /**
                         * NEED to fetch signal info mongo servivce
                         */

                        // need to check movelisting status before hit fetch signals;
                        let result = await fetchSignals(
                                {fp_id: product_request_body["fp_id"],
                                    signals: product_request_body["signals"]
                                });

                        custom_move = true;
                        product_request_body["signals_info"] = result;
                        if (product_request_body["status"] === 500) {

                            SMTPmailer.sendEmail(`Listing generation failed ..${parentObjRefId} --${localreq.id}--  ${new Date()}`,
                                    `  from ${process.env.NODE_ENV} ..... ${new Date()} 
                          ${util.inspect(product_request_body, false, null)}
                        `);

                        }
                        let response = await send_response_to_prodcut_callback(product_request_body,
                                localreq.body.product_callback_url, localreq.id);

                        dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-RESPONSE", new Date(), response);
                        dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());

                    } else {
                        dbLogger.move_data_api_log_setLogger(localreq.id, "MOVED_INFO", new Date(), move_info);

                        if (move_info && !move_info["error"]) {
                            try {
                                move_info["reference_request_id"] = bodyObj["req_reference_id"];
                                console.log("********** Completed Moving Data From Staging To Live And Versioning************* ");
                                product_request_body["status"] = 200;

                                // -------------mongo status starts---------------
                                if (move_info.moved_info["mongo"]) {
                                    var mongo = "";
                                    if (move_info.moved_info["mongo"]["leads_with_url"]) {
                                        mongo = move_info.moved_info["mongo"]["leads_with_url"];

                                    } else if (move_info.moved_info["mongo"]["leads_without_url"]) {

                                        mongo = move_info.moved_info["mongo"]["leads_without_url"];
                                    }
                                    let mongo_status = mongo[0];
                                    //-------------mongo status ends---------------



                                    // ------------- elastic status starts-------------
                                    if (move_info.moved_info["elastic"]) {
                                        var elastic = "";
                                        if (move_info.moved_info["elastic"]["business"]) {
                                            elastic = move_info.moved_info["elastic"]["business"];

                                        } else if (move_info.moved_info["elastic"]["projects"]) {
                                            elastic = move_info.moved_info["elastic"]["projects"];
                                        }
                                        let elastic_status = elastic[0];
                                        //-------------elastic status ends---------------



                                        if (!mongo_status.mongo_moved || !elastic_status.elastic_moved) {
                                            product_request_body["status"] = 500;
                                            product_request_body['code'] = 1;
                                            product_request_body["reason"] = {
                                                elastic_status: elastic_status,
                                                // need to remove body from elastic status
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
                            console.log("********** Moving Terminated************* ");
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
                        if (status !== 3) {
                            let response = await send_response_to_prodcut_callback(product_request_body,
                                    localreq.body.product_callback_url, localreq.id);

                            dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-RESPONSE", new Date(), response);
                            dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());
                        } else {
                            dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-HIT-BACKGROUND", new Date(), response);
                            dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());
                        }
                    }
                });








            } catch (moveException) {
                try {
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

                    let response = await send_response_to_prodcut_callback(product_request_body, localreq.body.product_callback_url, localreq.body.req_reference_id);
                    dbLogger.move_data_api_log_setLogger(localreq.id, "PRODUCT-RESPONSE", new Date(), response);
                    dbLogger.move_data_api_log_logRespTime(localreq.id, new Date());
                } catch (E) {
                    SMTPmailer.sendEmail(`Listing generation failed ..  ${parentObjRefId} --${localreq.id}----${new Date()}`,
                            `  from ${process.env.NODE_ENV} ..... ${new Date()} 
                  ${util.inspect(E, false, null)}
                  
                `);
                    dbLogger.move_data_api_log_setLogger(localreq.id, "ERROR", new Date(), E.message);
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
