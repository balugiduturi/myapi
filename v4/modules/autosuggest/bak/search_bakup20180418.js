


if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
}
var _ = require('underscore');

var dbLogger = require(__dblogger);

/*
 * To listen the event emitters listening from all modules through 
 * out the flow and we use the reqID for reference for each request
 *
 */




/*
 * function titleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}
titleCase("I'm a little tea pot");
 */

var logger = require(__base);
const customAsync = require('async');
var countrie_list = ["us", "gb", "ca", "nz", "uk", "au"];
var scopeList = ["category", "website", "business_name", "product"];
var listing_source = ["public", "private"];
var categories = ["neustar", "google"];

var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;


function getBusinessName(input) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("business_name") && input.scope.length !== 0)
                    return;
                var result = '';
//                input.country_code = input.country_code ? input.country_code : 'us';
//                input.listing_source = input.listing_source ? input.listing_source : 'public';

                if (input.listing_source === 'private') {
                    /*
                     * listing_source :private
                     */
                    if (input.listing_source === 'private' && !input.partner_id)
                        return {"status": 412, error: "partner id is required for private listings"};

                    result = await client.search({index: elastic_indexes['leads_with_url'],
                        type: elastic_types['leads_with_url'],
                        body: {
                            "size": 0,
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [
                                            {"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                                            {"term": {"business.buzz_partner_id": `${input.partner_id}`}}, //2102 or 2107 ...
                                            {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                                            {"match_phrase": {"business.name": `${input.keyword}`}}
                                        ]
                                    }
                                }
                            }, "aggs": {
                                "bname": {
                                    "terms": {
                                        "field": "business.name.raw"
                                        , "size": input.size_limit

                                    }
                                }
                            }
                        }
                    });

                } else {
                    /*
                     * listing_source :public
                     */
                    result = await client.search({index: elastic_indexes['leads_with_url'],
                        type: elastic_types['leads_with_url'],
                        body: {
                            "size": 0,
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [
                                            {"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                                            {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                                            {"match_phrase": {"business.name": `${input.keyword}`}}
                                        ]
                                    }
                                }
                            }, "aggs": {
                                "bname": {
                                    "terms": {
                                        "field": "business.name.raw"
                                        , "size": input.size_limit
                                    }
                                }
                            }
                        }
                    });
                }


                if (result && result.hits.total !== 0) {
                    let bucketArray = result.aggregations.bname.buckets;

//                    let bnames = _.pluck(bucketArray, 'key');
                    let bnames = [];
                    _.each(bucketArray, (value) => {
                        bnames.push({name: value.key, count: value.doc_count});
                    });
                    return {
                        meta: {status: 200, message: "business found sucessfully", scope: 'business_name', keyword: `${input.keyword}`},
                        business_name: bnames
                    };
                } else {
                    return {
                        meta: {status: 204, message: "No business found", scope: 'business_name', keyword: `${input.keyword}`}

                    };
                }

            } catch (E) {
                logger.fileLogger.error(E);
                return {status: 500, error: E.message};
            }
        })());
    });
}

function getWebsite(input) {
    input.keyword = input.keyword.replace(/\s/g, '');
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("website") && input.scope.length !== 0)
                    return;
                var result = '';
//                input.country_code = input.country_code ? input.country_code : 'us';
//                input.listing_source = input.listing_source ? input.listing_source : 'public';

                if (input.listing_source === 'private') {
                    /*
                     * listing_source :private
                     */
                    if (input.listing_source === 'private' && !input.partner_id)
                        return {"status": 412, error: "partner id is required for private listings"};

                    result = await client.search({index: elastic_indexes['leads_with_url'],
                        type: elastic_types['leads_with_url'],
                        body: {
                            "size": 0,
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [
                                            {"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                                            {"term": {"business.buzz_partner_id": `${input.partner_id}`}}, //2102 or 2107 ...
                                            {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                                            {"match_phrase": {"business.website": `${input.keyword}`}}
                                        ]
                                    }
                                }
                            }, "aggs": {
                                "bname": {
                                    "terms": {
                                        "field": "business.website.raw"
                                        , "size": input.size_limit
                                    }
                                }
                            }
                        }
                    });

                } else {
                    /*
                     * listing_source :public
                     */
                    result = await client.search({index: elastic_indexes['leads_with_url'],
                        type: elastic_types['leads_with_url'],
                        body: {
                            "size": 0,
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [
                                            {"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                                            {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                                            {"match_phrase": {"business.website": `${input.keyword}`}}
                                        ]
                                    }
                                }
                            }, "aggs": {
                                "bname": {
                                    "terms": {
                                        "field": "business.website.raw"
                                        , "size": input.size_limit
                                    }
                                }
                            }
                        }
                    });
                }


                if (result.hits.total !== 0 && result) {
                    let bucketArray = result.aggregations.bname.buckets;
//                    let websites = _.pluck(bucketArray, 'key');
                    let websites = [];
                    _.each(bucketArray, (value) => {
                        websites.push({name: value.key, count: value.doc_count});
                    });
                    return {
                        meta: {status: 200, message: "websites found sucessfully", scope: 'website', keyword: `${input.keyword}`},
                        website: websites
                    };
                } else {
                    return {
                        meta: {status: 204, message: "No websites found", scope: 'website', keyword: `${input.keyword}`}

                    };
                }
            } catch (E) {
                console.log(E);
                logger.fileLogger.error(E);
                return {status: 500, error: E.message};
            }
        })());
    });
}
;

