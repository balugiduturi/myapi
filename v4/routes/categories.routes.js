
var prediction = require('../modules/category_prediction/index.js');

var express = require('express');
var categories_router = express.Router();

categories_router.route('/predict').post(prediction);
module.exports = categories_router;