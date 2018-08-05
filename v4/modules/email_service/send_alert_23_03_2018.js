

const nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport(
        {
            host: "mail.dowhosting.net",
            port: 25,
            auth: {
                user: "alerts@digitalscape.info",
                pass: "zRi5l25$"
            },
            tls: {rejectUnauthorized: false},
            logger: false,
            debug: false // include SMTP traffic in the logs
        },
        {

            from: 'central_api_logger <no-reply@vsplash.com>',
            headers: {
                'X-Laziness-level': 1000 // just an example header, no need to use this
            }
        }
);


let message = {
    // Comma separated list of recipients
    to: 'tulsiram <tulasiram@buzzboard.com',

    subject: 'Test mail',

    text: 'Hello to myself!',

    // HTML body
    html:
            '<p><b>Hello</b> to myself </p>'


};

transporter.sendMail(message, (error, info) => {
    if (error) {
        console.log('Error occurred');
        console.log(error);
        return process.exit(1);
    } else {
        console.log('Message sent successfully!');
        console.log(nodemailer.getTestMessageUrl(info));

        // only needed when using pooled connections
        transporter.close();
    }


});