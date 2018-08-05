if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}


var logger = require(__base);
 
module.exports= function(search_query){
    console.log("search_query ",search_query)
    return new Promise(async function(resolve,reject){
        
        try{
            
           var result = await client.search(search_query);    
           if(result && result.hits && result.hits.total>0){
               resolve(result.hits.hits)
           }else if(result.error){
              resolve({error:result.error.msg})
           }else{
               resolve(null)
           }
        }catch(Exception){
              logger.fileLogger.error(Exception);
            resolve({"error":Exception})
        }
        
        
    })
    
    
      
    
    
}