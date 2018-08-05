//function to format the Ds mongo searched document to elastic format

module.exports = function (doc) {
    try {
        var elasticObj = doc;
        if (doc['geometry'] && doc['geometry']['coordinates'] && doc['geometry']['coordinates'][0]) {
            if (!elasticObj['location'])
                elasticObj['location'] = {};
            elasticObj['location']['lat'] = doc['geometry']['coordinates'][1];
            elasticObj['location']['lon'] = doc['geometry']['coordinates'][0];
        }
        if (elasticObj['recommended_products'] && (elasticObj['recommended_products']).constructor === Object) {
            let recommended_productsNames = elasticObj['recommended_products']["product_names"]
            let recommended_productsIds = elasticObj['recommended_products']["product_ids"]
            elasticObj['recommended_products'] = recommended_productsNames
            elasticObj['recommended_products_id'] = recommended_productsIds
        }
        if (elasticObj.hasOwnProperty('_parent_id'))
            delete elasticObj._parent_id;
        if (elasticObj.hasOwnProperty('_duplicate'))
            delete elasticObj._duplicate;
        if (elasticObj.hasOwnProperty('_log') && elasticObj["_log"].hasOwnProperty('added_date') && (elasticObj['_log']['added_date'] != null)) {
            elasticObj['data_info']['added_date'] = doc['_log']['added_date'];
        }
        if (elasticObj["move_to_elastic"])
            delete elasticObj["move_to_elastic"];

        if (elasticObj['data_info'] && elasticObj['data_info'].hasOwnProperty('dp_moved'))
            delete elasticObj["data_info"].dp_moved;
        if (elasticObj['data_info'] && elasticObj['data_info'].hasOwnProperty('added_date'))
            delete elasticObj["data_info"].added_date;
        if (elasticObj.hasOwnProperty('elastic_index_failed'))
            delete elasticObj.elastic_index_failed;
        if (elasticObj['data_info'] && elasticObj['data_info'].hasOwnProperty('neustar_mongo_id'))
            delete elasticObj["data_info"].neustar_mongo_id;
        if (elasticObj['data_info'] && elasticObj['data_info']['data_source'] && elasticObj['data_info']["data_source"][0] && Array.isArray(elasticObj['data_info']['data_source'])) {
            elasticObj['data_info']['data_source'] = (elasticObj['data_info']['data_source'][0]).toString();
        }

        if (elasticObj['data_info'] && elasticObj['data_info'].hasOwnProperty('source')) {
            elasticObj['data_info']['data_source'] = elasticObj['data_info']['source'];
            delete elasticObj["data_info"].source;
        }
        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers']["local"]) {
            elasticObj['business']['phone_numbers_local'] = elasticObj['business']['phone_numbers']['local'];
            delete elasticObj['business']['phone_numbers'].local;
        }

        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers']["toll_free"]) {
            elasticObj['business']['phone_numbers_toll_free'] = elasticObj['business']['phone_numbers']['toll_free'];
            delete elasticObj['business']['phone_numbers'].toll_free;
        }


        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty("adbeat_adspend")) {
            if (elasticObj['business'].adbeat_adspend.constructor === Number) {
                delete elasticObj['business'].adbeat_adspend;
            }
        }

        if (elasticObj['address'] && elasticObj['address']['region']) {
            elasticObj['address']['region'] = elasticObj['address']['region'];
        }

        if (elasticObj.hasOwnProperty('_status'))
            delete elasticObj._status;

        if (elasticObj.hasOwnProperty('data_bridge'))
            delete elasticObj.data_bridge;

        if (elasticObj.hasOwnProperty('neustar'))
            delete elasticObj.neustar;

        if (elasticObj.hasOwnProperty('geometry'))
            delete elasticObj.geometry;

        if (elasticObj.hasOwnProperty('page_data'))
            delete elasticObj.page_data;

        if (elasticObj.hasOwnProperty('_log'))
            delete elasticObj._log;


        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('phone_numbers') && Array.isArray(elasticObj['business']['phone_numbers']) && (elasticObj['business']['phone_numbers']).length === 0)
            delete elasticObj['business'].phone_numbers;

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('phone_numbers') && !Array.isArray(elasticObj['business']['phone_numbers'])) {
            var temp = elasticObj['business']['phone_numbers'];
            delete elasticObj['business']['phone_numbers'];
            elasticObj['business']['phone_numbers'] = [];

            for (let value in temp) {
                elasticObj['business']['phone_numbers'].push(temp[value]);
            }
        }

        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers'].hasOwnProperty('phone_numbers') && Array.isArray(elasticObj['business']['phone_numbers']['local']) && (elasticObj['business']['phone_numbers']['local']).length === 0)
            delete elasticObj['phone_numbers']['local'];

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('category_labels') && Array.isArray(elasticObj['business']['category_labels']) && (elasticObj['business']['category_labels']).length === 0)
            delete elasticObj['business'].category_labels;

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('emails') && Array.isArray(elasticObj['business']['emails']) && (elasticObj['business']['emails']).length === 0)
            delete elasticObj['business'].emails;

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('listing_source') && Array.isArray(elasticObj['business']['listing_source']) && (elasticObj['business']['listing_source']).length === 0)
            delete (elasticObj['business']['listing_source']);

        if (elasticObj['domain_data'] && elasticObj['domain_data'].hasOwnProperty('http_redirects') && Array.isArray(elasticObj['domain_data']['http_redirects']) && (elasticObj['domain_data']['http_redirects']).length === 0)
            delete (elasticObj['domain_data']['http_redirects']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('blogs') && Array.isArray(elasticObj['social']['blogs']) && (elasticObj['social']['blogs']).length === 0)
            delete (elasticObj['social']['blogs']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('facebook') && Array.isArray(elasticObj['social']['facebook']) && (elasticObj['social']['facebook']).length === 0)
            delete (elasticObj['social']['facebook']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('flickr') && Array.isArray(elasticObj['social']['flickr']) && (elasticObj['social']['flickr']).length === 0)
            delete (elasticObj['social']['flickr']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('foursquare') && Array.isArray(elasticObj['social']['foursquare']) && (elasticObj['social']['foursquare']).length === 0)
            delete (elasticObj['social']['foursquare']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('google_plus') && Array.isArray(elasticObj['social']['google_plus']) && (elasticObj['social']['google_plus']).length === 0)
            delete (elasticObj['social']['google_plus']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('linkedin') && Array.isArray(elasticObj['social']['linkedin']) && (elasticObj['social']['linkedin']).length === 0)
            delete (elasticObj['social']['linkedin']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('pinterest') && Array.isArray(elasticObj['social']['pinterest']) && (elasticObj['social']['pinterest']).length === 0)
            delete (elasticObj['social']['pinterest']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('twitter') && Array.isArray(elasticObj['social']['twitter']) && (elasticObj['social']['twitter']).length === 0)
            delete (elasticObj['social']['twitter']);

        if (elasticObj['social'] && elasticObj['social'].hasOwnProperty('youtube') && Array.isArray(elasticObj['social']['youtube']) && (elasticObj['social']['youtube']).length === 0)
            delete (elasticObj['social']['youtube']);

        if (elasticObj['domain_data'] && elasticObj['domain_data'].hasOwnProperty('http_redirects'))
            delete (elasticObj['domain_data']['http_redirects']);

        if (elasticObj.hasOwnProperty('tags'))
            delete (elasticObj['tags']);

        if (elasticObj.hasOwnProperty('_messages'))
            delete (elasticObj['_messages']);

        if (elasticObj.hasOwnProperty('address_old'))
            delete (elasticObj['address_old']);

        if (elasticObj.hasOwnProperty('duplicate'))
            delete (elasticObj['duplicate']);

