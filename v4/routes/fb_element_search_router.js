/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var fb_element = require('../modules/fb_element_search/index.js');
var express = require('express');
var fb_element_router = express.Router();

fb_element_router.route('/search').post(fb_element);
module.exports = fb_element_router;