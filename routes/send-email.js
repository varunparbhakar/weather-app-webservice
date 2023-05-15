var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'varunparbhakar8@gmail.com',
        pass: process.env.emailPass
    }
});

var mailOptions = {
    from: 'mailerManTypebeat@gmail.com',
    to: 'varunparbhakar@yahoo.in',
    subject: 'Testing',
    text: `Listen here, I'm sending you a million dollars, take it or leave it https://www.youtube.com/watch?v=d2Yx8o7ymCM`
};

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});