

var logger = require(__base);
var dbLogger = require(__dblogger);
var _ = require('underscore');
var ObjectId = require('mongodb').ObjectId;
var local_database_conn = require(__base).local_database;
var live_database_conn = require(__base).live_database;

var mongo_elstic_collections_indexes = require(`${__v4root}/connections/indexes_and_mongo_collections.js`);
var local_master_data_db = local_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["staging_master"]);
var live_master_db = live_database_conn.db(mongo_elstic_collections_indexes.mongo_databases["live_master"]);
function getDoc(fp_id, collection_name) {
    return new Promise(async (resolve, reject) => {
        try {
            var collection = "";
            collection = local_master_data_db.collection(`${collection_name}`);
            if (!collection) {
                reject(new Error(`${collection_name} not found`));
            } else {
                let doc = "";
                doc = await collection.findOne({ _id: ObjectId(fp_id) });
                resolve(doc);
            }
        } catch (E) {
            reject(E);
        }
    })
}

function updateScore(fp_id, updateData, collection_name) {
    return new Promise(async (resolve, rejects) => {
        try {
            var collection = "";
            
            collection = local_master_data_db.collection(`${collection_name}`);
            if (!collection) {
                reject(new Error(`${collection_name} not found`));
            } else {
                let doc = "";
                doc = await collection.update({ "_id":ObjectId(fp_id)},
                    {
                        "$set": updateData
                    });
                resolve(doc);
            }

        } catch (E) {
            reject(E);
        }
    })
}
module.exports = function (reqId, fp_id, collection_name) {

    return new Promise(async (resolve, reject) => {
        try {
            if (!reqId) {
                let text = `reqId is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                reject(new Error(text));
            }
            if (!fp_id) {
                let text = `reqId is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                reject(new Error(text));
            }

            if (!collection_name) {
                let text = `collection_name is missing`;
                dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                reject(new Error(text));
            }


            var score = 0;
            var percentage = "";
            var grade = "E";
            var doc = "";

            doc = await getDoc(fp_id, collection_name);

            if (!doc) {
                let text = `document not found with ${fp_id}`;
                dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                reject(new Error(text));
                return;
            }

            if (doc.page_analysis) {

                //Mobile Website Analysis
                if (doc.page_analysis['bb_mobile_compatible'] && doc.page_analysis['bb_mobile_compatible'] == 1) {
                    score += 5;
                }
                if (doc.page_analysis['bb_responsive'] && doc.page_analysis['bb_responsive'] == 1) {
                    score += 3;
                }
                //local analysis

                if (doc.page_analysis['local_phone'] && doc.page_analysis['local_phone'] == 1) {
                    score += 2;
                }
                if (doc.page_analysis['address_on_page'] && doc.page_analysis['address_on_page'] == 1) {
                    score += 1;
                }
                if (doc.page_analysis['map'] && doc.page_analysis['map'] == 1) {
                    score += 2;
                }
                if (doc.page_analysis['blog'] && doc.page_analysis['blog'] == 1) {
                    score += 1;
                }
                if (doc.page_analysis['contact_page'] && doc.page_analysis['contact_page'] == 0) {
                    score += 1;
                }
                if (doc.page_analysis['privacy_policy'] && doc.page_analysis['privacy_policy'] == 1) {
                    score += 1;
                }
                //Social Media Analysis  

                if (doc.page_analysis['facebook_page'] && doc.page_analysis['facebook_page'] == 1) {
                    score += 4;
                }

                if (doc.page_analysis['twitter_page'] && doc.page_analysis['twitter_page'] == 1) {
                    score += 4;
                }
                if (doc.page_analysis['youtube_page'] && doc.page_analysis['youtube_page'] == 1) {
                    score += 3;
                }
                if (doc.page_analysis['linkedin_page'] && doc.page_analysis['linkedin_page'] == 1) {
                    score += 3;
                }
                if (doc.page_analysis['google_plus'] && doc.page_analysis['google_plus'] == 1) {
                    score += 3;
                }
                if (doc.page_analysis['foursquare_page'] && doc.page_analysis['foursquare_page'] == 1) {
                    score += 0;
                }


                //SEO Analysis 

                if (doc.page_analysis['canonical'] && doc.page_analysis['canonical'] == 1) {
                    score += 3;
                }
                if (doc.page_analysis['robots'] && doc.page_analysis['robots'] == 1) {
                    score += 1;
                }
                if (doc.page_analysis['sitemap'] && doc.page_analysis['sitemap'] == 1) {
                    score += 2;
                }
                if (doc.page_analysis['title_tag_compliance'] && doc.page_analysis['title_tag_compliance'] == 1) {
                    score += 3;
                }

                //changed meta_description_compliance from to meta_tag_compliance
                if (doc.page_analysis['meta_tag_compliance'] && doc.page_analysis['meta_tag_compliance'] == 1) {
                    score += 2;
                }

                if (doc.page_analysis['headings_data']) {

                    if (doc.page_analysis['headings_data']['h1'] && doc.page_analysis['headings_data']['h1'] > 0) {
                        score += 2;
                    }
                }
                if (doc.page_analysis['image_optimization'] && doc.page_analysis['image_optimization'] == 1) {
                    score += 2;
                }
                if (doc.page_analysis['iframe_count'] && doc.page_analysis['iframe_count'] == 0) {
                    score += 2;
                }
                if (doc.page_analysis['flash_count'] && doc.page_analysis['flash_count'] == 0) {
                    score += 2;
                }
                if (doc.page_analysis['microformats'] && doc.page_analysis['microformats'] == 1) {
                    score += 1;
                }
                if (doc.page_analysis['location_in_title'] && doc.page_analysis['location_in_title'] == 1) {
                    score += 1;
                }

                ////Google Pagerank
                //            if (isset($doc['page_analysis']['google_pagerank']) && $doc['page_analysis']['google_pagerank'] >= 1 && $doc['page_analysis']['google_pagerank'] <= 2) {
                //                $score+=3;
                //            } elseif (isset($doc['page_analysis']['google_pagerank']) && $doc['page_analysis']['google_pagerank'] >= 3 && $doc['page_analysis']['google_pagerank'] <= 4) {
                //                $score+=5;
                //            } elseif (isset($doc['page_analysis']['google_pagerank']) && $doc['page_analysis']['google_pagerank'] >= 5 && $doc['page_analysis']['google_pagerank'] <= 6) {
                //                $score+=8;
                //            } elseif (isset($doc['page_analysis']['google_pagerank']) && $doc['page_analysis']['google_pagerank'] >= 7 && $doc['page_analysis']['google_pagerank'] <= 8) {
                //                $score+=9;
                //            } elseif (isset($doc['page_analysis']['google_pagerank']) && $doc['page_analysis']['google_pagerank'] >= 9 && $doc['page_analysis']['google_pagerank'] <= 10) {
                //                $score+=10;
                //            }
                //PPC   

                if (doc.page_analysis['google_adwords'] && doc.page_analysis['google_adwords'] == 1) {
                    score += 6;
                }


                percentage = (score / 61) * 100;

                if (percentage) {
                    if (percentage >= 0 && percentage <= 20) {
                        grade = "E";
                    } else if (percentage > 20 && percentage <= 40) {
                        grade = "D";
                    } else if (percentage > 40 && percentage <= 60) {
                        grade = "C";
                    } else if (percentage > 60 && percentage <= 80) {
                        grade = "B";
                    } else if (percentage > 80 && percentage <= 100) {
                        grade = "A";
                    }

                    var update_doc_local = {
                        'page_analysis.opportunity_count': score,
                        'page_analysis.opportunity_score': Math.round(percentage),
                        'page_analysis.opportunity_grade': grade,
                        "_log": {
                            "new_score": true
                        },
                        "dates": {
                            "opportunity_score_date": new Date()
                        }

                    };

                    if (doc["_log"]) {
                        delete update_doc_local["_log"];
                        update_doc_local["_log.new_score"] = true;
                    }

                    if (doc["dates"]) {
                        delete update_doc_local["dates"];
                        update_doc_local["dates.opportunity_score_date"] = new Date();
                    }
                    var result = "";
                    result = await updateScore(fp_id, update_doc_local, collection_name);
                    console.log(result.result);
                    if(!result.result.n) {
                        let text = `${fp_id} not found`;
                        dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                        reject(new Error(text));
                        return;
                    }

                    if(result.result.nModified){
                        resolve(true);
                        return;
                    } else {
                        resolve(false);
                        return;
                    }
                    

                } else {
                    let text = `percentage not generated`;
                    dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), text);
                    reject(new Error(text));
                    return;
                }

            } else {
                reject(new Error("page analysis signal not found"));
                return;
            }

        } catch (E) {
            dbLogger.move_data_api_log_setLogger(reqId, "BUZZ_ERROR", new Date(), E);
            reject(E);
        }
    })

}