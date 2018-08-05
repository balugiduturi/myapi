

var _ = require('underscore');

module.exports = function (doc) {
    return new Promise(function (resolve, reject) {

        try {

            if (!doc) {
                let text = `doc not sent to buzz_score file`;
                reject(new Error(text));
                return;
            }

            function isEmpty(obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key))
                        return false;
                }
                return true;
            }

            function getCount(obj) {
                let total = 0;
                for (let key in obj) {
                    total = total + obj[key];
                }
                return total;
            }



            var score = 0;
            var percentage = "";
            var grade = "E";



            var fp_score = {
                seo_analysis: {
                    count: 0
                },
                local_analysis: {
                    count: 0
                },
                ppc_analysis: {
                    count: 0
                },
                social_analysis: {
                    count: 0
                },
                mobile_analysis: {
                    count: 0
                }

            };


            if (doc.page_analysis) {
                //****************Mobile Website Analysis*********************
                {

                    let mobile_fields = {};
                    if (doc.page_analysis['bb_mobile_compatible'] && doc.page_analysis['bb_mobile_compatible'] == 1) {
                        score += 5;
                        mobile_fields["mobile_website"] = 5;
                    }
                    if (doc.page_analysis['bb_responsive'] && doc.page_analysis['bb_responsive'] == 1) {
                        score += 3;
                        mobile_fields['mobile_responsive'] = 3;
                    }
                    if (!isEmpty(mobile_fields)) {

                        fp_score["mobile_analysis"]["count"] = Object.values(mobile_fields).reduce((sum, next) => sum + next);

                        if (fp_score["mobile_analysis"]["count"] > 0) {
                            let count = fp_score["mobile_analysis"]["count"];
                            let percentage = (count / 8) * 100;
                            fp_score["mobile_analysis"]["percentage"] = Math.round(percentage);
                        } else {
                            fp_score["mobile_analysis"]["percentage"] = 0;
                        }


                        fp_score["mobile_analysis"]["fields"] = mobile_fields;
                    }


                }
                //****************Mobile Website Analysis Ends*********************




// ****************local analysis starts *************************
                {

                    var localanalysis_fields = {};

                    if (doc.page_analysis['local_phone'] && doc.page_analysis['local_phone'] == 1) {
                        score += 2;
                        localanalysis_fields["local_phone"] = 2;
                    }

                    if (doc.page_analysis['address_on_page'] && doc.page_analysis['address_on_page'] == 1) {
                        score += 1;
                        localanalysis_fields["address_on_page"] = 1;
                    }

                    if (doc.page_analysis['map'] && doc.page_analysis['map'] == 1) {
                        score += 2;
                        localanalysis_fields["map"] = 2;

                    }
                    if (doc.page_analysis['blog'] && doc.page_analysis['blog'] == 1) {
                        score += 1;
                        localanalysis_fields["blog"] = 1;
                    }
                    if (doc.page_analysis['contact_page'] && doc.page_analysis['contact_page'] == 0) {
                        score += 1;
                        localanalysis_fields["contact_page"] = 1;
                    }

                    if (doc['page_analysis']['gallery'] && doc['page_analysis']['gallery'] == 1) {
                        score += 1;
                        localanalysis_fields["gallery"] = 1;
                    }

                    if (doc.page_analysis['privacy_policy'] && doc.page_analysis['privacy_policy'] == 1) {
                        score += 1;
                        localanalysis_fields["privacy_policy"] = 1;
                    }

                    if (!isEmpty(localanalysis_fields)) {

                        Object.keys(localanalysis_fields).reduce(function (sum, next) {
                            console.log("sum----", sum);
                            console.log("next---", next);
                            return localanalysis_fields[sum] + localanalysis_fields[next];
                        });


                        fp_score["local_analysis"]["count"] = Object.values(localanalysis_fields).reduce((sum, next) => sum + next);
                        console.log(fp_score["local_analysis"]["count"])
                        if (fp_score["local_analysis"]["count"] > 0) {
                            let count = fp_score["local_analysis"]["count"];
                            let percentage = (count / 9) * 100;

                            fp_score["local_analysis"]["percentage"] = Math.round(percentage);

                        } else {
                            fp_score["local_analysis"]["percentage"] = 0;
                        }

                        fp_score["local_analysis"]["fields"] = localanalysis_fields;
                    }

                }
                // ****************local analysis ends *************************



// ****************Social Media Analysis starts*************************
                {

                    var socialmedia_fields = {};
                    if (doc.page_analysis['facebook_page'] && doc.page_analysis['facebook_page'] == 1) {
                        score += 4;
                        socialmedia_fields["facebook_page"] = 4;
                    }

                    if (doc.page_analysis['twitter_page'] && doc.page_analysis['twitter_page'] == 1) {
                        score += 4;
                        socialmedia_fields["twitter_page"] = 4;
                    }

                    if (doc.page_analysis['youtube_page'] && doc.page_analysis['youtube_page'] == 1) {
                        score += 3;
                        socialmedia_fields["youtube_page"] = 3;
                    }

                    if (doc.page_analysis['linkedin_page'] && doc.page_analysis['linkedin_page'] == 1) {
                        score += 3;
                        socialmedia_fields["linkedin_page"] = 3;
                    }
                    if (doc.page_analysis['google_plus'] && doc.page_analysis['google_plus'] == 1) {
                        score += 3;
                        socialmedia_fields["google_plus"] = 3;
                    }
                    if (doc.page_analysis['foursquare_page'] && doc.page_analysis['foursquare_page'] == 1) {
                        score += 0;
                        socialmedia_fields["foursquare_page"] = 0;
                    }


                    if (!isEmpty(socialmedia_fields)) {
                        fp_score["social_analysis"]["count"] = Object.values(socialmedia_fields).reduce((sum, next) => sum + next);

                        if (fp_score["social_analysis"]["count"] > 0) {

                            let count = fp_score["social_analysis"]["count"];
                            let percentage = (count / 17) * 100;
                            fp_score["social_analysis"]["percentage"] = Math.round(percentage);
                        } else {
                            fp_score["social_analysis"]["percentage"] = 0;
                        }


                        fp_score["social_analysis"]["fields"] = socialmedia_fields;
                    }



                }
                // ****************Social Media Analysis Ends*************************



                //  ***************  SEO Analysis  starts*************************
                {
                    var seoanalysis_fields = {};

                    if (doc.page_analysis['canonical'] && doc.page_analysis['canonical'] == 1) {
                        score += 3;
                        seoanalysis_fields["canonical"] = 3;
                    }
                    if (doc.page_analysis['robots'] && doc.page_analysis['robots'] == 1) {
                        score += 1;
                        seoanalysis_fields["robots"] = 1;
                    }

                    if (doc.page_analysis['sitemap'] && doc.page_analysis['sitemap'] == 1) {
                        score += 2;
                        seoanalysis_fields["sitemap"] = 2;
                    }
                    if (doc.page_analysis['title_tag_compliance'] && doc.page_analysis['title_tag_compliance'] == 1) {
                        score += 3;
                        seoanalysis_fields["title_tag_compliance"] = 3;
                    }

                    //changed meta_description_compliance from to meta_tag_compliance

                    if (doc.page_analysis['meta_tag_compliance'] && doc.page_analysis['meta_tag_compliance'] == 1) {
                        score += 2;
                        seoanalysis_fields["meta_tag_compliance"] = 2;
                    }

                    if (doc.page_analysis['headings_data']) {
                        if (doc.page_analysis['headings_data']['h1'] && doc.page_analysis['headings_data']['h1'] > 0) {
                            score += 2;
                            seoanalysis_fields["headings_data_h1"] = 2;
                        }
                    }

                    if (doc.page_analysis['image_optimization'] && doc.page_analysis['image_optimization'] == 1) {
                        score += 2;
                        seoanalysis_fields["image_optimization"] = 2;
                    }
                    if (doc.page_analysis['iframe_count'] && doc.page_analysis['iframe_count'] == 0) {
                        score += 2;
                        seoanalysis_fields["iframe_count"] = 2;
                    }

                    if (doc.page_analysis['flash_count'] && doc.page_analysis['flash_count'] == 0) {
                        score += 2;
                        seoanalysis_fields["flash_count"] = 2;
                    }
                    if (doc.page_analysis['microformats'] && doc.page_analysis['microformats'] == 1) {
                        score += 1;
                        seoanalysis_fields["microformats"] = 1;
                    }
                    if (doc.page_analysis['location_in_title'] && doc.page_analysis['location_in_title'] == 1) {
                        score += 1;
                        seoanalysis_fields["location_in_title"] = 1;
                    }
                    if (!isEmpty(seoanalysis_fields)) {
                        fp_score["seo_analysis"]["count"] = Object.values(seoanalysis_fields).reduce((sum, next) => sum + next);

                        if (fp_score["seo_analysis"]["count"] > 0) {
                            let count = fp_score["seo_analysis"]["count"];
                            let percentage = (count / 21) * 100;
                            fp_score["seo_analysis"]["percentage"] = Math.round(percentage);
                        } else {
                            fp_score["seo_analysis"]["percentage"] = 0;
                        }


                        fp_score["seo_analysis"]["fields"] = seoanalysis_fields;
                    }

                }
                //  ***************  SEO Analysis  Ends*************************




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





                //  ***************  PPC starts*************************

                {
                    if (!isEmpty(ppcanalysis_fields)) {
                        var ppcanalysis_fields = {};
                        if (doc.page_analysis['google_adwords'] && doc.page_analysis['google_adwords'] == 1) {
                            score += 6;
                            ppcanalysis_fields ["google_adwords"] = 6;
                        }
                        fp_score["ppc_analysis"]["count"] = Object.values(ppcanalysis_fields).reduce((sum, next) => sum + next);
                        if (fp_score["ppc_analysis"]["count"] > 0) {
                            let count = fp_score["ppc_analysis"]["count"];
                            let percentage = (count / 6) * 100;
                            fp_score["ppc_analysis"]["percentage"] = Math.round(percentage);
                        } else {
                            fp_score["ppc_analysis"]["percentage"] = 0;
                        }

                        fp_score["ppc_analysis"]["fields"] = ppcanalysis_fields;
                    }


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

                    var buzz_score_data = {
                        'opportunity_count': score,
                        'opportunity_score': Math.round(percentage),
                        'opportunity_grade': grade

                    };




                    resolve({buzz_score_data, fp_score});

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