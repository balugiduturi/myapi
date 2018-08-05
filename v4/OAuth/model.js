/**
 * Configuration.
 */
var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var OAuthDAO = require('./DAO/token_house.js');
var config = {
    clients: [{
            clientId: 'application',
            clientSecret: 'secret'
        }],
    confidentialClients: [{
            clientId: 'confidentialApplication',
            clientSecret: 'topSecret'
        }, {
            clientId: 'buzzengine',
            clientSecret: 'buzz123'
        },
        {
            clientId: 'cenntralapi_dev',
            clientSecret: 'buzz123'
        }],
    tokens: [],
    users: [{
            id: '123',
            username: 'pedroetb',
            password: 'password'
        }]
};
/**
 * Dump the memory storage content (for debug).
 */

var dump = function () {

    console.log('clients', config.clients);
    console.log('confidentialClients', config.confidentialClients);
    console.log('tokens', config.tokens);
    console.log('users', config.users);
};
/*
 * Methods used by all grant types.
 */

var getAccessToken = function (bearerToken, callback) {

    (async function () {
        var tokens = [];
        try {

            tokens = await OAuthDAO.getToken(bearerToken);

            return callback(false, tokens[0]);
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            return callback(false, tokens[0]);
        }
    })();

};


var getClient = function (clientId, clientSecret, callback) {
    (async function () {
        var clients = [];
        var confidentialClients = [];
        try {

            clients = await OAuthDAO.getClients(clientId);

            confidentialClients = await OAuthDAO.getconfidentialClients(clientId);
            console.log("confidentialClients");
            console.log(confidentialClients.length);
            callback(false, clients[0] || confidentialClients[0]);
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            callback(false, clients[0] || confidentialClients[0]);
        }
    })();

};

var grantTypeAllowed = function (clientId, grantType, callback) {
    (async function () {
        var clientsSource = [];
        try {

            if (grantType === 'password') {
                clientsSource = await OAuthDAO.getClients(clientId);
            } else if (grantType === 'client_credentials') {
                clientsSource = await OAuthDAO.getconfidentialClients(clientId);
            }
            callback(false, clientsSource.length);
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
            callback(false, clientsSource.length);
        }


    })();

};
var saveAccessToken = function (accessToken, clientId, expires, user, callback) {

    (async function () {
        try {
            var data = {
                accessToken: accessToken,
                expires: expires,
                clientId: clientId,
                user: user
            };
            await OAuthDAO.saveAccessToken(data);
            callback(false);
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
        }
    })();

};
/*
 * Method used only by password grant type. will be implemented later for central API
 */

var getUser = function (username, password, callback) {


    var users = config.users.filter(function (user) {

        return user.username === username && user.password === password;
    });
    callback(false, users[0]);
};



/*
 * Method used only by client_credentials grant type. will be implemented later for central API
 */

var getUserFromClient = function (clientId, clientSecret, callback) {

    (async function () {
        var clients = [];
        try {
            clients = await OAuthDAO.getconfidentialClients(clientId);
            var user;
            if (clients.length) {
                user = {
                    username: clientId
                };

                callback(false, user);
            }
        } catch (E) {
            var user;
            if (clients.length) {
                user = {
                    username: clientId
                };
            }

            callback(false, user);
        }


    })();



};
/**
 * Export model definition object.
 */

module.exports = {
    getAccessToken: getAccessToken,
    getClient: getClient,
    grantTypeAllowed: grantTypeAllowed,
    saveAccessToken: saveAccessToken,
    getUser: getUser,
    getUserFromClient: getUserFromClient
};
