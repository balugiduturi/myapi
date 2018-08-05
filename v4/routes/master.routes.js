/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var master_router = express.Router();

var recommended_product_list = require('../modules/master/recommended_product_list.js');
master_router.route('/recommended_product_list').post(recommended_product_list);

module.exports = master_router;