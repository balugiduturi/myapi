var logger = require(__base);
 var deviceList=require("./device_list.json");
 var dbLogger = require(__dblogger);
module.exports=function(req,res){
    try{ 
// console.log("deviceList ",deviceList)
                    dbLogger.setLogger(req.id, "INFO", new Date(),"device list sent");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({data: deviceList,"meta":{status:200,"message":"Success",count:deviceList.length}})
 
//    ogger.myEmitter.emit(`responseTime${req.id}`, new Date());
    }catch(execption){
         logger.fileLogger.error(execption);
          dbLogger.setLogger(req.id, "ERROR", new Date(),execption);
                logger.myEmitter.emit(`responseTime${req.id}`, new Date());
               res.send({
                status: 500, error: "Something went wrong please try again",
             });
        
    }
   
};

