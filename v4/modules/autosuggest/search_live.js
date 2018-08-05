


if (process.env.NODE_ENV === 'production') {
    var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient;
} else {
    var client = require(`${__v4root}/connections/elastic_connections.js`).localclient;
}
var util = require("util")
//var client = require(`${__v4root}/connections/elastic_connections.js`).liveclient_9800;
var _ = require('underscore');
var dbLogger = require(__dblogger);
/*
 * To listen the event emitters listening from all modules through 
 * out the flow and we use the reqID for reference for each request
 *
 */
var live_database_conn = require(__base).live_database;
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`)
var live_ds = live_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["live_ds"]);

var logger = require(__base);
const customAsync = require('async');
var countrie_list = ["us", "gb", "ca", "nz", "uk", "au"];

var product_with_ids = {'website design': {"name": "Website Design", "id": 1},
    'social media presence': {"name": 'Social Media Presence', "id": 2},
    'seo': {"name": 'SEO', "id": 3},
    'seo maintenance': {"name": 'SEO Maintenance', "id": 4},
    'social conversation': {"name": 'Social Conversation', "id": 5},
    'pay per click': {"name": 'Pay per click', "id": 6},
    'display dds': {"name": 'Display Ads', "id": 7}};

var location_scope = ["region", "locality", "dma_region"];
var scopeList = ["category", "website", "business_name", "product"];
var listing_source = ["public", "private"];
var categories = ["neustar", "google"];
var elastic_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_indexes;
var elastic_types = require(`${__v4root}/connections/indexes_and_mongo_collections.js`).elastic_types;


function prepareLocationQuery(location_keyword, location_scope) {

    var query_word = "address" + `.${location_scope}.sort`;
    var eachQuery = {
        "match_phrase": {}
    };
    eachQuery["match_phrase"][`${query_word}`] = location_keyword;
    return eachQuery;
}


function productWithIdsList() {
    return new Promise(async (resolve, reject) => {
        try {
            var product_list = live_ds.collection("recommended_product_list");
            var productArray = await product_list.find({}).toArray();
            var productsObject = {};
            if (productArray.length !== 0) {
                for (let product of productArray) {
                    productsObject[`${product.title.toLocaleLowerCase()}`] = product;
                }
                resolve(productsObject);
            } else {
                reject(new Error("No Products Found"));
            }
        } catch (E) {
            reject(E);
        }
    });
}

var toTitleCase = function (str) {
	str = str.toLowerCase().split(' ');
	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
	}
	return str.join(' ');
};

function getBusinessName(input) {
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("business_name") && input.scope.length !== 0)
                    return;
                var business_keyword_full = input.keyword;
                var business_keyword_modified = business_keyword_full.split(" ")
                var bname_split_length = business_keyword_modified.length;

                var result = '';
                var final_elastic_query = "";
                let sub_query = [{"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                    {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                    {"match_phrase": {"business.name.autocomplete": business_keyword_full}}]


                if (input.location_keyword && input.location_scope) {
                    sub_query.push(prepareLocationQuery(input.location_keyword, input.location_scope));
                }
                if (bname_split_length > 1) {
                    business_keyword_modified.splice(-1, 1);
                    business_keyword_modified = business_keyword_modified.join(" ");
                    sub_query.push({"match_phrase": {"business.name": business_keyword_modified}})
                }
                if (input.listing_source === 'private') { // listing_source :private
                    sub_query.push({"term": {"business.buzz_partner_id": `${input.partner_id}`}})

                }

                final_elastic_query = getFullBusinessNameQuery(sub_query, input.size_limit, business_keyword_full)

                result = await client.search({index: elastic_indexes['leads_with_url'] + "," + elastic_indexes['leads_without_url'],
                    type: elastic_types['leads_with_url'] + "," + elastic_types['leads_without_url'],
                    body: final_elastic_query
                });


                if (result && result.hits.total !== 0) {
                    let likebucketArray = result.aggregations.bnames.buckets.like.bname.buckets;
                    let havingbucketArray = result.aggregations.bnames.buckets.having.bname.buckets;
                    let bnames = [];
                    _.each(likebucketArray, (value) => {
                        bnames.push({name: value.business_name.hits.hits[0]._source.business.name, count: value.doc_count});
//                        categories.push({name: value.category_ids.hits.hits[0]._source.google_category , count: value.doc_count, category_id: value.category_ids.hits.hits[0]._source.category_id});
                    });
                    if (bnames.length < input.size_limit) {
                        for (var havingbucket in havingbucketArray) {
                            bnames.push({name: havingbucketArray[havingbucket].business_name.hits.hits[0]._source.business.name, count: havingbucketArray[havingbucket].doc_count});
                            if (bnames.length == input.size_limit) {
                                break
                            }
                        }
                    }

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
    let website_keyword_full = input.keyword.replace(/\s/g, '');
    return new Promise((resolve, reject) => {
        resolve((async function () {
            try {
                if (input.scope && !input.scope.includes("website") && input.scope.length !== 0)
                    return;
                var result = '';



                let subQuery = [
                    {"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                    {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                    {"match_phrase": {"domain_data.hostname.like_search": website_keyword_full}}
                ];


                if (input.location_keyword && input.location_scope) {
                    subQuery.push(prepareLocationQuery(input.location_keyword, input.location_scope));
                }

                if (input.listing_source === 'private') { // listing_source :private

                    subQuery.push({"term": {"business.buzz_partner_id": `${input.partner_id}`}}) //2102 or 2107 ...
                }

                result = await client.search({index: elastic_indexes['leads_with_url'],
                    type: elastic_types['leads_with_url'],
                    body: getFullWebsiteQuery(subQuery, input.size_limit)
                });

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
                if (input.scope && !input.scope.includes("product") && input.scope.length !== 0) {
                    return;
                }

                var result = '';

                var product_keyword_full = input.keyword.toLocaleLowerCase();
                var product_keyword_modified = product_keyword_full.split(" ");
                var product_split_length = product_keyword_modified.length;

                var subQuery = [{"term": {"address.country_code": `${input.country_code}`}}, //us or gb or au ..
                    {"match_phrase": {"business.listing_source": `dp_${input.listing_source}`}}, //dp_public or dp_private
                    {"match_phrase": {"recommended_products.autocomplete": product_keyword_full}}]

                if (input.location_keyword && input.location_scope) {
                    subQuery.push(prepareLocationQuery(input.location_keyword, input.location_scope));
                }

                if (product_split_length > 1) {
                    product_keyword_modified.splice(-1, 1);
                    product_keyword_modified = product_keyword_modified.join(" ");
                    subQuery.push({"match_phrase": {"recommended_products": product_keyword_modified}})
                }
                if (input.listing_source === 'private') { // listing_source :private

                    subQuery.push({"term": {"business.buzz_partner_id": `${input.partner_id}`}}) //2102 or 2107 ...
                }

                result = await client.search({index: elastic_indexes['leads_with_url'],
                    type: elastic_types['leads_with_url'],
                    body: getFullProductQuery(subQuery, input.size_limit, product_keyword_full)
                });


                if (result && result.hits.total !== 0) {
                    let likebucketArray = result.aggregations.like.buckets;
                    let havingbucketArray = result.aggregations.having.buckets;
                    let products = [];
                    let  product_with_ids = await productWithIdsList();
//                    console.log(util.inspect(product_with_ids));
                    _.each(likebucketArray, (value) => {

                        if (!product_with_ids[value.key]) {
                            throw new Error(`No Products found with ${value.key}`);
                        }
                        products.push({name: product_with_ids[value.key].title, count: value.doc_count, product_id: product_with_ids[value.key].product_id});
//                        categories.push({name: value.category_ids.hits.hits[0]._source.google_category , count: value.doc_count, category_id: value.category_ids.hits.hits[0]._source.category_id});
                    });
                    if (products.length < input.size_limit) {
                        for (var havingbucket in havingbucketArray) {
                            products.push({name: product_with_ids[havingbucketArray[havingbucket].key].title, count: havingbucketArray[havingbucket].doc_count, product_id: product_with_ids[havingbucketArray[havingbucket].key].product_id});
                            if (products.length === input.size_limit) {
                                break;
                            }
                        }
                    }


                    if (products.length === 0) {
                        return {
                            meta: {status: 204, message: "No products found", scope: 'product', keyword: `${input.keyword}`}

                        };
                    } else {

                        return {
                            meta: {status: 200, message: "products found sucessfully", scope: 'product', keyword: `${input.keyword}`},
                            product: products
                        };
                    }
                } else {
                    return {
                        meta: {status: 204, message: "No products found", scope: 'product', keyword: `${input.keyword}`}

                    };
                }

            } catch (E) {
                console.log(E);
                logger.fileLogger.error(E);
                return {status: 500, error: E.message, lineNumber: E.lineNumber};
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
                var category_keyword_full = input.keyword;
                var category_keyword_modified = category_keyword_full.split(" ")
                category_split_length = category_keyword_modified.length;
                var result = "";

                let subQuery = []
                let isGoogle = false
                if (category_split_length > 1) {
                    category_keyword_modified.splice(-1, 1);
                    category_keyword_modified = category_keyword_modified.join(" ");
                }
                if (input.listing_source === 'private') {

                    subQuery.push({"match_phrase": {"category_name.autocomplete": category_keyword_full}})
                    subQuery.push({"term": {"partner_id": `${input.partner_id}`}})
                    if (category_split_length > 1) {
                        subQuery.push({"match_phrase": {"category_name": category_keyword_modified}})
                    }
                } else {
                    /*
                     * public
                     */

                    subQuery.push({"match_phrase": {"country_code": `${input.country_code}`}})
                    subQuery.push({"match_phrase": {"status": 1}})

                    if (input.category_type === 'google') { //for default not category_type provided
                        console.log("google");
                        isGoogle = true;
                        subQuery.push({"match_phrase": {"google_category.autocomplete": category_keyword_full}})
                        if (category_split_length > 1) {
                            subQuery.push({"match_phrase": {"google_category": category_keyword_modified}})
                        }

                        subQuery.push({"missing": {"field": "category_source"}})
                    } else {
                        /*
                         * for other category_type ex:neustar
                         */
                        subQuery.push({"match_phrase": {"category_name.autocomplete": category_keyword_full}})
                        if (category_split_length > 1) {
                            subQuery.push({"match_phrase": {"category_name": category_keyword_modified}})
                        }

                        subQuery.push({"term": {"category_source": `${input.category_type}`}})



                    }
                }
                result = await client.search({index: elastic_indexes['category_index'],
                    type: elastic_types['category_index'],
                    body: getFullQueryCategory(subQuery, input.size_limit, category_keyword_full, isGoogle)
                });
                if (result.hits.total !== 0 && result) {
                    let likebucketArray = result.aggregations.bnames.buckets.like.bname.buckets;
                    let havingbucketArray = result.aggregations.bnames.buckets.having.bname.buckets;
//                    let bnames = _.pluck(bucketArray, 'key');
                    let categories = [];
                    _.each(likebucketArray, (value) => {
                        if (isGoogle)
                            categories.push({name: toTitleCase(value.category_ids.hits.hits[0]._source.google_category), count: value.doc_count, category_id: value.category_ids.hits.hits[0]._source.category_id});
                        else
                            categories.push({name: toTitleCase(value.category_ids.hits.hits[0]._source.category_name), count: value.doc_count, category_id: value.category_ids.hits.hits[0]._source.category_id});
                    });
                    if (categories.length < input.size_limit) {
                        for (var havingbucket in havingbucketArray) {

                            console.log(util.inspect(havingbucketArray[havingbucket], false, null))
                            if (isGoogle) {
                                categories.push({name: toTitleCase(havingbucketArray[havingbucket].category_ids.hits.hits[0]._source.google_category), count: havingbucketArray[havingbucket].doc_count, category_id: havingbucketArray[havingbucket].category_ids.hits.hits[0]._source.category_id});
                            } else {
                                categories.push({name: toTitleCase(havingbucketArray[havingbucket].category_ids.hits.hits[0]._source.category_name), count: havingbucketArray[havingbucket].doc_count, category_id: havingbucketArray[havingbucket].category_ids.hits.hits[0]._source.category_id});
                            }
                            if (categories.length === input.size_limit) {
                                break
                            }
                        }
                    }



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
                if (input.keyword.length >= 2) {

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

                    if (input.location_scope) {
                        if (!input.location_keyword) {
                            res.send({"status": 412, error: "location_keyword must provide for location scope ", meta: {"request_reference_id": req.id}});
                            return;
                        }
                        if (!_.contains(location_scope, input.location_scope)) {
                            res.send({"status": 412, error: "location_scope must be either region, locality, dma_region ", meta: {"request_reference_id": req.id}});
                            return;
                        }

                    } else if (input.location_keyword) {


                        res.send({"status": 412, error: "location_scope must provide for location_keyword ", meta: {"request_reference_id": req.id}});
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
                    console.log("SIZE LIMIT ======", input.size_limit);
                    dbLogger.setLogger(req.id, "SIZE_COUNT", new Date(), input.size_limit);
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
                    dbLogger.setLogger(req.id, "ERROR", new Date(), "input letters should be more than or equal to 2");
                    dbLogger.logRespTime(req.id, new Date());
                    res.send({"status": 412, error: "input letters should be more than or equal to 2", meta: {"request_reference_id": req.id}});
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
function getFullQueryCategory(andQueryArray, size, category_keyword_full, isGoogle) {
//    console.log("andQieryArray ",andQieryArray)
    let fieldName = ""
    let query;
    if (isGoogle) {
        fieldName = "google_category.sort"
        query = {
            "size": 0,
            "query": {
                "filtered": {
                    "filter": {
                        "and": andQueryArray
                    }
                }
            },
            "aggs": {
                "bnames": {
                    "filters": {
                        "filters": {
                            "like": {"match_phrase": {"google_category.like_search": category_keyword_full}},
                            "having": {"not": {"match_phrase": {"google_category.like_search": category_keyword_full}}}
                        }
                    }, "aggs": {
                        "bname": {
                            "terms": {
                                "field": fieldName,
                                "size": size,
                                "order": {"_term": "asc"}
                            },
                            "aggs": {"category_ids": {"top_hits": {"_source": {"include": ["google_category", "category_id"]}, "size": size}}}
                        }
                    }
                }
            }
        }
    } else {
        fieldName = "category_name.sort"
        query = {
            "size": 0,
            "query": {
                "filtered": {
                    "filter": {
                        "and": andQueryArray
                    }
                }
            },
            "aggs": {
                "bnames": {
                    "filters": {
                        "filters": {
                            "like": {"match_phrase": {"category_name.like_search": category_keyword_full}},
                            "having": {"not": {"match_phrase": {"category_name.like_search": category_keyword_full}}}
                        }
                    }, "aggs": {
                        "bname": {
                            "terms": {
                                "field": fieldName,
                                "size": size,
                                "order": {"_term": "asc"}
                            },
                            "aggs": {"category_ids": {"top_hits": {"_source": {"include": ["category_name", "category_id"]}, "size": 1}}}
                        }
                    }
                }
            }
        }
    }


    return query;
}
function getFullBusinessNameQuery(andQueryArray, size, business_keyword_full) {
//    console.log("andQieryArray ",andQieryArray)

    let query = {
        "size": 0,
        "query": {
            "filtered": {
                "filter": {
                    "and": andQueryArray
                }
            }
        },
        "aggs": {
            "bnames": {
                "filters": {
                    "filters": {
                        "like": {"match_phrase": {"business.name.like_search": business_keyword_full}},
                        "having": {"not": {"match_phrase": {"business.name.like_search": business_keyword_full}}}
                    }
                },
                "aggs": {
                    "bname": {
                        "terms": {
                            "field": "business.name.sort",
                            "size": size,
                            "order": {"_term": "asc"}
                        },
                        "aggs": {"business_name": {"top_hits": {"_source": {"include": ["business.name"]}, "size": 1}}}
                    }
                }
            }
        }

    };
    return query;
}



function getFullProductQuery(andQueryArray, size, product_keyword_full) {
//    console.log("andQieryArray ",andQieryArray)

    let query = {
        "size": 0,
        "query": {
            "filtered": {
                "filter": {
                    "and": andQueryArray
                }
            }
        },
        "aggs": {
            "having": {
                "terms": {
                    "field": "recommended_products.sort",
                    "size": size,
                    "include": `${product_keyword_full}.*`,
                    "order": {"_term": "asc"}
                }
//                        "aggs": {"recommended_products": {"top_hits": {"_source": {"include": ["recommended_products"]}, "size": 1}}}
            },
            "like": {
                "terms": {
                    "field": "recommended_products.sort",
                    "size": size,
                    "include": `[^^].*${product_keyword_full}.*`,
                    "order": {"_term": "asc"}
                }
//                        "aggs": {"recommended_products": {"top_hits": {"_source": {"include": ["recommended_products"]}, "size": 1}}}
            }
        }
    };
    return query;
}


function getFullWebsiteQuery(andQueryArray, size) {
//    console.log("andQieryArray ",andQieryArray)

    let query = {
        "size": 0,
        "query": {
            "filtered": {
                "filter": {
                    "and": andQueryArray
                }
            }
        }, "aggs": {
            "bname": {
                "terms": {
                    "field": "domain_data.hostname.sort"
                    , "size": size
                }
            }
        }
    }
    return query;
}