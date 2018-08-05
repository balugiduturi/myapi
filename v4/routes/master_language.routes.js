/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var master_language_router = express.Router();

var getmasterLanguageList =  require('../modules/master_languages/master_languages.js');

master_language_router.route('/list').get(getmasterLanguageList);




module.exports = master_language_router;