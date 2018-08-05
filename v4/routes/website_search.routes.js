/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var website_search = require('../modules/website_search/index.js');
var express = require('express');
var website_router = express.Router();

website_router.route('/website_search_chrome').post(website_search);
module.exports = website_router;



