/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var master_language_router = express.Router();

var master_elements_list =  require('../modules/master_elements_list/index.js');

master_language_router.route('/list').get(master_elements_list);




module.exports = master_language_router;