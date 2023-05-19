require('dotenv').config({ path: 'dev.env' })
// console.log(process.env)
const nodemailer = require("nodemailer");
let sendEmail = (subject, message, reciever) => {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email,
            pass: process.env.emailPass
        }
    });
    if(reciever == "mom@gmail.com") {
        console.log("EMAIL CHANGED to varunparbhakar@yahoo.in")
        var mailOptions = {
            from: 'mailerManTypebeat@gmail.com',
            to: "varunparbhakar@yahoo.in",
            subject: subject,
            text: message
        };
    }else {
        var mailOptions = {
            from: 'mailerManTypebeat@gmail.com',
            to: reciever,
            subject: subject,
            text: message
        };
    }

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