/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




var chai = require('chai');

let chaiHttp = require('chai-http');

var should = chai.should();
chai.use(chaiHttp);
var addlisting_single_body = require(`./mock_data/addlisting_single.js`);
var addlisting_bulk_body = require(`./mock_data/addlisting_bulk.js`);

var API_URl = process.env.BASE_URL ? (`${process.env.BASE_URL}:${8086}`) : (`localhost:${8086}`);



//listing edit
//describe('LISTING -EDIT', () => {
//
//    /* add listing with proper data*/
//
//    describe('/POST addlisting', () => {
//        it('it should get acknowlegement as process started', (done) => {
//
//            chai.request(API_URl)
//                .post('/v4/listing/edit')
//                .set("Authorization", "Bearer 5e0a50d50229b7f0a49c2c6f814e01a9258ac927")
//                .send(addlisting_single_body)
//                .end((err, res) => {
//                    if (!err) {
//
//                        res.should.have.status(200);
//                        res.body.should.be.a('object');
//                        res.body.should.have.property('message');
//                        res.body.should.to.not.have.property('error');
//                        res.body.should.have.property('fp_id');
//                        done();
//                    } else {
//
//                        console.log(err);
//                        done();
//                    }
//
//
//                })
//
//        })
//    })
//
//})