//           if (elasticObj.hasOwnProperty('technologies'))
//              delete (elasticObj['technologies']);  

        if (elasticObj.hasOwnProperty('messages'))
            delete (elasticObj['messages']);

        if (elasticObj.hasOwnProperty("elastic_index_failed"))
            delete elasticObj['elastic_index_failed'];

//          if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('opening_hours'))  
//               delete (elasticObj['business']['opening_hours']); 
        //    if (isset($params['body']['page_analysis']['google_pagerank']) && ($params['body']['page_analysis']['google_pagerank'] === TRUE || $params['body']['page_analysis']['google_pagerank'] === FALSE || preg_match("/TRUE/i", $params['body']['page_analysis']['google_pagerank']) || preg_match("/FALSE/i", $params['body']['page_analysis']['google_pagerank']) )) {
        //        unset($params['body']['page_analysis']['google_pagerank']);
        //    }
        //    
        //    
        var strGoogle_Page_Rank;
        if (elasticObj['page_analysis'] && elasticObj['page_analysis'].hasOwnProperty('google_pagerank'))
            strGoogle_Page_Rank = (elasticObj['page_analysis']['google_pagerank']).toString();
        if ((strGoogle_Page_Rank) && ((strGoogle_Page_Rank === "true") || (strGoogle_Page_Rank === "false") || strGoogle_Page_Rank.match("/TRUE/i") || strGoogle_Page_Rank.match("/FALSE/i") || strGoogle_Page_Rank.match("/true/i") || strGoogle_Page_Rank.match("/false/i")))
            delete (elasticObj['page_analysis']['google_pagerank']);



