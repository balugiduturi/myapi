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
             var responseObj={}
  var whiteSpace=hasWhiteSpace(req.body.domain)
        if(whiteSpace){
            dbLogger.setLogger(req.id, "ERROR", new Date(), "Please Provide Valid Domain");
                    dbLogger.logRespTime(req.id, new Date());
                    responseObj={
                        status: 412,
                        message: "Please Provide Valid Domain",
                        meta: {
                            "request_reference_id": req.id,
                            domain:req.body.domain,
                         }

                    }
               res.send(responseObj);
               return null
        }
            if (!(req.body) || !(req.body.domain)|| (req.body.domain==="null")|| (req.body.domain==="undefined") || (req.body.domain===" ")) {
                dbLogger.setLogger(req.id, "INFO", new Date(), "body missing manditory filed domain");
                dbLogger.logRespTime(req.id, new Date());
                    responseObj={
                        status: 412,
                        message: "body missing manditory filed domain",
                        meta: {
                            "request_reference_id": req.id,
                            domain:req.body.domain,
                         }

                    }
               res.send(responseObj);                return;
            }
            
                 result = await whois_client.search({index: "whois_data_com_v19",body: {"query": {"filtered": {"filter": {"and": [ {"term": { "domainName.raw": req.body.domain }}]}}}}});

        var resultDoc;
        var responseObject={registration:{}};
        
        if(result && result.hits && result.hits.hits&& result.hits.hits[0])
            resultDoc=result.hits.hits[0]._source;
        var not_found_elements=["createdDate","updatedDate","expiresDate","registrarName","name_servers"]
        if(resultDoc){       
         
      
             if(resultDoc["createdDate"]){
                 var date_created=resultDoc["createdDate"]
                 date_created=date_created.split("-")
                  
                 responseObject["registration"]["createdDate"]=date_created[2]+"-"+monthNum[date_created[1]]+"-"+date_created[0];
                 var index = not_found_elements.indexOf("createdDate");    // <-- Not supported in <IE9
                 if (index !== -1) {
                    not_found_elements.splice(index, 1);
                }
             }
             if(resultDoc["updatedDate"]){
                  var date_created=resultDoc["updatedDate"]
                 date_created=date_created.split("-")
                  
                 responseObject["registration"]["updatedDate"]=date_created[2]+"-"+monthNum[date_created[1]]+"-"+date_created[0];
                 
                   var index = not_found_elements.indexOf("updatedDate");    // <-- Not supported in <IE9
                if (index !== -1) {
                    not_found_elements.splice(index, 1);
                }
             }
             if(resultDoc["expiresDate"]){
                  var date_created=resultDoc["expiresDate"]
                 date_created=date_created.split("-")
                  
                 responseObject["registration"]["expiresDate"]=date_created[2]+"-"+monthNum[date_created[1]]+"-"+date_created[0];
                 
                   var index = not_found_elements.indexOf("expiresDate");    // <-- Not supported in <IE9
                if (index !== -1) {
                    not_found_elements.splice(index, 1);
                }
             }
             if(resultDoc["registrarName"]){
                 responseObject["registration"]["registrarName"]=resultDoc["registrarName"];
                  var index = not_found_elements.indexOf("registrarName");    // <-- Not supported in <IE9
                if (index !== -1) {
                    not_found_elements.splice(index, 1);
                }
             }
             
             if(resultDoc["nameServers"]){
                 responseObject["name_servers"]=(resultDoc["nameServers"]).split("|");
                 var arrayLength=responseObject["name_servers"].length;
                 if((arrayLength > 1 &&  responseObject["name_servers"][arrayLength-1]).length===0){
                      responseObject["name_servers"].splice(arrayLength-1, 1);
                 }
                  var index = not_found_elements.indexOf("name_servers");    // <-- Not supported in <IE9
                if (index !== -1) {
                    not_found_elements.splice(index, 1);
                }
             }
             
 
            
        }
        if(!resultDoc ){
             responseObj={
                        status: 204,
                        message: "No Listing Found for this domain",
                        meta: {
                            "request_reference_id": req.id,
                            domain:req.body.domain,
                         }

                    }
        }else{
            responseObj={
                        status: 200,
                        data: responseObject,
                        meta: {
                            "request_reference_id": req.id,
                            domain:req.body.domain,
                            "keys_not_found":not_found_elements
                        }

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
var monthNum={"jan":"01","feb":"02","mar":"03","apr":"04","may":"05","jun":"06","jul":"07","aug":"08","sep":"09","oct":"10","nov":"11","dec":"12"}