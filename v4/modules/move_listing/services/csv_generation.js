/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const MongoClient = require('mongodb').MongoClient;
var localDbUrl = "mongodb://data_root:xyz1$3^nhy7@104.197.218.69:27017/admin";
var json2csv = require('json2csv');
var fs = require('fs');
var MongoSettings = {
    source: {
        database: "test",
        collection: "leads_with_url"
    }

};

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

};



function getHeading(headingData) {
    for (let head in headingData) {
        if (headingData[head] > 0) {
            return "YES";
        }

    }
    return "NO";

}

var limit = 100;
(async function () {
    var local_connection = await MongoClient.connect(localDbUrl, {connectTimeoutMS: 90000, socketTimeoutMS: 90000});
    console.log("connection established");

    var source_dbo = local_connection.db(MongoSettings.source.database);
    var source_collection = source_dbo.collection(MongoSettings.source.collection);



    cursor = await source_collection.find({"domain_data.valid": 1}).limit(limit);
    var total_count = await cursor.count();
    console.log("totalcount ----", total_count);
    var count = 0;
    cursor.forEach(async (doc) => {
        if (doc !== null) {

            let recommended = {
                "fp_id": "",
                "google_mobile_friendly": "",
                "bb_responsive": "",
                "website": "",
                "buzz_score": "",
                "www_resolve": "",
                "robots_txt": "",
                "sitemap_xml": "",
                "title_tag_optimization": "",
                "location_in_title": "",
                "unique_title": "",
                "meta_description_optimization": "",
                "headings": "",
                "image_optimization": "",
                "no_frames_used": "",
                "no_flash_used": "",
                "text_content": "",
                "domain_age": "",
                "richsnippets": "",
                "friendly_urls": "",
                "sitemap_html": "",
                "facebook_business_page": "",
                "twitter_business_profile": "",
                "youtube_business_channel": "",
                "linkedin_company_profile": "",
                "googleplus_company_profile": "",
                "local_phone_number": "",
                "address_on_homepage": "",
                "map_directions": "",
                "blog": "",
                "contact_us": "",
                "privacy_policy": "",
                "gallery": "",
                "vs_about_page": "",
                "vs_services_page": "",
                "vs_contact_form": "",
                "vs_insurances_accepted": "",
                "vs_certifications": "",
                "vs_business_hours": "",
                "vs_faq": "",
                "vs_testimonials": "",
                "vs_new_cars_page": "",
                "vs_used_cars_page": "",
                "vs_search_form_home": "",
                "vs_twitter_feed_home": "",
                "news_letter": "",
                "videos": "",
                "page_redirects": "",
                "iswordpress": "",
                "ga_code": "",
                "secured_site": ""
            };
            recommended["fp_id"] = doc._id;




            for (let element in element_doc_key_mapper) {
                if (!recommended.hasOwnProperty(`${element}`)) {
                    continue;
                }
                if (doc["page_analysis"] && doc["page_analysis"][element_doc_key_mapper[element]]) {


                    if (element === "buzz_score") {

                        recommended[element] = doc["page_analysis"][element_doc_key_mapper[element]];
                        continue;
                    }


                    if (element === "headings") {
                        recommended[element] = getHeading(doc["page_analysis"][element_doc_key_mapper[element]]);
                        continue;
                    }


                    if (doc["page_analysis"][element_doc_key_mapper[element]]) {
                        recommended[element] = "YES";
                    } else {
                        recommended[element] = "NO";
                    }




                } else {
                    recommended[element] = "NO";
                }
            }


            if (doc["business"] && doc["business"]["website"]) {
                recommended["website"] = "YES";

            } else {
                recommended["website"] = "NO";
            }

            if (doc["business"] && doc["business"]["domain_established"]) {
                recommended["domain_age"] = "YES";

            } else {
                recommended["domain_age"] = "NO";
            }


            if (doc["fp_score"] && doc["fp_score"]["seo_analysis"] && doc["fp_score"]["seo_analysis"]["count"]) {
                recommended["seo_elements_score"] = doc["fp_score"]["seo_analysis"]["count"];
            } else {
                recommended["seo_elements_score"] = "NO";
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



            recommended["social_media_count"] = facebook_likes + face_book_checkins + tweet_followers;

            recommended["recommended_products"] = doc["recommended_products"]["product_names"];

            await writeData(recommended);
            count = count + 1;

            if (count % 100 === 0) {
                console.log("count--", count);
            }

            if (count === limit) {
                console.log("ALL DONE!");
                process.exit(0);
            }
        }
    });

})();


function writeData(elements_withValues) {
    return new Promise((resolve, reject) => {
        var dyNamicFileName = "product_recommendation_sample.csv";
        var newLine = "\r\n";
        var fields = Object.keys(elements_withValues);
        var appendThis = [
            elements_withValues
        ];

        var toCsv = {
            data: appendThis,
            fields: fields,
            hasCSVColumnTitle: false
        };

        var csv = json2csv(toCsv) + newLine;

        fs.stat(dyNamicFileName, function (err, stat) {
            if (err == null) {

                var csv = json2csv(toCsv) + newLine;

                fs.appendFile(dyNamicFileName, csv, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true)
                    }


                });
            } else {

                fields = (fields + newLine);

                fs.writeFile(dyNamicFileName, fields, function (err, stat) {
                    if (err)
                        throw err;
                    var csv = json2csv(toCsv) + newLine;

                    fs.appendFile(dyNamicFileName, csv, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(true)
                        }


                    });
                });
            }
        });
    });
}

