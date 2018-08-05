if (process.env.NODE_ENV === 'production') {
    var whois_client = require(`${__v4root}/connections/elastic_connections.js`).whois_client;
} else {
    var whois_client = require(`${__v4root}/connections/elastic_connections.js`).whois_client;
}
var util = require("util");
  var logger = require(__base);
var dbLogger = require(__dblogger);
module.exports = async function (req, res) {
         try {
  var whiteSpace=hasWhiteSpace(req.body.domain)
        if(whiteSpace){
            dbLogger.setLogger(req.id, "ERROR", new Date(), "Please Provide Valid Domain");
                    dbLogger.logRespTime(req.id, new Date());
               res.send({status: 412, error: "Please Provide Valid Domain"});
               return null
        }
            if (!(req.body) || !(req.body.domain)|| (req.body.domain==="null")|| (req.body.domain==="undefined") || (req.body.domain===" ")) {
                dbLogger.setLogger(req.id, "INFO", new Date(), "body missing manditory filed domain ");
                dbLogger.logRespTime(req.id, new Date());
                res.send({status: 412, error: "body missing manditory filed domain"});
                return;
            }
            
                 result = await whois_client.search({index: "whois_data_com_v19",body: {"query": {"filtered": {"filter": {"and": [ {"term": { "domainName.raw": req.body.domain }}]}}}}});

        var resultDoc;
        var responseObject={};
        if(result && result.hits && result.hits.hits&& result.hits.hits[0])
            resultDoc=result.hits.hits[0]._source;
        if(resultDoc){
            if(resultDoc["expiresDate"])
            responseObject["expiresDate"]=resultDoc["expiresDate"]
            if(resultDoc["createdDate"])
            responseObject["createdDate"]=resultDoc["createdDate"]
            if(resultDoc["domainName"])
            responseObject["domainName"]=resultDoc["domainName"]
//            if(resultDoc["registrant_email"])
//            responseObject["registrant_email"]=resultDoc["registrant_email"]
//            if(resultDoc["registrant_name"])
//            responseObject["registrant_name"]=resultDoc["registrant_name"]
//            if(resultDoc["registrant_telephone"])
//            responseObject["registrant_telephone"]=resultDoc["registrant_telephone"]
//            if(resultDoc["administrativeContact_email"])
//            responseObject["administrativeContact_email"]=resultDoc["administrativeContact_email"]
//            if(resultDoc["administrativeContact_name"])
//            responseObject["administrativeContact_name"]=resultDoc["administrativeContact_name"]
//            if(resultDoc["administrativeContact_telephone"])
//            responseObject["administrativeContact_telephone"]=resultDoc["administrativeContact_telephone"]
//            if(resultDoc["technicalContact_email"])
//            responseObject["technicalContact_email"]=resultDoc["technicalContact_email"]
//            if(resultDoc["technicalContact_name"])
//            responseObject["technicalContact_name"]=resultDoc["technicalContact_name"]
//            if(resultDoc["technicalContact_telephone"])
//            responseObject["technicalContact_telephone"]=resultDoc["technicalContact_telephone"]
//            if(resultDoc["billingContact_email"])
//            responseObject["billingContact_email"]=resultDoc["billingContact_email"]
//            if(resultDoc["billingContact_name"])
//            responseObject["billingContact_name"]=resultDoc["billingContact_name"]
//            if(resultDoc["billingContact_telephone"])
//            responseObject["billingContact_telephone"]=resultDoc["billingContact_telephone"]
//            if(resultDoc["zoneContact_email"])
//            responseObject["zoneContact_email"]=resultDoc["zoneContact_email"]
//            if(resultDoc["zoneContact_name"])
//            responseObject["zoneContact_name"]=resultDoc["zoneContact_name"]
//            if(resultDoc["zoneContact_telephone"])
//            responseObject["zoneContact_telephone"]=resultDoc["zoneContact_telephone"]
        }
        if(!resultDoc )
            responseObject="No Details Found for this domain"
        var responseObj={
                        status: 200,
                        data: responseObject,
                        meta: {
                            "request_reference_id": req.id,
                            domain:req.body.domain
                        }

                    }
                                       dbLogger.setLogger(req.id, "RESPONSE", new Date(),responseObj);
                dbLogger.logRespTime(req.id, new Date());
        res.send(responseObj)
        
      }catch(Exception){
            
            dbLogger.setLogger(req.id, "ERROR", new Date(), Exception.message);
            logger.fileLogger.error(Exception);
            console.log(Exception);
            res.send({"status": 500, error: "something went wrong please try again", meta: {"request_reference_id": req.id}});
        }
    
    
    
 }
 
 function hasWhiteSpace(s) {
  return /\s/g.test(s);
}