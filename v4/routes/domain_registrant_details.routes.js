var express = require('express');
var domain_registrant_details_router = express.Router();
var domain_registrant_details = require('../modules/whois/registrant_details.js');
var details_by_domain = require('../modules/whois/details_by_domain.js');

domain_registrant_details_router.route('/registrant_details').post(domain_registrant_details);
domain_registrant_details_router.route('/details').post(details_by_domain);
 
module.exports = domain_registrant_details_router;