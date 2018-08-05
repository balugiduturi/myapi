

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var responsive_device_list_router = express.Router();
 var move_listing =  require('../modules/move_listing/movelisting_api.js');
 responsive_device_list_router.route('/to_elastic_mongo').post(move_listing);




module.exports = responsive_device_list_router;