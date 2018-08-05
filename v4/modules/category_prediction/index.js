/*
 * Description : To predict category ids and labels against content
 * Created : April 23 2018
 * Author : Tulsiram
 * Email : tulasiram@buzzboard.com
 * 
 */

var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var request = require('request');
var livyserver_api_url = "http://104.154.240.214:8998/sessions";
var session_number = 0;

function createStatement(body) {
    return new Promise(async (resolve, reject) => {
        try {
            var options = {
                method: 'POST',
                headers:
                    {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                url: `${livyserver_api_url}/${session_number}/statements`,
                timeout: 10000,
                "body": body,
                json: true

            };

            request(options, function (error, response, data) {
                if (!error) {
                    // console.log(data);
                    resolve(data);
                } else {
                    console.log(error);
                    reject(error);
                }
            });

        } catch (E) {
            reject(E);
        }
    })
}

function checkStatementStatus(id) {
    return new Promise(async (resolve, reject) => {
        try {

            var options = {
                method: 'GET',
                headers:
                    {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                url: `${livyserver_api_url}/${session_number}/statements/${id}`,
                timeout: 10000,
            };
            setTimeout(function () {
                request(options, function (error, response, data) {
                    if (!error) {

                        resolve(data);
                    } else {
                        reject(error);
                    }
                });
            }, 300);


        } catch (E) {
            reject(E);
        }
    })
}

function checkStatus(id) {
    return new Promise(async (resolve, reject) => {
        try {
            var state = "";
            var result = "";

            result = await checkStatementStatus(id);
            while (state != "available") {
                result = JSON.parse(await checkStatementStatus(id));
                state = result.state;
            }

            resolve(result);
        } catch (E) {
            reject(E);
        }
    });
}

module.exports = async function (req, res) {
    try {

        if (!req.body) {
            dbLogger.setLogger(req.id, "ERROR", new Date(), "request must contain body");
            dbLogger.logRespTime(req.id, new Date());
            res.send({ status: 412, error: "request must contain body", meta: { "req_reference_id": req.id } });
            return;
        }

        if (!req.body.content) {
            let text = `request must contain content`;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 412, error: text,
                meta: { "req_reference_id": req.id }
            })
            return;
        }

        let category_text = `t.predict_category('${req.body.content}')`;
        var query_body = {
            "code": category_text
        }

        var statementResult = await createStatement(query_body);
        if (statementResult.hasOwnProperty("id")) {
            console.log("statement_id---", statementResult.id);

            let statusResult = await checkStatus(statementResult.id);

            if (statusResult.output && statusResult.output.status === "ok") {
                let data = statusResult.output.data;
                let text =  `${data["text/plain"]}`.trim().replace(/'/g, '"');
                // let text = `${data["text/plain"]}`.replace(/[|&;$%@"<>()+]/g, '')
                res.json({
                    data: JSON.parse(text),
                    meta: { "req_reference_id": req.id }
                })
                return;
            } else {
                res.send({
                    status: 500,
                    error: statusResult.output.ename,
                    message: statusResult.output.evalue,
                    meta: { "req_reference_id": req.id }
                })
                return;
            }



        } else {
            let text = statementResult;
            dbLogger.setLogger(req.id, "ERROR", new Date(), text);
            dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: text,
                meta: { "req_reference_id": req.id }
            })
            return;
        }






    } catch (E) {
        dbLogger.setLogger(req.id, "ERROR", new Date(), E);
        dbLogger.logRespTime(req.id, new Date());
        res.send({
            status: 500, error: E.message,
            meta: { "req_reference_id": req.id }
        });
        return;
    }
}