function getProducts(input) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("product") && input.scope.length !== 0)
                    return;
                return {
                    meta: {status: 204, message: "No Products found", scope: 'product', keyword: `${input.keyword}`}

                };
            } catch (E) {
                console.log(E);
                logger.fileLogger.error(E);
                return {status: 500, error: E.message};
            }
        })());
    });
}
function getCategories(input) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("category") && input.scope.length !== 0)
                    return;
                var result = "";
//                input.listing_source = input.listing_source ? input.listing_source : 'public';
//                input.category_type = input.category_type ? input.category_type : 'google';

                if (input.listing_source === 'private') {

                    /*
                     * for private
                     */
                    if (input.listing_source === 'private' && !input.partner_id)
                        return {"status": 412, error: "partner id is required for private listings"};

                    result = await client.search({index: elastic_indexes['category_index'],
                        type: elastic_types['category_index'],
                        body: {
                            "size": 0,
                            "query": {
                                "filtered": {
                                    "filter": {
                                        "and": [
                                            {
                                                "match_phrase": {
                                                    "category_name": `${input.keyword}`
                                                }
                                            },
                                            {
                                                "term": {
                                                    "partner_id": `${input.partner_id}`
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            "aggs": {
                                "bname": {
                                    "terms": {
                                        "field": "category_name.raw",
                                        "size": input.size_limit
                                    },
                                    "aggs": {"category_ids": {"top_hits": {"_source": {"include": ["category_id"]}, "size": 1}}}
                                }
                            }
                        }
                    });


                } else {
                    /*
                     * public
                     */
                    if (input.category_type === 'google') { //for default not category_type provided
                        console.log("google");
                        result = await client.search({index: elastic_indexes['category_index'],
                            type: elastic_types['category_index'],
                            body: {
                                "size": 0,
                                "query": {
                                    "filtered": {
                                        "filter": {
                                            "and": [
                                                {
                                                    "match_phrase": {
                                                        "google_category": `${input.keyword}`
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "status": 1
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "country_code": "us"
                                                    }
                                                },
                                                {
                                                    "missing": {
                                                        "field": "category_source"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                "aggs": {
                                    "bname": {
                                        "terms": {
                                            "field": "google_category.raw",
                                            "size": input.size_limit
                                        },
                                        "aggs": {"category_ids": {"top_hits": {"_source": {"include": ["category_id"]}, "size": 1}}}
                                    }
                                }
                            }
                        });
                    } else {
                        /*
                         * for other category_type ex:neustar
                         */
                        result = await client.search({index: elastic_indexes['category_index'],
                            type: elastic_types['category_index'],
                            body: {
                                "size": 0,
                                "query": {
                                    "filtered": {
                                        "filter": {
                                            "and": [
                                                {
                                                    "match_phrase": {
                                                        "category_name": `${input.keyword}`
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "status": 1
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "country_code": "us"
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "category_source": `${input.category_type}`
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                "aggs": {
                                    "bname": {
                                        "terms": {
                                            "field": "category_name.raw",
                                            "size": input.size_limit
                                        },
                                        "aggs": {"category_ids": {"top_hits": {"_source": {"include": ["category_id"]}, "size": 1}}}
                                    }
                                }
                            }
                        });
                    }
                }
                if (result.hits.total !== 0 && result) {
                    let bucketArray = result.aggregations.bname.buckets;
//                    let websites = _.pluck(bucketArray, 'key');
                    let categories = [];
                    _.each(bucketArray, (value) => {
                        categories.push({name: value.key, count: value.doc_count, category_id: value.category_ids.hits.hits[0]._source.category_id});
                    });
                    return {meta: {status: 200, message: "categories found sucessfully", scope: 'category', keyword: `${input.keyword}`},
                        category: categories};
                } else {
                    return {meta: {status: 204, message: "No categories found", scope: 'category', keyword: `${input.keyword}`}

                    };
                }

            } catch (E) {
                console.log(E);
                logger.fileLogger.error(E);
                return {status: 500, error: E.message};
            }
        })());
    });
}

function filter_array(test_array) {
    var index = -1,
            arr_length = test_array ? test_array.length : 0,
            resIndex = -1,
            result = [];

    while (++index < arr_length) {
        var value = test_array[index];

        if (value) {
            result[++resIndex] = value;
        }
    }

    return result;
}


module.exports = function (req, res) {
    (async function () {
        try {
            var sizeLimit = 200;
            if (!req.body) {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "request must have body");
                dbLogger.logRespTime(req.id, new Date());
                res.send({"status": 412, error: "request must have body", meta: {"request_reference_id": req.id}});
                return;
            }
            if (req.body && req.body.keyword) {
                let input = req.body;
                if (input.keyword.length >= 3) {

                    //listing_source
                    if (!input.listing_source) {
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "Param listing_source is missing", meta: {"request_reference_id": req.id}});
                        return;
                    } else if (!_.contains(listing_source, input.listing_source)) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "Param listing_source is must be public or private");
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "Param listing_source is must be public or private", meta: {"request_reference_id": req.id}});
                        return;
                    }



                    if (!input.country_code) {
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "Param country_code is missing", meta: {"request_reference_id": req.id}});
                        return;
                    } else if (!_.contains(countrie_list, input.country_code)) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), ` country_code ${input.country_code} is not avaialable`);
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: ` country_code ${input.country_code} is not avaialable`, meta: {"request_reference_id": req.id}});
                        return;
                    }


                    if (!input.category_type) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "Param category_type is missing");
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "Param category_type is missing", meta: {"request_reference_id": req.id}});
                        return;
                    } else if (!_.contains(categories, input.category_type)) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "category_type is must be either google or neustar");
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "category_type is must be either google or neustar ", meta: {"request_reference_id": req.id}});
                        return;
                    }

                    if (!input.scope) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "minimun one scope is needed");
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "minimun one scope is needed", meta: {"request_reference_id": req.id}});
                        return;
                    }

                    input.size_limit = input.size_limit ? input.size_limit : 4;
                    if (input.size_limit && input.size_limit > sizeLimit) {
                        input.size_limit = sizeLimit;

                    }

                    for (let scopevalue in input.scope) {
                        if (!_.contains(scopeList, input.scope[scopevalue])) {
                            dbLogger.setLogger(req.id, "ERROR", new Date(), `${input.scope[scopevalue]} is not a valid scope`);
                            dbLogger.logRespTime(req.id, new Date());
                            res.send({"status": 412, error: `${input.scope[scopevalue]} is not a valid scope`, meta: {"request_reference_id": req.id}});
                            return;
                        }
                    }



                    if (input.listing_source === 'private' && !input.partner_id) {
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "partner id is required for private listings");
                        dbLogger.logRespTime(req.id, new Date());
                        res.send({"status": 412, error: "partner id is required for private listings", meta: {"request_reference_id": req.id}});
                        return;
                    }


                    let result = await Promise.all([getBusinessName(input), getWebsite(input), getCategories(input), getProducts(input)]);


                    let finalResult = [];

                    finalResult = filter_array(result);
                    if (finalResult.length === 0) {
                        dbLogger.logRespTime(req.id, new Date());
                        dbLogger.setLogger(req.id, "ERROR", new Date(), "No data found");
                        res.send({status: 204, message: "No data found", meta: {"request_reference_id": req.id}});
                        return;
                    }
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({
                        status: 200,
                        data: finalResult,
                        meta: {
                            "request_reference_id": req.id
                        }

                    });
                    return;
                } else {
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "input letters should be more than or equal to 3");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({"status": 412, error: "input letters should be more than or equal to 3", meta: {"request_reference_id": req.id}});
                }
            } else {
                dbLogger.setLogger(req.id, "ERROR", new Date(), "params keyword is mandatory");
                dbLogger.logRespTime(req.id, new Date());
                res.send({"status": 412, error: "params keyword is mandatory", meta: {"request_reference_id": req.id}});
            }
        } catch (E) {
            dbLogger.setLogger(req.id, "ERROR", new Date(), E.message);
            logger.fileLogger.error(E);
            console.log(E);
            res.send({"status": 500, error: "something went wrong please try again", meta: {"request_reference_id": req.id}});
        }
    })();
};



