var elasticsearch =  require('elasticsearch');
var auth = 'admin:bgt^vfr%';
var port = 9200;
var protocol = 'http';
var hostUrls = [
    'es1.discover-prospects.com',
    'es2.discover-prospects.com',

];

var hosts = hostUrls.map(function(host) {
    return {
        protocol: protocol,
        host: host,
        port: port,
        auth: auth
    };
});

var client = new elasticsearch.Client({
    hosts: hosts
});
client.search({
  index: 'dp_projects',
  type: 'projects',
  body:{  "query": {"terms": { "_id": [ "5a2103e195d46a0e2b8b5da9" ]  } }}
}, function (err, res) {
                    if (err)
                        return console.log("Error has been occured while fetching the Doc count:::" + err);
                    else{
                        console.log("res ",res)
                    }
                 });