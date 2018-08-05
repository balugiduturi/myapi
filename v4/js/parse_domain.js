/* 
 * To parse the domain if end-user give url 
 * @author:tulsi
 */


const parse = require("parse-domain");
var logger = require(__base);

var parseDomain = function(url) {
    try {
        var result = "";
        var result = parse(url);
     if(result!==null) {
         var domainName = result.domain + '.' + result.tld;
         return domainName;
     } else {
         return false;
     }
    } catch(Exception){
        logger.myEmitter.emit('handleError',new Date(),Exception);
        logger.fileLogger.error(Exception);
        console.log(Exception);
    }

     
};
module.exports.parseDomain = parseDomain;