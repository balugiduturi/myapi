global.__mailSender = __filename;
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alerts@p4live.com',
    pass: 'Thg3ydfe#28Uyh2D'
  }
});



var sendEmail = function (subject, sendText, Recivers) {
  if (!Recivers || !Recivers[0])
  Recivers = ["pedanarayana@buzzboard.com", 'tulasiram@buzzboard.com', 'chandresh@buzzboard.com','muralidhars@buzzboard.com']
//    Recivers = ["pedanarayana@buzzboard.com", 'tulasiram@buzzboard.com', 'balu@buzzboard.com', 'chandresh@buzzboard.com'];
  var mailOptions = {
    from: 'alerts@p4live.com',
    to: Recivers,
    subject: subject,
    text: sendText
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports.sendEmail = sendEmail;