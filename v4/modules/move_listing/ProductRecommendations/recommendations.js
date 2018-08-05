var dbLogger = require(__dblogger);
var local_database_conn = require(__base).local_database;
var ObjectId = require('mongodb').ObjectId;
var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_data_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var elelments_with_values = require("./elelments_with_values.js")
module.exports = function (reqId, fp_id, collection) {
    return new Promise(async function (resolve, reject) {
        try {
            //            var products = ["Website Design", "Responsive Website Design", "Social Media Presence", "SEO", "SEO Maintenance", "Social Conversation", "Pay Per Click", "Display Ads", "Directory Listings", "Reputation Management"]
            var products = {1: "Website Design", 2: "Social Media Presence", 3: "SEO", 4: "SEO Maintenance", 5: "Social Conversation", 6: "Pay Per Click", 7: "Display Ads", 8: "Responsive Website Design"}
            var recommended_products = [];

            if (!reqId) {
                let text = `reqId is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "RECOMMENDATION_ERROR", new Date(), text);
                reject(new Error(text));
            }
            if (!fp_id) {
                let text = `reqId is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "RECOMMENDATION_ERROR", new Date(), text);
                reject(new Error(text));
            }

            if (!collection) {
                let text = `collection_name is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "RECOMMENDATION_ERROR", new Date(), text);
                reject(new Error(text));
            }
            doc = await getDoc(fp_id, collection);
            var elements_values_obj = elelments_with_values(doc)
//            console.log("elements_valuse_obj ",elements_valuse_obj)

            /*checking recommendation logic for Website Design product*/

            if (!elements_values_obj["website"]) {
                recommended_products.push({product_id: 1, elements: ""})

            }


            /*checking recommendation logic for Directory Listings product*/
//            checkDirectoryListing(elements_values_obj, recommended_products)

            /*checking recommendation logic for Social Media Presense product*/
            checkSocialMediaPresense(elements_values_obj, recommended_products)

            /*checking recommendation logic for SEO product*/
            checkSEO(elements_values_obj, recommended_products)

            /*checking recommendation logic for SEO Maintinenece product*/
            checkSEOMaintinence(elements_values_obj, recommended_products)

            /*checking recommendation logic for Social Conversation product*/
            checkSocialConversation(elements_values_obj, recommended_products)



            /*checking recommendation logic for Reputation Managemen product*/
//            checkReputationManagement(elements_values_obj, recommended_products)

            /*checking recommendation logic for Reputation Managemen product*/
            checkPayPerClick(elements_values_obj, recommended_products)

            /*checking recommendation logic for Display Ads product*/
            checkDisplayAds(elements_values_obj, recommended_products)

            /*checking recommendation logic for Responsive Web Design product*/
            checkResponsiveWebdsign(elements_values_obj, recommended_products)

            var recommended_product_ids = recommended_products.map(item => item.product_id)
            var recommended_product_names = recommended_products.map(item => products[item.product_id])
            var final_recommended_obj = {product_ids: recommended_product_ids, product_names: recommended_product_names, product_details: recommended_products}
            //need to update recommended products into collection by fp id

            var updateObject = doc;
            if (updateObject["recommended_products_details"])
                delete updateObject["recommended_products_details"];
            updateObject["recommended_products"] = final_recommended_obj;
            await updateRecommended_product(reqId, updateObject, collection)

            dbLogger.move_data_api_log_setLogger(reqId, "RECOMMENDED_PRODUCTS", new Date(), final_recommended_obj);
            resolve(final_recommended_obj);
        } catch (Exception) {
            console.log("Exception ", Exception)
            dbLogger.move_data_api_log_setLogger(reqId, "RECOMMENDATION_ERROR", new Date(), Exception.message);
            reject(new Error(Exception.message));
        }



    });


}

/*Responsive Website Design logic checking*/

function checkResponsiveWebdsign(elements_values_obj, recommended_products) {

    try {
        var website_not_present;

        if (!elements_values_obj["website"])
            website_not_present = true;

        let social_media_presense_count = elements_values_obj["social_media_count"];
        let final_recommended_elements = [];
        let contenet_analysis_elements_presence_details = get_elements_presents_details(elements_values_obj, Content_Analysis_elements)
        let infrastructure_elements_presence_details = get_elements_presents_details(elements_values_obj, InfraStructure_elements)
        let seo_analysis_elements_presence_details = get_elements_presents_details(elements_values_obj, SEO_Elements)
        let seo_analysis_elements_score = elements_values_obj["seo_elements_score"];

        let not_mobile_friendly;
        if (!elements_values_obj["google_mobile_friendly"])
            not_mobile_friendly = true;
        let not_responsive;

        if (!elements_values_obj["bb_responsive"])
            not_responsive = true;

        if (contenet_analysis_elements_presence_details["elements"])
            final_recommended_elements.push(contenet_analysis_elements_presence_details.elements)

        if (infrastructure_elements_presence_details["elements"])
            final_recommended_elements.push(infrastructure_elements_presence_details.elements)
//
        if (seo_analysis_elements_presence_details["elements"])
            final_recommended_elements.push(seo_analysis_elements_presence_details.elements)

        if ((website_not_present && social_media_presense_count >= 30)

                || (contenet_analysis_elements_presence_details.count <= 5 &&
                        infrastructure_elements_presence_details.count <= 5 &&
                        seo_analysis_elements_score <= 5)

                || (not_mobile_friendly && not_responsive && seo_analysis_elements_presence_details.count <= 7)) {
//                        recommended_products.push({product_id: 10, elements: final_recommended_elements,presenece_count:seo_analysis_elements_presence_details.count})
            recommended_products.push({product_id: 8, elements: final_recommended_elements})
        }
    } catch (Exception) {
        throw Exception;
    }
}

/*Social Media Presense logic checking*/

function checkSocialMediaPresense(elements_values_obj, recommended_products) {

    try {
        let social_media_presence_details = get_elements_presents_details(elements_values_obj, Social_Media_Presence_Elements)

        if (social_media_presence_details.count <= 3) {
//            recommended_products.push({product_id: 2, elements: social_media_presence_details.elemets,presenece_count:social_media_presence_details.count})
            recommended_products.push({product_id: 2, elements: social_media_presence_details.elemets})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*SEO logic checking*/

function checkSEO(elements_values_obj, recommended_products) {

    try {
        let SEO_elements_absense_details = get_elements_absense_details(elements_values_obj, SEO_Elements)

        if (SEO_elements_absense_details.count >= 11) {
//            recommended_products.push({product_id: 3, elements: SEO_elements_absense_details.elemets,presenece_count:SEO_elements_absense_details.count})
            recommended_products.push({product_id: 3, elements: SEO_elements_absense_details.elemets})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}

/*SEO Maintinence logic checking*/

function checkSEOMaintinence(elements_values_obj, recommended_products) {

    try {
        let notpresent_elements = [];
        let SEO__Maintinence_elements_present_details = get_elements_presents_details(elements_values_obj, SEO_Elements)
        let infrastructure_elements_presence_details = get_elements_presents_details(elements_values_obj, InfraStructure_elements)
        notpresent_elements = notpresent_elements.concat(SEO__Maintinence_elements_present_details.elemets);
        notpresent_elements = notpresent_elements.concat(infrastructure_elements_presence_details.elemets);

        if (SEO__Maintinence_elements_present_details.count <= 15 && infrastructure_elements_presence_details.count <= 5) {
            recommended_products.push({product_id: 4, elements: notpresent_elements})
//            recommended_products.push({product_id: 4, elements: notpresent_elements,presenece_count:infrastructure_elements_presence_details.count})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*Social Conversation logic checking*/

function checkSocialConversation(elements_values_obj, recommended_products) {

    try {
        let Social__Conversation_elements_present_details = get_elements_presents_details(elements_values_obj, Social_Conversation_Elements)

        if (Social__Conversation_elements_present_details.count >= 5) {
            recommended_products.push({product_id: 5, elements: Social__Conversation_elements_present_details.elements})
//            recommended_products.push({product_id: 5, elements: Social__Conversation_elements_present_details.elements,presenece_count:Social__Conversation_elements_present_details.count})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}



/*Pay Per Click logic checking*/

function checkPayPerClick(elements_values_obj, recommended_products) {

    try {
        let buzz_score = elements_values_obj["opportunity_score"];
        let responsive = elements_values_obj["bb_responsive"];
        let mobile_friendly = elements_values_obj["google_mobile_friendly"]

        if ((buzz_score >= 65) && (mobile_friendly || responsive)) {
            recommended_products.push({product_id: 6, elements: ""})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*Display Ads Click logic checking*/

function checkDisplayAds(elements_values_obj, recommended_products) {

    try {
        let buzz_score = elements_values_obj["opportunity_score"];
        let responsive = elements_values_obj["bb_responsive"];
        let mobile_friendly = elements_values_obj["google_mobile_friendly"]

        if (buzz_score > 75 && (mobile_friendly || responsive)) {
            recommended_products.push({product_id: 7, elements: ""})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}

function getDoc(fp_id, collection_name) {
    return new Promise(async function (resolve, reject) {

        try {

            var collection = "";
            collection = local_master_data_db.collection(`${collection_name}`);
            if (!collection) {
                reject(new Error(`${collection_name} not found`));
            } else {
                let doc = "";
                doc = await collection.findOne({_id: ObjectId(fp_id)});
                resolve(doc);

            }
        } catch (E) {
            reject(E);
        }
    })

}
function updateRecommended_product(reqId, updateDoc, collection_name) {
    console.log("updateDoc recommended_products_details ", updateDoc ["recommended_products_details"])
    return new Promise(async function (resolve, reject) {

        try {

            var collection = "";
            collection = local_master_data_db.collection(`${collection_name}`);
            if (!collection) {
                reject(new Error(`${collection_name} not found`));
            } else {
                console.log("updateDoc ", updateDoc["recommended_products_details"])
                var updateDoc_info = await collection.save(updateDoc);
                console.log("save info Recommend ", updateDoc_info.result)
                if (updateDoc_info.result.n) {
//                    console.log("********* updateDoc_info ******* ",updateDoc_info)
                    if (updateDoc_info.result.nModified) {
                        resolve(true);
                        return;
                    } else {
                        resolve(false);
                        return;
                    }
                } else {
                    dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), updateDoc_info);
                    reject(new Error(`Document---- ${updateDoc["_id"]} not found`));
                    return;
                }

            }
        } catch (E) {
            console.log("Save reject ", E);
            reject(E);
        }
    });

}

function get_elements_presents_details(elements_values_obj, checking_elements) {
    try {
        let presense_count = 0;
        let not_presence_elements = [];
        for (let checking_element in checking_elements) {
            if (elements_values_obj[checking_elements[checking_element]]) {
                presense_count++;
            } else {
                not_presence_elements.push(checking_elements[checking_element]);
            }
        }
        return {count: presense_count, elemets: not_presence_elements}
    } catch (Exception) {
        throw Exception;
    }

}
function get_elements_absense_details(elements_values_obj, checking_elements) {
    try {
        let absense_count = 0;
        let present_elements = [];
        for (let checking_element in checking_elements) {
            if (!elements_values_obj[checking_elements[checking_element]])
                absense_count++;
            else
                present_elements.push(checking_elements[checking_element])
        }
        return {count: absense_count, elemets: present_elements}

    } catch (Exception) {
        throw Exception;
    }

}


//var Reputation_Management_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile", "googleplus_company_profile", "foursquare_profile"]
//var Directory_Listings_Elements = ["googleplaces", "yahoo_local", "citysearch", "yellow_pages", "bing_local", "nokia_places", "foursquare"]
var Social_Conversation_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile","googleplus_company_profile"]
var SEO_Elements = ["www_resolve", "robots_txt", "sitemap_xml", "title_tag_optimization", "location_in_title", "unique_title", "meta_description_optimization", "headings", "image_optimization", "no_frames_used", "no_flash_used", "text_content", "domain_age", "richsnippets", "friendly_urls", "sitemap_html"]
var Social_Media_Presence_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile","googleplus_company_profile"]
var Content_Analysis_elements = ['local_phone_number', 'address_on_homepage', 'map_directions', 'blog', 'contact_us', 'privacy_policy', 'gallery', 'vs_about_page', 'vs_services_page', 'vs_contact_form', 'vs_insurances_accepted', 'vs_certifications', 'vs_business_hours', 'vs_faq', 'vs_testimonials', 'vs_new_cars_page', 'vs_used_cars_page', 'vs_search_form_home', 'vs_twitter_feed_home', 'news_letter', 'videos']
var InfraStructure_elements = ['page_redirects', 'iswordpress', 'ga_code', 'secured_site']

















// 
// 
// 
// 
///*Directory Listing logic checking*/
//
//function checkDirectoryListing(elements_values_obj, recommended_products) {
//
//    try {
//        let directory_listing_elements_presence_details = get_elements_presents_details(elements_values_obj, Directory_Listings_Elements)
//
//        if (directory_listing_elements_presence_details.count <= 4) {
////            recommended_products.push({product_id: 8, elements: directory_listing_elements_presence_details.elemets,presenece_count:directory_listing_elements_presence_details.count})
//            recommended_products.push({product_id: 8, elements: directory_listing_elements_presence_details.elemets})
//        };
//        return;
//    } catch (Exception) {
//        throw Exception;
//    }
//}
///*Reputation Management logic checking*/
//
//function checkReputationManagement(elements_values_obj, recommended_products) {
//
//    try {
//        
//        let buzz_score=elements_values_obj["opportunity_score"];
//        let revwsAvg_rating=2.8
//        let SocialMedia_elements_present_details = get_elements_presents_details(elements_values_obj, Reputation_Management_Elements)
//
//        if (revwsAvg_rating <=3 && buzz_score>=65 && SocialMedia_elements_present_details.count >= 3) {
//            recommended_products.push({product_id: 9, elements: SocialMedia_elements_present_details.elements})
////            recommended_products.push({product_id: 9, elements: SocialMedia_elements_present_details.elements,presenece_count:SocialMedia_elements_present_details.count})
//        }
//        return;
//    } catch (Exception) {
//        throw Exception;
//    }
//}



//mongoexport -h 104.197.218.69 --authenticationDatabase admin -u  data_root -p 'xyz1$3^nhy7'  --db data_us --collection leads_with_url_recommended_products_50 --csv --out test_recommend_logic_20.csv  --fields "_id,business.website,page_analysis.page_redirects,page_analysis.wordpress,page_analysis.google_analytics,page_analysis.secured_site,page_analysis.local_phone,page_analysis.address_on_page,page_analysis.map,page_analysis.blog,page_analysis.contact_page,page_analysis.privacy_policy,page_analysis.gallery,page_analysis.about_page,page_analysis.services_page,page_analysis.contact_form,page_analysis.insurances_accepted,page_analysis.certifications,page_analysis.business_hours,page_analysis.faq,page_analysis.testimonials,page_analysis.new_cars_page,page_analysis.used_cars_page,page_analysis.inventory_search_form,page_analysis.twitter_feed_home,page_analysis.newsletter,page_analysis.video,page_analysis.facebook_page,page_analysis.twitter_page,page_analysis.youtube_page,page_analysis.linkedin_page,page_analysis.www_resolve,page_analysis.robots,page_analysis.sitemap_xml,page_analysis.title_tag_compliance,page_analysis.location_in_title,page_analysis.unique_title,page_analysis.page_meta_description_compliance,page_analysis.headings_data,page_analysis.image_optimization,page_analysis.iframe_count,page_analysis.flash_count,page_analysis.text_content,business.domain_established,page_analysis.rich_snippets,page_analysis.seo_friendly_url,page_analysis.sitemap_html,social.facebook.likes,social.facebook.posts_count,social.twitter.statuses_count,social.twitter.followers_count"
