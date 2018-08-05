/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




var express = require('express');
var adlisting_router = express.Router();

var dblogger_reqId = require('../modules/central_logger/index.js');
var dblogger_reqId_last = require('../modules/central_logger/index_reqId_last.js');
var dblogger_single = require('../modules/central_logger/index-single.js');




adlisting_router.route('/').get(dblogger_single);
adlisting_router.route('/:size').get(dblogger_single);
adlisting_router.route('/:reqId').get(dblogger_reqId);
adlisting_router.route('/:reqId/:last').get(dblogger_reqId_last);

module.exports = adlisting_router;