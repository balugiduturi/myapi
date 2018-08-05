/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var listing_router = express.Router();

var compare = require('../modules/listing/compare_versions.js');
var get_avaialibilty = require('../modules/listing/check_availability.js');
var get_avaialibilty_fromMongo = require('../modules/listing/signals_info_mongo.js');
var signal_info = require("../modules/listing/signals_info.js");
var edit = require('../modules/listing/edit.js');
var regenerate = require('../modules/listing/regenerate.js');
var competitors = require('../modules/listing/competitor.js');

listing_router.route('/compare_versions').post(compare);
listing_router.route('/checkavaialability').post(get_avaialibilty);
listing_router.route('/signals_info_mongo').post(get_avaialibilty_fromMongo);
listing_router.route('/signals_info').post(signal_info);
listing_router.route('/edit').post(edit);
listing_router.route('/regenerate').post(regenerate);
listing_router.route('/competitor').post(competitors);

module.exports = listing_router;