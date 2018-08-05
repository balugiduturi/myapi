const SMTPmailer = require(`${__v4root}/modules/email_service/send_alert.js`);
var request = require("request");


var sucess_count = 0;
var failure_count = 0
var date = new Date();
date.setHours(date.getHours() + 5)
date.setMinutes(date.getMinutes() + 30)
var monthArray = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
var start_time = date.getDate() + "-" + monthArray[date.getMonth()] + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
function getSearchResponse() {
    var reqUrl = "https://api.discover-prospects.com:8086/v4/autosuggest/search"

    var headers = {
        'Authorization': 'Bearer 5e0a50d50229b7f0a49c2c6f814e01a9258ac927'
    };

    var options = {
        method: 'POST',
        url: reqUrl,
        form: {
            "keyword": "clinics",
            "listing_source": "public",
            "country_code": "us",
            "category_type": "neustar",
            "partner_id": "152",
            "scope": ["category", "website", "business_name", "product"],
            "location_keyword": "Newark",
            "location_scope": "locality",
            "size_limit": 4
        },
        headers: headers,
        strictSSL: false,
        time: true

    };



    request(options, function (error, response, data) {
        if (!error) {
            let jsonData = JSON.parse(data)

            if (jsonData && jsonData["status"] === 200) {
                sucess_count++;
            } else {
                SMTPmailer.sendEmail(`Autosuggest Failed Response  `, data);

                failure_count++;
            }
        } else {
            SMTPmailer.sendEmail(`Autosuggest Monitor Error  `, error);
            failure_count++;
        }

//        console.log("Response Time **********  ", response.elapsedTime)
        if (response && response.elapsedTime > 3000) {
            SMTPmailer.sendEmail(`Autosuggest Delay In Response from live http://107.21.99.225 `, `Response for autosuggest is more than 3 sec Response Time  is  ${response.elapsedTime}` + " milliseconds");
        }
    });
}


setInterval(function () {
    getSearchResponse();
}, 300000);


setInterval(function () {
    let end_date = new Date();
    end_date.setHours(end_date.getHours() + 5)
    end_date.setMinutes(end_date.getMinutes() + 30)
    var end_time = end_date.getDate() + "-" + monthArray[end_date.getMonth()] + "-" + end_date.getFullYear() + " " + end_date.getHours() + ":" + end_date.getMinutes() + ":" + end_date.getSeconds();

    SMTPmailer.sendEmail("Autosuggest Hourly Report From " + start_time + " to " + end_time, "Total Requested :" + (sucess_count + failure_count) + " Success : " + sucess_count + ", Failure : " + failure_count);
    date = new Date();
    setTimeout(function () {
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 30);
        start_time = date.getDate() + "-" + monthArray[date.getMonth()] + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        sucess_count = 0;
        failure_count = 0;
    }, 5000);

}, 3600000);
//3600000
getSearchResponse();
