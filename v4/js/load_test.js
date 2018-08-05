/* 
 * To check load test for concurrent hits to technology finder api
 */


var siege = require("siege");
siege()
        .on(8086)
        .concurrent(1000)
        .for(10000).times
        .set('Authorization', 'Bearer 5e0a50d50229b7f0a49c2c6f814e01a9258ac927')
        .post('/v4/autosuggest/search', {
            "keyword": "bli",
            "listing_source": "private",
            "country_code": "us",
            "category_type": "google",
            "partner_id": 1638,
            "scope": ["category", "website", "business_name", "product"]
        })
        .attack();
