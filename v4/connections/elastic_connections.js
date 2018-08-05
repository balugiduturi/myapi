/* 
 * 
 * Configuring connections with remote elastic search for finding fp _details
 * @author:tulsi
 */


var elasticsearch = require('elasticsearch');

var auth = 'admin:bgt^vfr%';
var port = 9200;
var protocol = 'http';
var auth_hostUrls = [
    'es1.discover-prospects.com',
    'es1.discover-prospects.com'
];

var auth_hosts = auth_hostUrls.map(function (host) {
    return {
        protocol: protocol,
        host: host,
        port: port,
        auth: auth
    };
});


var auth_client = new elasticsearch.Client({
    hosts: auth_hosts,
    requestTimeout: 50000000

});


var liveclient = new elasticsearch.Client({
    hosts: [
        '107.21.99.225:9200'
    ],
    requestTimeout: 50000000

});
var liveclient_9800 = new elasticsearch.Client({
    hosts: [
        '107.21.99.225:9800'
    ],
    requestTimeout: 50000000

});

var localclient = new elasticsearch.Client({
    hosts: [
        '107.21.99.225:9200'
    ],
    requestTimeout: 50000000
});



var whois_client = new elasticsearch.Client({
    hosts: [
        '104.154.240.214:9200'
    ],
    requestTimeout: 50000000
});

module.exports.liveclient_9800 = liveclient_9800;

if (process.env.NODE_ENV === 'development') {
    module.exports.liveclient = auth_client;
    module.exports.localclient = auth_client;
} else {
    module.exports.liveclient = liveclient;
    module.exports.localclient = localclient;
}

module.exports.whois_client = whois_client;
module.exports.auth_client = auth_client;
