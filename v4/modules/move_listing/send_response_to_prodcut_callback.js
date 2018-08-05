var logger = require(__base);
var dbLogger = require(__dblogger);
var request = require('request');
module.exports = function (body,product_callback_url,req_reference_id) {
    return new Promise(function (resolve, reject) {

console.log("product_callback_url ",product_callback_url)

        var options = {
             headers: {
      'Content-Length':body.length ,
      'Content-Type': 'application/json'
    },method: 'POST',
            url: product_callback_url,
            timeout: 10000,
            form: body
        };
        dbLogger.setLogger(req_reference_id, "PRODUCT-CALLBACK-BODY", new Date(), body);
        request.post(options, function (error, response, data) {
            if (!error) {
                try {
                    resolve(data);
                } catch (E) {
                    reject(E);
                }

            } else {
                console.log(error);
                dbLogger.setLogger(req_reference_id, "ERROR", new Date(), error);

                reject(error);
            }
        });


    })
};