

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var responsive_device_list_router = express.Router();

var responsive_device_list =  require('../modules/master_responsive_devices/list.js');

responsive_device_list_router.route('/list').get(responsive_device_list);




module.exports = responsive_device_list_router;