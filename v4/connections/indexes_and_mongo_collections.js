/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var elastic_indexes = {
    'leads_with_url': "dp_projects",
    'leads_without_url': "dp_business",
    'facebook_posts_data': "dp_facebook_posts",
    'twitter_posts_data': "dp_twitter_posts",
    'google_posts_data': "dp_google_posts",
    'yext_info': "dp_yext_info",
    'brand_mentions_data': "dp_brand_mentions_data",
    'adwords_data': "dp_adwords_data",
    'category_index': "dp_category",
    'bing_adwords_data': "dp_bing_adwords_data",
    'display_adbeat_data': "dp_display_adbeat_data",
    'projects_autosuggestion': "dp_projects_autosuggestion",
    'refined_projects': "dp_refined_projects"

};
var elastic_types = {
    'leads_with_url': "projects",
    'leads_without_url': "business",
    'facebook_posts_data': "facebook_posts",
    'twitter_posts_data': "twitter_posts",
    'google_posts_data': "google_posts",
    'yext_info': "yext_info",
    'brand_mentions_data': "brand_mentions_data",
    'adwords_data': "adwords_data",
    'category_index': "category",
    'bing_adwords_data': "bing_adwords_data",
    'display_adbeat_data': "display_adbeat_data",
    'projects_autosuggestion': 'projects',
    'refined_projects': "refined_projects"
};


var version_elastic_indexes = {
    'leads_with_url': "version_projects",
    'leads_without_url': "version_business",
    'yext_info': "version_yext_info",
    'brand_mentions_data': "version_brand_mentions_data",
    'adwords_data': "version_adwords_data",
    'bing_adwords_data': "version_bing_adwords_data",
    'display_adbeat_data': "version_display_adbeat_data",
};
var version_elastic_types = {
    'leads_with_url': "projects",
    'leads_without_url': "business",
    'yext_info': "yext_info",
    'brand_mentions_data': "brand_mentions_data",
    'adwords_data': "adwords_data",
    'facebook_posts_data': "facebook_posts_data",
    'twitter_posts_data': "twitter_posts_data",
    'google_posts_data': "google_posts_data",
    'bing_adwords_data': "bing_adwords_data",
    'display_adbeat_data': "display_adbeat_data",
};

var mongo_databases = {
    "staging_master": "data_us",
    "staging_child": "analysis_engine_db",
    "live_master": "live_analysis_engine_db",
    "live_ds": "ds",
    "live_child": "live_analysis_engine_db",
    "versioning": "versioned_analysis_engine_db",
    "api_log_db": "api_logs"
};
var staging_mongo_collections = {
    'leads_with_url': "leads_with_url",
    'leads_without_url': "leads_without_url",
    'facebook_posts_data': "facebook_posts_data",
    'twitter_posts_data': "twitter_posts_data",
    'google_posts_data': "google_posts_data",
    'yext_info': "yext_info",
    'brand_mentions_data': "brand_mentions_data",
    'adwords_data': "adwords_data",
    'bing_adwords_data': "bing_adwords_data",
    'display_adbeat_data': "display_adbeat_data",
};

var live_mongo_collections = {
    'leads_with_url': "leads_with_url",
    'leads_without_url': "leads_without_url",
    'facebook_posts_data': "facebook_posts_data",
    'twitter_posts_data': "twitter_posts_data",
    'google_posts_data': "google_posts_data",
    'yext_info': "yext_info",
    'brand_mentions_data': "brand_mentions_data",
    'adwords_data': "adwords_data",
    'bing_adwords_data': "bing_adwords_data",
    'display_adbeat_data': "display_adbeat_data",
};

var version_mongo_collections = {
    'leads_with_url': "leads_with_url",
    'leads_without_url': "leads_without_url",
    'facebook_posts_data': "facebook_posts_data",
    'twitter_posts_data': "twitter_posts_data",
    'google_posts_data': "google_posts_data",
    'yext_info': "yext_info",
    'brand_mentions_data': "brand_mentions_data",
    'adwords_data': "adwords_data",
    'bing_adwords_data': "bing_adwords_data",
    'display_adbeat_data': "display_adbeat_data"
};

if (process.env.NODE_ENV === 'production') {

    var API_END_POINT = "https://api.discover-prospects.com:8086"; //107.21.99.225

} else if (process.env.NODE_ENV === 'development') {

    var API_END_POINT = "http://107.22.170.45:8086"; //107.22.170.45

} else if (process.env.NODE_ENV === 'staging') {

    var API_END_POINT = "http://digitalscape.discoverprospects.com:8086"; //104.197.251.69
} else {

    var API_END_POINT = "http://digitalscape.discoverprospects.com:8086"; //104.197.251.69
}




module.exports.elastic_indexes = elastic_indexes;
module.exports.version_elastic_indexes = version_elastic_indexes;
module.exports.elastic_types = elastic_types;
module.exports.version_elastic_types = version_elastic_types;
module.exports.mongo_databases = mongo_databases;
module.exports.staging_mongo_collections = staging_mongo_collections;
module.exports.live_mongo_collections = live_mongo_collections;
module.exports.version_mongo_collections = version_mongo_collections;
module.exports.API_END_POINT = API_END_POINT;