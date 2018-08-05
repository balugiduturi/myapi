/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var request = require('request');

(async function () {

    var headers = {
        'Authorization': 'Bearer 5e0a50d50229b7f0a49c2c6f814e01a9258ac927'
    };

    var options = {
        method: 'GET',
        url: 'http://127.0.0.1:8086/v4/autosuggest/search',
        timeout: 10000,
        headers: headers
    };
    request(options, function (error, response, data) {
        if (!error && response.statusCode === 200) {

            console.log(data);

        } else if (error) {
            console.log("ERRROR in request URL -----------------");
            console.log(error);

        } else if (response) {
            console.log("statuscode");
            console.log(response.statusCode);

        }
    });
})();