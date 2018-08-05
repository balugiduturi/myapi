module.exports = function (doc) {
    try {
        let elasticObj = doc;
        if (!elasticObj['location'])
            elasticObj['location'] = {};
        if (!elasticObj['data_info'])
            elasticObj['data_info'] = {};
        if (doc['geometry'] && doc['geometry']['coordinates'] && doc['geometry']['coordinates'][1] && doc['geometry']['coordinates'][0]) {
            elasticObj['location']['lat'] = doc['geometry']['coordinates'][1]
            elasticObj['location']['lon'] = doc['geometry']['coordinates'][0]
        }
        if (elasticObj.hasOwnProperty('_parent_id'))
            delete elasticObj._parent_id;
        if (elasticObj.hasOwnProperty('_duplicate'))
            delete elasticObj._duplicate;

        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers'].hasOwnProperty('local')) {
            elasticObj['business']['phone_numbers_local'] = elasticObj['business']['phone_numbers']['local'];
            delete elasticObj['business']['phone_numbers'].local;
        }
        if (elasticObj['recommended_products'] && (elasticObj['recommended_products']).constructor === Object) {
            let recommended_productsNames = elasticObj['recommended_products']["product_names"]
            let recommended_productsIds = elasticObj['recommended_products']["product_ids"]
            elasticObj['recommended_products'] = recommended_productsNames
            elasticObj['recommended_products_id'] = recommended_productsIds
        }

        if (elasticObj['data_info'] && elasticObj['data_info'].hasOwnProperty('added_date'))
            delete elasticObj["data_info"].added_date;

        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers'].hasOwnProperty('toll_free')) {
            elasticObj['business']['phone_numbers_toll_free'] = elasticObj['business']['phone_numbers']['toll_free'];
            delete elasticObj['business']['phone_numbers'].toll_free;
        }
        if (elasticObj['business'].hasOwnProperty("adbeat_adspend")) {
            if (elasticObj['business'].adbeat_adspend.constructor === Number) {
                console.log("\n\n\n\n\nNumber type in adbeat ad spend==========", elasticObj['business'].adbeat_adspend);
                delete elasticObj['business'].adbeat_adspend;

            }
        }


        if (elasticObj.hasOwnProperty('geometry'))
            delete elasticObj.geometry

        if (elasticObj.hasOwnProperty('_log'))
            delete elasticObj._log

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('phone_numbers') && Array.isArray(elasticObj['business']['phone_numbers']) && (elasticObj['business']['phone_numbers']).length === 0)
            delete elasticObj['business'].phone_numbers;

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('phone_numbers') && !Array.isArray(elasticObj['business']['phone_numbers'])) {
            var temp = elasticObj['business']['phone_numbers'];
            delete elasticObj['business']['phone_numbers'];
            elasticObj['business']['phone_numbers'] = [];


            for (let value of temp) {
                elasticObj['business']['phone_numbers'].push(value);
            }
            console.log("phone_numbers");
            console.log(elasticObj['business']['phone_numbers'])
        }

        if (elasticObj['business'] && elasticObj['business']['phone_numbers'] && elasticObj['business']['phone_numbers']["local"] && Array.isArray(elasticObj['business']['phone_numbers']['local']) && (elasticObj['business']['phone_numbers']['local']).length === 0)
            delete elasticObj['phone_numbers']['local'];




        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('category_labels') && Array.isArray(elasticObj['business']['category_labels']) && (elasticObj['business']['category_labels']).length === 0)
            delete elasticObj['business'].category_labels


        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('emails') && Array.isArray(elasticObj['business']['emails']) && (elasticObj['business']['emails']).length === 0)
            delete elasticObj['business'].emails
        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('buzz_category_ids') && Array.isArray(elasticObj['business']['buzz_category_ids']) && (elasticObj['business']['buzz_category_ids']).length === 0)
            delete elasticObj['business'].buzz_category_ids

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

        if (elasticObj.hasOwnProperty('messages'))
            delete (elasticObj['messages']);

        if (elasticObj["business"] && elasticObj["business"]["anzsic_code"])
            delete elasticObj["business"]["anzsic_code"]

        if (elasticObj['business'] && elasticObj['business'].hasOwnProperty('opening_hours'))
            delete (elasticObj['business']['opening_hours']);

        var strGoogle_Page_Rank;
        if (elasticObj['page_analysis'] && elasticObj['page_analysis'].hasOwnProperty('google_pagerank'))
            strGoogle_Page_Rank = (elasticObj['page_analysis']['google_pagerank']).toString()
        if ((strGoogle_Page_Rank) && ((strGoogle_Page_Rank === "true") || (strGoogle_Page_Rank === "false") || strGoogle_Page_Rank.match("/TRUE/i") || strGoogle_Page_Rank.match("/FALSE/i") || strGoogle_Page_Rank.match("/true/i") || strGoogle_Page_Rank.match("/false/i")))
            delete (elasticObj['page_analysis']['google_pagerank']);

        if (elasticObj['page_analysis'] && elasticObj['page_analysis']['headings_data'] && !(Array.isArray(elasticObj['page_analysis']['headings_data']))) {
            delete (elasticObj['page_analysis']['headings_data']);
        }

        if (elasticObj['address'] && elasticObj['address']["postal_code"] && typeof (elasticObj['address']["postal_code"]) != "string") {
            elasticObj['address']['postal_code'] = (elasticObj['address']['postal_code']).toString();
        }


        if (elasticObj["dates"]) {
            var dates = elasticObj["dates"]
            var datesWithFormat = getElasticObjWithDateFormatted(dates)
            elasticObj["dates"] = datesWithFormat
        }



        if (elasticObj["page_analysis"] && elasticObj["page_analysis"]["modified"] && !elasticObj["page_analysis"]["modified"]["sec"]) {
            var modifiedDate = elasticObj["page_analysis"]["modified"]
            if (modifiedDate && modifiedDate.length > 0)
                var modifiedWithFormat = formatPage_analysis_dates(modifiedDate)
            if (modifiedWithFormat)
                elasticObj["page_analysis"]["modified"] = modifiedWithFormat;
            else
                delete  elasticObj["page_analysis"]["modified"]
        }


        if (elasticObj["dates"] && elasticObj["dates"]["elastic_moved"]) {
            delete elasticObj["dates"]["elastic_moved"]
        }
        if (elasticObj["dates"] && elasticObj["dates"]["mongo_moved"]) {
            delete elasticObj["dates"]["mongo_moved"]
        }
        if (elasticObj["_log"] && elasticObj["_log"]["elastic_err_discription"]) {
            delete elasticObj["dates"]["elastic_moved"]
        }
        if (elasticObj["_log"] && elasticObj["_log"]["elastic_moved"]) {
            delete elasticObj["dates"]["elastic_moved"]
        }
        if (elasticObj["_log"] && elasticObj["_log"]["mongo_err_discription"]) {
            delete elasticObj["dates"]["mongo_err_discription"]
        }
        if (elasticObj["_log"] && elasticObj["_log"]["mongo_moved"]) {
            delete elasticObj["dates"]["elastic_moved"]
        }
        if (elasticObj["dates"] && elasticObj["dates"]["elastic_moved"]) {
            delete elasticObj["dates"]["elastic_moved"]
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
//  if (elasticObj["page_analysis"] && elasticObj["page_analysis"].hasOwnProperty("google_pagerank")) {
//      if(!elasticObj["page_analysis"]["google_pagerank"])
//          elasticObj["page_analysis"]["google_pagerank"]=0;
//      else
//          elasticObj["page_analysis"]["google_pagerank"]=1;
//         }
        if (elasticObj["dates"] && elasticObj["dates"]["dp_moved"] && !elasticObj["dates"]["dp_moved"]["sec"]) {
            let modifiedDate = elasticObj["dates"]["dp_moved"]
            let modifiedWithFormat = formatPage_analysis_dates(modifiedDate)
            elasticObj["dates"]["dp_moved"] = modifiedWithFormat
        }
        if (elasticObj["api_info_log"]) {
            delete elasticObj["api_info_log"]
        }

        return elasticObj
    } catch (exception) {
        return {"error": exception}
    }
}


function formatPage_analysis_dates(dateInDoc) {
    if (dateInDoc.toString() === {})
        return {}
    var formattedDateObj = {};
    console.log("dateInDoc ", dateInDoc)

    var formatDate = (dateInDoc.getTime()) / 1000
    formatDate = formatDate.toString();
    formatDate = formatDate.split(".")
    formattedDateObj = {"sec": parseInt(formatDate[0])}
    if (formatDate[1])
        formattedDateObj["usec"] = parseInt(formatDate[1])
    else
        formattedDateObj["usec"] = 0



    return formattedDateObj
}




function getElasticObjWithDateFormatted(dates) {
    var formattedDateObj = {};
    for (key in dates) {
        var dateInDoc = new Date(dates[key])
        var formatDate = (dateInDoc.getTime()) / 1000
        formatDate = formatDate.toString();

        formatDate = formatDate.split(".")
        var formattedDate = {"sec": parseInt(formatDate[0])}
        if (formatDate[1])
            formattedDate["usec"] = parseInt(formatDate[1])
        else
            formattedDate["usec"] = 0
        formattedDateObj[key] = formattedDate

    }

    // console.log("after for ",formattedDateObj)
    return formattedDateObj
}