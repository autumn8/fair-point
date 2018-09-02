const nodemailer = require('nodemailer');
require('now-env');
const { EMAIL_USER, EMAIL_PASSWORD } = process.env;

function send(to, hash) {
	nodemailer.createTestAccount((err, account) => {
		console.log('created account');
		let transporter = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false, // true for 465, false for other ports
			auth: {
				user: account.user, // generated ethereal user
				pass: account.pass // generated ethereal password
			}
		});

		// setup email data with unicode symbols
		let mailOptions = {
			from: '"fair point" <info@fairpoint.com>', // sender address
			to: 'bar@example.com, baz@example.com', // list of receivers
			subject: 'Your file is ready', // Subject line
			html: `Your file is ready for purchase at <a>http://localhost/${hash}</a>`
		};

		console.log(mailOptions);

		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				return console.log(error);
			}
			console.log('Message sent: %s', info.messageId);
			console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		});
	});
}

module.exports = { send };
