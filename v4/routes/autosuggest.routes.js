/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var search =  require('../modules/autosuggest/search.js');
var search_beta =  require('../modules/autosuggest/search_beta.js');

var express = require('express');
var autosuggest_router = express.Router();

autosuggest_router.route('/search').post(search);
autosuggest_router.route('/search_beta').post(search_beta);



module.exports = autosuggest_router;