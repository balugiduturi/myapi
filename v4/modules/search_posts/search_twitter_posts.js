var logger = require(__base);
var dbLogger = require(__dblogger);
var search_posts=require("./search_posts.js")
module.exports =async function (req, res) {
         try {
            var order_by="desc"
            var sort_by="added_date"
            var page_no=0
            var limit=10;
        var bodyObj=req.body;
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
         var elastic_query=prepareElasticQuery(sort_by,order_by,from,limit);
         var posts= await search_posts(elastic_query);
         res.send(posts)
//         console.log("posts ",posts)
        } catch (E) {
            console.log(E);
            logger.fileLogger.error(E);
             dbLogger.logRespTime(req.id, new Date());
            res.send({
                status: 500, error: "Something went wrong please try again",
            });

        }

 

};










function prepareElasticQuery(sort_type,oreder_by,from,to){
    var sort=sort_type;
    var search_sort={}
    search_sort[sort]={"order" :oreder_by}
var query={index: 'analysis_engine_db',
                    type: 'projects',
                    body: {   
                         "from" : from,
                         "size" : to,
                        "sort" : search_sort
   

                    }
                }
 
    return query
}


// "sort" : {sort_type:{"order" :oreder_by}}