//         if (elasticObj['page_analysis'] && elasticObj['page_analysis']['headings_data'] && !(Array.isArray(elasticObj['page_analysis']['headings_data']))) {
//             delete (elasticObj['page_analysis']['headings_data']); 
//         }

//      if (elasticObj['social'] && elasticObj['social']['facebook'] && elasticObj['social']['facebook'][0] && elasticObj['social']['facebook'][0]['posts_count']  && typeof(doc['social']['facebook'][0]['posts_count']) ==='boolean' ) {
//             delete['social']['facebook'][0]['posts_count']; 
//         }




        if (elasticObj['additional_information'] && elasticObj['additional_information']['neustar_category_ids'])
            delete (elasticObj['additional_information']['neustar_category_ids']);

        if (elasticObj['additional_information'] && elasticObj ['additional_information']['neustar_category_name'])
            delete (elasticObj['additional_information']['neustar_category_name']);

        if (elasticObj["dates"] && elasticObj["dates"]["elastic_moved"]) {
            delete elasticObj["dates"]["elastic_moved"];
        }
        if (elasticObj["dates"] && elasticObj["dates"]["mongo_moved"]) {
            delete elasticObj["dates"]["mongo_moved"];
        }
        if (elasticObj["_domain_data_log"]) {
            delete elasticObj["_domain_data_log"];
        }
        if (elasticObj["analysis_scripts"]) {
            delete elasticObj["analysis_scripts"];
        }

        // if (elasticObj["dates"] && elasticObj["dates"]["dp_moved"] && !elasticObj["dates"]["dp_moved"]["sec"]) {
        //     let modifiedDate = elasticObj["dates"]["dp_moved"]
        //     let modifiedWithFormat = formatPage_analysis_dates(modifiedDate)
        //     elasticObj["dates"]["dp_moved"] = modifiedWithFormat
        //     console.log(elasticObj["dates"]["dp_moved"])
        // }

        if (elasticObj["page_analysis"] && elasticObj["page_analysis"]["modified"] && !elasticObj["page_analysis"]["modified"]["sec"]) {
            let modifiedDate = elasticObj["page_analysis"]["modified"];
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate);
            elasticObj["page_analysis"]["modified"] = modifiedWithFormat;
        }
//                console.log((elasticObj["business"]["domain_established"]) instanceof Date )
        if (elasticObj["business"] && elasticObj["business"]["domain_established"] && !elasticObj["business"]["domain_established"]["sec"]) {
            let modifiedDate = elasticObj["business"]["domain_established"];
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate);
            elasticObj["business"]["domain_established"] = modifiedWithFormat;
        }
        if (elasticObj["domain_data"] && elasticObj["domain_data"]["lastmodified_date"] && !elasticObj["domain_data"]["lastmodified_date"]["sec"]) {
            let modifiedDate = elasticObj["domain_data"]["lastmodified_date"];
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate);
            elasticObj["domain_data"]["lastmodified_date"] = modifiedWithFormat;
        }
        if (elasticObj["page_analysis"] && elasticObj["page_analysis"]["modified"] && !elasticObj["page_analysis"]["modified"]["sec"]) {
            let modifiedDate = elasticObj["page_analysis"]["modified"];
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate);
            elasticObj["page_analysis"]["modified"] = modifiedWithFormat;
        }
        if (elasticObj["data_info"] && elasticObj["data_info"]["added_date"] && !elasticObj["data_info"]["added_date"]["sec"]) {
            let modifiedDate = elasticObj["data_info"]["added_date"];
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate);
            elasticObj["data_info"]["added_date"] = modifiedWithFormat;
        }



        if (elasticObj["_log"] && elasticObj["_log"]["elastic_err_discription"]) {
            delete elasticObj["_log"]["elastic_err_discription"];
        }
        if (elasticObj["_log"] && elasticObj["_log"]["elastic_moved"]) {
            delete elasticObj["_log"]["elastic_moved"];
        }
        if (elasticObj["_log"] && elasticObj["_log"]["mongo_err_discription"]) {
            delete elasticObj["_log"]["mongo_err_discription"];
        }
        if (elasticObj["_log"] && elasticObj["_log"]["mongo_moved"]) {
            delete elasticObj["_log"]["elastic_moved"];
        }
        if (elasticObj["dates"] && elasticObj["dates"]["elastic_moved"]) {
            delete elasticObj["dates"]["elastic_moved"];
        }
        if (elasticObj["_log"] && elasticObj["_log"]["elastic_version_moved"]) {
            delete elasticObj["_log"]["elastic_version_moved"];
        }
        if (elasticObj["dates"] && elasticObj["dates"]["elastic_version_moved"]) {
            delete elasticObj["dates"]["elastic_version_moved"];
        }
        if (elasticObj["api_info_log"]) {
            delete elasticObj["api_info_log"];
        }
       
        if (elasticObj["recommended_products_details"]) {
            delete elasticObj["recommended_products_details"];
        }
        if (!elasticObj["recommended_products_id"]) {
            delete elasticObj["recommended_products_id"];
        }
        if (!elasticObj["recommended_products"]) {
            delete elasticObj["recommended_products"];
        }
        if (elasticObj["social"] && elasticObj["social"]["blogs"]) {
            delete elasticObj["social"]["blogs"];
        }
