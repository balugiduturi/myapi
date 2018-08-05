'use strict';

const nodemailer = require('nodemailer');

//create SMTP transporter object (account object creation )

module.exports = nodemailer.createTransport(
    {
        host: "mail.dowhosting.net",
        port: 25,
        auth: {
            user: "alerts@digitalscape.info",
            pass: "zRi5l25$"
        },
        logger: false,
        debug: false // include SMTP traffic in the logs
    },
    {
        // default message fields

        // sender info
        from: 'central_api <no-reply@buzzboard.com>',
        headers: {
            'X-Laziness-level': 1000 // just an example header, no need to use this
        }
    }
);

