const nodemailer = require("nodemailer");
let sendEmail = (subject, message, reciever) => {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email,
            pass: process.env.emailPass
        }
    });

    var mailOptions = {
        from: 'mailerManTypebeat@gmail.com',
        to: reciever,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

}

module.exports = { 
    sendEmail
}