//       if (elasticObj["page_analysis"] && elasticObj["page_analysis"].hasOwnProperty("google_pagerank")) {
//      if(!elasticObj["page_analysis"]["google_pagerank"])
//          elasticObj["page_analysis"]["google_pagerank"]=0;
//      else
//          elasticObj["page_analysis"]["google_pagerank"]=1;
//         }
        if (elasticObj["dates"]) {
            let dates = elasticObj["dates"];
            let datesWithFormat = getElasticObjWithDateFormatted(dates);
            elasticObj["dates"] = datesWithFormat;
        }
        if (elasticObj["page_analysis"] && elasticObj["page_analysis"]["modified"] && !elasticObj["page_analysis"]["modified"]["sec"]) {
            let modifiedDate = elasticObj["page_analysis"]["modified"];
            let modifiedWithFormat = formatPage_dates(modifiedDate);
            elasticObj["page_analysis"]["modified"] = modifiedWithFormat;
        }
//              if(elasticObj["social"] && elasticObj["social"]["facebook"] && elasticObj["social"]["facebook"]["last_engagement"]  && !elasticObj["social"]["facebook"]["last_engagement"]["sec"]){
//            var modifiedDate=elasticObj["social"]["facebook"]["last_engagement"]
//            var modifiedWithFormat=formatPage_dates(modifiedDate)
//            elasticObj["social"]["facebook"]["last_engagement"]=modifiedWithFormat
//        }

        return elasticObj;


    } catch (exception) {
        console.log("format exception ", exception);

        return {"error": exception};
    }

}

function formatPage_analysis_dates(dateInDoc) {
    let formattedDateObj = {};
    try {
        let formatDate = (dateInDoc.getTime()) / 1000;
        formatDate = formatDate.toString();
        formatDate = formatDate.split(".");

        formattedDateObj = {"sec": parseInt(formatDate[0])};
        if (formatDate[1])
            formattedDateObj["usec"] = parseInt(formatDate[1]);
        else
            formattedDateObj["usec"] = 0;
    } catch (exce) {

        console.log("exception ", exce);

    }
    //  console.log("formatPage_analysis_dates   ",formattedDateObj)

    return formattedDateObj;
}


function getElasticObjWithDateFormatted(dates) {
    let formattedDateObj = {};
    for (key in dates) {
        let dateInDoc = new Date(dates[key]);
        let formatDate = (dateInDoc.getTime()) / 1000;
        formatDate = formatDate.toString();
        //console.log(formatDate)
        formatDate = formatDate.split(".");
        formattedDateObj[key] = {"sec": parseInt(formatDate[0])};
        if (formatDate[1])
            formattedDateObj[key]["usec"] = parseInt(formatDate[1]);
        else
            formattedDateObj[key]["usec"] = 0;

        //console.log(formatDate);
    }

    return formattedDateObj;
}

function formatPage_dates(dateInDoc) {
    let formattedDateObj = {};
    try {
        let formatDate = (dateInDoc.getTime()) / 1000;
        formatDate = formatDate.toString();
        console.log("formatDate ############## ", formatDate);
        formatDate = formatDate.split(".");
        if (!formatDate[1])
            formatDate[1] = 0;
        console.log("formatDate ############## ", formatDate);
        formattedDateObj = {"sec": parseInt(formatDate[0]), "usec": parseInt(formatDate[1])};


    } catch (exce) {
        console.log("exception ", exce);
    }
    return formattedDateObj;
}