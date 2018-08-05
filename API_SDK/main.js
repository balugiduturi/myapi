/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const crypto = require('crypto');
var request = require('request');

var public_key = "d705cc6602fe1d255e24271b3e409cf2a9a3ec15";
var secret_key = "f2a02af9e453e1521009fdc565cc198a";
 (async function () {

    var JsonString = `{
        "keyword": "fur",
        "listing_source": "public",
        "country_code": "us",
        "category_type": "google",
        "partner_id": 150,
        "scope": ["category", "website", "business_name", "product"]
    }`;
    var encodedData = new Buffer(JsonString).toString('base64');
    console.log(encodedData);

    var hmac = crypto.createHmac('sha384', secret_key).update(encodedData).digest('hex');
    console.log(hmac);
    var options = {
        method: 'POST',
        url: 'http://127.0.0.1:8086/v4/autosuggest/search',
        timeout: 10000,
        form: {
            signature: hmac,
            key: public_key,
            data: encodedData
        }
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