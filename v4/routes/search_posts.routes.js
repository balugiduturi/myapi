/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


 var index = require('../modules/search_posts/index.js');
 
 
var express = require('express');
var search_post__router = express.Router();

search_post__router.route('/').post(index);
 module.exports = search_post__router;