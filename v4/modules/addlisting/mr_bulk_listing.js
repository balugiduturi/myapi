var mapFun = function (){
     var key = "";
     var value = {
        	"business" : {
		"name" : this.business.name,
		"website" : "http://www3.hilton.com",
		"emails" : [
			""
		],
		"phone_numbers" : [
			"3104104000"
		],
		"buzz_partner_id" : 1974,
		"listing_source" : [
			"dp_private"
		],
		"is_master_record" : "no",
		"version" : 0
	},
	"address" : {
		"street_address" : "5711 West Century Boulevard",
		"locality" : "Los Angeles",
		"region" : "CA",
		"postal_code" : "90045",
		"country_code" : "us"
	},}
     emit(key,value)
	 }
	 
 var redFun = function (hostname, values){
     var reducedObject = {
                          hostname: hostname,
                          count:0,
                          businessname:"",
                          address:"",
                          page_crawled:""
                        };
      values.forEach( function(value) {
              reducedObject.count += value.count;
			  reducedObject.address = value.address;
			  reducedObject.businessname = value.businessname;
			  reducedObject.page_crawled = value.page_crawled;
			 
            
        }
      );
     return reducedObject;
    }
    
db.leads_with_url.mapReduce(mapFun, redFun,
{
query:{},

out : "mr_leads_with_url_domain_unique_with_bname_true_with_addressAndBname"
}
);