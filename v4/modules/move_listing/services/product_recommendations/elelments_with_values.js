var util = require('util');
module.exports = function (doc) {
    var elements_withValues = {};
    var element_doc_key_mapper = {
        "google_mobile_friendly": "google_mobile_friendly",
        "bb_responsive": "bb_responsive",
        "www_resolve": "www_resolve",
        "robots_txt": "robots",
        "sitemap_xml": "sitemap_xml",
        "title_tag_optimization": "title_tag_compliance",
        "location_in_title": "location_in_title",
        "unique_title": "unique_title",
        "meta_description_optimization": "page_meta_description_compliance",
        "headings": "headings_data",
        "image_optimization": "image_optimization",
        "no_frames_used": "iframe_count",
        "no_flash_used": "flash_count",
        "text_content": "text_content",
        "domain_age": "domain_established",
        "richsnippets": "rich_snippets",
        "friendly_urls": "seo_friendly_url",
        "sitemap_html": "sitemap_html",
        "page_redirects": "page_redirects",
        "iswordpress": "wordpress",
        "ga_code": "google_analytics",
        "secured_site": "secured_site",
        "local_phone_number": "local_phone",
        "address_on_homepage": "address_on_page",
        "map_directions": "map",
        "blog": "blog",
        "contact_us": "contact_page",
        "privacy_policy": "privacy_policy",
        "gallery": "gallery",
        "vs_about_page": "about_page",
        "vs_services_page": "services_page",
        "vs_contact_form": "contact_form",
        "vs_insurances_accepted": "insurances_accepted",
        "vs_certifications": "certifications",
        "vs_business_hours": "business_hours",
        "vs_faq": "faq",
        "vs_testimonials": "testimonials",
        "vs_new_cars_page": "new_cars_page",
        "vs_used_cars_page": "used_cars_page",
        "vs_search_form_home": "inventory_search_form",
        "vs_twitter_feed_home": "twitter_feed_home",
        "news_letter": "newsletter",
        "videos": "video",
        "facebook_business_page": "facebook_page",
        "twitter_business_profile": "twitter_page",
        "youtube_business_channel": "youtube_page",
        "linkedin_company_profile": "linkedin_page",
        "buzz_score": "opportunity_score",
        "pagespeed_score": "pagespeed_score",
        "caching_enabled": "cache_enabled",
        "robustness_image_optimization": "image_optimization",
        "file_compression": "file_compression",
        "speed_optimized": "web_speed_optimized",
        "prioritize_visible_content": "prioritize_visible_content",
        "backlinks": "backlinks",
        "google_page_rank": "google_pagerank",
        "trustflow": "trustflow",
        "googleplaces": "googleplaces",
        "foursquare": "foursquare",
        "googleplus_company_profile": "google_plus"

    }
    for (let element in element_doc_key_mapper) {
        if (doc["page_analysis"] && doc["page_analysis"][element_doc_key_mapper[element]]) {
            elements_withValues[element] = doc["page_analysis"][element_doc_key_mapper[element]]
            if (element === "headings") {
                elements_withValues[element] = getHeading(doc["page_analysis"][element_doc_key_mapper[element]])
            }
        } else {
            elements_withValues[element] = 0;
        }






    }
    if (doc["business"] && doc["business"]["website"]) {
        elements_withValues["website"] = 1

    } else {
        elements_withValues["website"] = 0;
    }

    if (doc["business"] && doc["business"]["domain_established"]) {
        elements_withValues["domain_age"] = 1;

    } else {
        elements_withValues["website"] = 0;
    }

    if (doc["business"] && doc["business"]["website"]) {
        elements_withValues["website"] = 1

    } else {
        elements_withValues["website"] = 0
    }

    if (doc["fp_score"] && doc["fp_score"]["seo_analysis"] && doc["fp_score"]["seo_analysis"]["count"]) {
        elements_withValues["seo_elements_score"] = doc["fp_score"]["seo_analysis"]["count"];
    } else {
        elements_withValues["seo_elements_score"] = 0;
    }

    var facebook_likes = 0, face_book_checkins = 0, tweet_followers = 0;

    


    if (doc["social"] && doc["social"]["facebook"]) {


        if (doc["social"] && doc["social"]["facebook"].constructor === Array) {

            if (doc["social"]["facebook"][0] && doc["social"]["facebook"][0]["likes"]) {
                facebook_likes = doc["social"]["facebook"][0]["likes"];
            }

        } else if (doc["social"] && doc["social"]["facebook"].constructor === Object) {

            if (doc["social"]["facebook"]["likes"]) {
                facebook_likes = doc["social"]["facebook"]["likes"];
            }
        }
    }
    
    
    if (doc["social"] && doc["social"]["facebook"]) {


        if (doc["social"] && doc["social"]["facebook"].constructor === Array) {

            if (doc["social"]["facebook"][0] && doc["social"]["facebook"][0]["checkins"]) {
                face_book_checkins = doc["social"]["facebook"][0]["checkins"];
            }

        } else if (doc["social"] && doc["social"]["facebook"].constructor === Object) {

            if (doc["social"]["facebook"]["checkins"]) {
                face_book_checkins = doc["social"]["facebook"]["checkins"];
            }
        }
    }


    

    /*  if (doc["social"] && doc["social"]["facebook"] && doc["social"]["facebook"]["posts_count"]){
     facebook_posts = doc["social"]["facebook"]["posts_count"]
     }
     if (doc["social"] && doc["social"]["twitter"] && doc["social"]["twitter"]["statuses_count"]){
     twitter_tweets = doc["social"]["twitter"]["statuses_count"]
     }
     } */


    if (doc["social"] && doc["social"]["twitter"]) {

        if (doc["social"] && doc["social"]["twitter"].constructor === Array) {

            if (doc["social"]["twitter"][0] && doc["social"]["twitter"][0]["followers_count"]) {
                tweet_followers = doc["social"]["twitter"][0]["followers_count"];
            }

        } else if (doc["social"] && doc["social"]["twitter"].constructor === Object) {

            if (doc["social"]["twitter"]["followers_count"]) {
                tweet_followers = doc["social"]["twitter"]["followers_count"];
            }
        }
    }



    elements_withValues["social_media_count"] = facebook_likes + face_book_checkins + tweet_followers;

//
//
//??yahoo_local,citysearch,yellow_pages,bing_local,nokia_places,googleplus_company_profile,foursquare_profile
//
//console.log("elements_withValues ",elements_withValues)
    return elements_withValues;
};

function getHeading(headingData) {
    for (let head in headingData) {
        if (headingData[head] > 0) {
            return 1;
        }

    }
    return 0;

}