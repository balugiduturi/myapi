/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var schema ={
    requestType:"POST/GET",
    requestTime:new Date(),
    requestParams:{
     url:"gnc.com" 
     
    },
    logs:[
        {
            type:"ERROR",
            message:"*******",
            createdAt:new Date()
        },
        {
            type:"INFO",
            message:"*******",
            createdAt:new Date()
        }
    ],
    responseTime:"",
    totalTime:""
    
    
};