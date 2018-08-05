/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var logger = require(__base);
var dbLogger = require(__dblogger);
var request = require('request');
module.exports = function (body) {



    var options = {method: 'POST',
        url: 'http://datalogs.buzzboard.com/v1/listing/digital_analysis/single/',
        timeout: 10000,
        form: body
    };
    return new Promise((resolve, reject) => {

        request.post(options, function (error, response, data) {
            if (!error) {
                try {
                    var result = JSON.parse(data);
                    resolve(result);
                } catch (E) {
                    reject(E);
                }

            } else {
                dbLogger.setLogger(body.request_info.req_reference_id, "ERROR", new Date(), error);
                console.log(error);
                reject(error);
            }
        });
    });
};



