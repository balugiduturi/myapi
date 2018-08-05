/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var express = require('express');
var pdfImages_router = express.Router();

var proof =  require('../modules/proof_generation/proof.js');

pdfImages_router.route('/proof').post(proof);




module.exports = proof;