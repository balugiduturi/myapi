/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var single = require('../modules/addlisting/single.js');
var bulk = require('../modules/addlisting/bulk.js');
var batchStatus = require('../modules/addlisting/batch_status.js');
var express = require('express');
var adlisting_router = express.Router();

adlisting_router.route('/single').post(single);
adlisting_router.route('/bulk').post(bulk);
adlisting_router.route('/bulk_status').post(batchStatus);
module.exports = adlisting_router;