/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var local_database_conn = require(__base).local_database;

var analysis_engine_db = local_database_conn.db("central_api_oauth_token_db");
var tokens = analysis_engine_db.collection("tokens");
var clients = analysis_engine_db.collection("clients");
var conf_clients = analysis_engine_db.collection("conf_clients");

var saveAccessToken = function (data) {
    return new Promise(async (resolve, reject) => {
        try {
            var doc = await tokens.save(data);
            if (doc) {
                let id = "";
                id = doc.ops[0]._id;
                if (id) {
                    resolve(id);
                } else {
                    reject(new Error("Failed to save token"));
                }

            } else {
                reject(new Error("Failed to save token"));
            }
        } catch (E) {
            reject(E);
        }
    });
};

var getClients = function (clientId) {
    return new Promise(async (resolve, reject) => {
        try {
            var client = [];
            var doc = await clients.findOne({"clientId": clientId});
            if (doc) {
                client.push(doc);
                resolve(client);
            } else {
                resolve(client);
            }

        } catch (E) {
            reject(new Error("Invalid client"));
        }
    });
};
var getconfidentialClients = function (clientId) {

    return new Promise(async (resolve, reject) => {
        try {
            var client = [];

            var doc = await conf_clients.findOne({"clientId": clientId});
            if (doc) {
                client.push(doc);
                resolve(client);
            } else {
                resolve(client);

            }
        } catch (E) {
            reject(new Error("Invalid client"));
        }
    });
};

var getToken = function (bearerToken) {
    return new Promise(async (resolve, reject) => {
        try {
            var tokenList = [];
            var doc = await tokens.findOne({"accessToken": bearerToken});
            if (doc) {
                tokenList.push(doc);
                resolve(tokenList);
            } else {
                resolve(tokenList);
            }
        } catch (E) {
            reject(E);
        }
    });
};


module.exports.getToken = getToken;
module.exports.getClients = getClients;
module.exports.saveAccessToken = saveAccessToken;
module.exports.getconfidentialClients = getconfidentialClients;
