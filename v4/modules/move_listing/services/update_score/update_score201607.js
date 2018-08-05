

var _ = require('underscore');

module.exports =  function (doc) {
    return new Promise( function (resolve, reject)  {
        
        try {
             
            if (!doc) {
                let text = `doc not sent to buzz_score file`;
                reject(new Error(text));
                return;
            }

           


            var score = 0;
            var percentage = "";
            var grade = "E";
          
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
                        'opportunity_count': score,
                        'opportunity_score': Math.round(percentage),
                        'opportunity_grade': grade,
                        

                    };

                   
                    
                    resolve(update_doc_local);
            
                } else {
                    let text = `percentage not generated`;
                    reject(new Error(text));
                    return;
                }

            } else {
                reject(new Error("page analysis signal not found"));
                return;
            }

        } catch (E) {
            reject(E);
            
        }
    });

};