 var logger = require(__base);
var dbLogger = require(__dblogger);
var search_posts=require("./search_posts.js");
var mongo_elstic_collections_indexes = require("../../connections/indexes_and_mongo_collections.js");
var elastic_indexes=mongo_elstic_collections_indexes.elastic_indexes
var elastic_types=mongo_elstic_collections_indexes.elastic_types
module.exports =async function (req, res) {
          try {
            var order_by="desc"
            var sort_by="data.created_time"
            var page_no=0
            var limit=10;
            var elastic_index;
            var elastic_type;
        var bodyObj=req.body;
      var error_msg=""
        if(!bodyObj){
               dbLogger.setLogger(req.id, "INFO", new Date(), "No results found");
             res.send({status:204,message:" Body missing"})
            return null
        }
        if(!bodyObj["fp_id"]){
        
              error_msg=error_msg+"missing manditory inputs : fp_id,"
            
        }
        if(bodyObj && !bodyObj.posts_type){
              error_msg=error_msg+"posts_type"
        }
        if(error_msg && error_msg.length>0){
             dbLogger.setLogger(req.id, "INFO", new Date(), error_msg);
             res.send({status:204,message:error_msg})
             return null;
        }
     
        if(!bodyObj || !bodyObj["fp_id"] || (bodyObj && bodyObj.posts_type!="facebook" && bodyObj.posts_type!="twitter" && bodyObj.posts_type!="google")){
               dbLogger.setLogger(req.id, "INFO", new Date(), "No results found");
             res.send({status:204,fp_id:bodyObj["fp_id"],message:"posts_type should be either facebook or twitter or google"})
             return null;
        }
        if(bodyObj.posts_type==="facebook"){
            elastic_index=elastic_indexes["facebook_posts_data"]
            elastic_type=elastic_types["facebook_posts_data"]
            sort_by="data.created_time"
        }
            
        else if(bodyObj.posts_type==="twitter"){
             elastic_index=elastic_indexes["twitter_posts_data"]
            elastic_type=elastic_types["twitter_posts_data"]
            sort_by="data.created_at"
        }
            
         else
         {
           elastic_type="google_posts_data"
         }
        console.log("bodyObj ",bodyObj)
        if(bodyObj && bodyObj["order_by"])
            order_by=bodyObj && bodyObj["order_by"];
        if(bodyObj && bodyObj["sort_by"])
            sort_by=bodyObj && bodyObj["sort_by"];
        if(bodyObj && bodyObj["page_no"])
            page_no=bodyObj && bodyObj["page_no"];
        if(bodyObj && bodyObj["limit"])
            limit=bodyObj && bodyObj["limit"];
             var from=page_no*10
           
            console.log("from ",from,"to ",limit)
         var elastic_query=prepareElasticQuery(sort_by,order_by,from,limit,elastic_type,elastic_index,bodyObj["fp_id"]);
         var posts= await search_posts(elastic_query);
          if(posts && !posts["error"]){
            dbLogger.logRespTime(req.id, new Date());
            var finalData=posts.map(function(item){
                 if(item["_source"] && item["_source"]["data"]){
                    var newObj={}
                    
                    newObj=item["_source"]["data"];
                    newObj["listing_id"]=item["_id"]
                    
                }
                return newObj
            })
             res.send({status:200,"fp_id":bodyObj["fp_id"],data:finalData})
         }else if(posts && posts["error"]){
             dbLogger.setLogger(req.id, "ERROR", new Date(), posts["error"]);
                dbLogger.logRespTime(req.id, new Date());
             res.send({status:500,message:"Please check provided data"})
              
         }else {
              dbLogger.setLogger(req.id, "INFO", new Date(), "No results found");
             res.send({status:204,message:"No results found"})
         }
 //         console.log("posts ",posts)
        } catch (EXception) {
             logger.fileLogger.error(EXception);
                dbLogger.setLogger(req.id, "ERROR", new Date(), EXception);
                dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: "Something went wrong please try again",
            });

        }

 

};










function prepareElasticQuery(sort_type,oreder_by,from,to,elastic_type,elastic_index,fp_id){
    console.log("elastic_type ",elastic_type)
    var sort=sort_type;
    var search_sort={}
    search_sort[sort]={"order" :oreder_by}
var query={index: elastic_index,
                    type: elastic_type,
                    body: {   
                         "from" : from,
                         "size" : to,
                         
        "query": {
         "term":{"fp_id":fp_id}
        },
                        "sort" : search_sort
   

                    }
                }
 
    return query
}


// "sort" : {sort_type:{"order" :oreder_by}}