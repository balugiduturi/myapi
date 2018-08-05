var elelments_with_values = require("./elelments_with_values.js")
module.exports = function (doc) {
    return new Promise(async function (resolve, reject) {
        try {
            var products = {1: "Website Design", 2: "Social Media Presence", 3: "SEO", 4: "SEO Maintenance", 5: "Social Conversation", 6: "Pay Per Click", 7: "Display Ads", 8: "Responsive Website Design"}
            var recommended_products = [];

            if (!doc) {
                let text = `doc not receiced to recommenations file`;
                reject(new Error(text));
            }


            var elements_values_obj = elelments_with_values(doc);


            if (!elements_values_obj["website"]) {
                recommended_products.push({product_id: 1, elements: []});

            }

            checkResponsiveWebdsign(elements_values_obj, recommended_products);

            checkSocialMediaPresense(elements_values_obj, recommended_products);

            checkSEO(elements_values_obj, recommended_products);

            checkSEOMaintinence(elements_values_obj, recommended_products);

            checkSocialConversation(elements_values_obj, recommended_products);

            checkPayPerClick(elements_values_obj, recommended_products);

            checkDisplayAds(elements_values_obj, recommended_products);




            var recommended_product_ids = recommended_products.map(item => item.product_id)
            var recommended_product_names = recommended_products.map(item => products[item.product_id])
            var final_recommended_obj = {product_ids: recommended_product_ids, product_names: recommended_product_names, product_details: recommended_products}

            resolve(final_recommended_obj);
        } catch (Exception) {
            console.log("Exception ", Exception);
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
        let content_and_infra_together = 0;
        let not_mobile_friendly;
        if (!elements_values_obj["google_mobile_friendly"])
            not_mobile_friendly = true;
        let not_responsive;

        if (!elements_values_obj["bb_responsive"])
            not_responsive = true;



        if (contenet_analysis_elements_presence_details["elements"]) {
            content_and_infra_together = content_and_infra_together + contenet_analysis_elements_presence_details.count;
            Array.prototype.push.apply(final_recommended_elements, contenet_analysis_elements_presence_details.elements);
        }
        if (infrastructure_elements_presence_details["elements"]) {
            content_and_infra_together = content_and_infra_together + infrastructure_elements_presence_details.count;
            Array.prototype.push.apply(final_recommended_elements, infrastructure_elements_presence_details.elements);
        }
        if (seo_analysis_elements_presence_details["elements"]) {
            Array.prototype.push.apply(final_recommended_elements, seo_analysis_elements_presence_details.elements);
        }

      
        if ((website_not_present && social_media_presense_count >= 30)

                || (content_and_infra_together <= 5 &&
                        seo_analysis_elements_presence_details.count <= 5)

                || (not_mobile_friendly && not_responsive && seo_analysis_elements_presence_details.count <= 5)) {
            recommended_products.push({product_id: 8, elements: final_recommended_elements});
        }
    } catch (Exception) {
        throw Exception;
    }
}

/*Social Media Presense logic checking*/

function checkSocialMediaPresense(elements_values_obj, recommended_products) {

    try {
        let social_media_presence_details = get_elements_presents_details(elements_values_obj, Social_Media_Presence_Elements)

        if (social_media_presence_details.count <= 2) {
//            recommended_products.push({product_id: 2, elements: social_media_presence_details.elements,presenece_count:social_media_presence_details.count})
            recommended_products.push({product_id: 2, elements: social_media_presence_details.elements})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*SEO logic checking*/

function checkSEO(elements_values_obj, recommended_products) {

    try {
        let final_recommended_elements = [];
        let SEO_elements_elements_presence_details = get_elements_presents_details(elements_values_obj, SEO_Elements);
        let contenet_analysis_elements_presence_details = get_elements_presents_details(elements_values_obj, Content_Analysis_elements)
        let SEO_and_Conttent_Analysis_together = 0;

        if (SEO_elements_elements_presence_details["elements"]) {
            
            SEO_and_Conttent_Analysis_together = SEO_and_Conttent_Analysis_together + SEO_elements_elements_presence_details.count;
            Array.prototype.push.apply(final_recommended_elements, SEO_elements_elements_presence_details.elements);
        }

        if (contenet_analysis_elements_presence_details["elements"]) {
            Array.prototype.push.apply(final_recommended_elements, contenet_analysis_elements_presence_details.elements);
            SEO_and_Conttent_Analysis_together = SEO_and_Conttent_Analysis_together + contenet_analysis_elements_presence_details.count;
        }
        
       
     
        if (SEO_and_Conttent_Analysis_together <= 11) {
//            recommended_products.push({product_id: 3, elements: SEO_elements_absense_details.elements,presenece_count:SEO_elements_absense_details.count})
            recommended_products.push({product_id: 3, elements: final_recommended_elements});
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}

/*SEO Maintinence logic checking*/

function checkSEOMaintinence(elements_values_obj, recommended_products) {

    try {
        let final_recommended_elements = [];
        let SEO_elements_elements_presence_details = get_elements_presents_details(elements_values_obj, SEO_Elements);

        let infrastructure_robustness_elements_presence_details = get_elements_presents_details(elements_values_obj, InfraStructure_elements);


        if (SEO_elements_elements_presence_details) {
            Array.prototype.push.apply(final_recommended_elements, SEO_elements_elements_presence_details.elements);
        }
        if (infrastructure_robustness_elements_presence_details) {
            Array.prototype.push.apply(final_recommended_elements, infrastructure_robustness_elements_presence_details.elements);
        }

        if (SEO_elements_elements_presence_details.count >= 11 && infrastructure_robustness_elements_presence_details.count >= 2) {
            recommended_products.push({product_id: 4, elements: final_recommended_elements});
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*Social Conversation logic checking*/

function checkSocialConversation(elements_values_obj, recommended_products) {

    try {
        let social_media_presence_details = get_elements_presents_details(elements_values_obj, Social_Media_Presence_Elements);
        let social_media_presense_count = elements_values_obj["social_media_count"];

        if (social_media_presence_details.count >= 3 && social_media_presense_count >= 30) {
            recommended_products.push({product_id: 5, elements: social_media_presence_details.elements})
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}



/*Pay Per Click logic checking*/

function checkPayPerClick(elements_values_obj, recommended_products) {

    try {
        let buzz_score = elements_values_obj["buzz_score"];
        let responsive = elements_values_obj["bb_responsive"];
        let mobile_friendly = elements_values_obj["google_mobile_friendly"];


        if ((buzz_score >= 65) && (mobile_friendly || responsive)) {
            recommended_products.push({product_id: 6, elements: []});
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
}
/*Display Ads Click logic checking*/

function checkDisplayAds(elements_values_obj, recommended_products) {

    try {
        let buzz_score = elements_values_obj["buzz_score"];
        let responsive = elements_values_obj["bb_responsive"];
        let mobile_friendly = elements_values_obj["google_mobile_friendly"];

        if (buzz_score > 75 && (mobile_friendly || responsive)) {
            recommended_products.push({product_id: 7, elements: []});
        }
        return;
    } catch (Exception) {
        throw Exception;
    }
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
        return {count: presense_count, elements: not_presence_elements}
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
        return {count: absense_count, elements: present_elements}

    } catch (Exception) {
        throw Exception;
    }

}

//var Reputation_Management_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile", "googleplus_company_profile", "foursquare_profile"]
//var Directory_Listings_Elements = ["googleplaces", "yahoo_local", "citysearch", "yellow_pages", "bing_local", "nokia_places", "foursquare"]
var Social_Conversation_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile", "googleplus_company_profile"]
var SEO_Elements = ["www_resolve", "robots_txt", "sitemap_xml", "title_tag_optimization", "location_in_title", "unique_title", "meta_description_optimization", "headings", "image_optimization", "no_frames_used", "no_flash_used", "text_content", "domain_age", "richsnippets", "friendly_urls", "sitemap_html"]
var Social_Media_Presence_Elements = ["facebook_business_page", "twitter_business_profile", "youtube_business_channel", "linkedin_company_profile", "googleplus_company_profile"]
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
////            recommended_products.push({product_id: 8, elements: directory_listing_elements_presence_details.elements,presenece_count:directory_listing_elements_presence_details.count})
//            recommended_products.push({product_id: 8, elements: directory_listing_elements_presence_details.elements})
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
//        let buzz_score=elements_values_obj["buzz_score"];
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