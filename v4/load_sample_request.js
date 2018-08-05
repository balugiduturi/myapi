/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var request = require('request');




var a = [1, 1, 1, 1, 111, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
a.forEach(function (value) {
    console.log(value);
    var headers = {
        'Authorization': 'Bearer 5e0a50d50229b7f0a49c2c6f814e01a9258ac927'
    };

    var options = {
        method: 'POST',
        url: 'http://localhost:8086/v4/autosuggest/search',
        form: {
            "keyword": "gen",
            "listing_source": "public",
            "country_code": "us",
            "category_type": "google",
            "scope": ["website", "business_name", "category"],
            "size_limit": 2

        },
        headers: headers
    };
    request(options, function (error, response, data) {
        if (!error) {
            console.log("data", data);
        } else {
            console.log(error);
        }

    });
})




