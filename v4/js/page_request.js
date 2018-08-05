/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */ 
const cheerio = require('cheerio');
const request = require('request');
var fs = require('fs');
var logger = require(__base);
var getPageRquest = function (domainName, cb) {
    try {
        request({uri: domainName,
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10}, function (error, response, html) {
            if (!error && response.statusCode === 200) {

                var $ = null;
                var scrapeData = {
                    html: "",
                    headers: ""
                };
                $ = cheerio.load(html);
                scrapeData.html = $.html();
                scrapeData.headers = response.headers;

                fs.writeFile('scrapePage.txt', $.html(), function (err) {

                    console.log('File successfully written! - Check your project directory for the scrapePage.txt file');
                      cb(null, scrapeData);
                });

            

            } else if (error) {
                console.log("ERRROR in request URL -----------------");
                console.log(error);
                cb(error);
            } else if (response) {
                console.log("statuscode");
                console.log(response.statusCode);
                cb({status: response.statusCode});
            }
        });
    } catch (Exception) {
        console.log(Exception);
    }
};

module.exports.getPageRquest = getPageRquest;
 