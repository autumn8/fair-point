const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
require('now-env');
const nodemailer = require('nodemailer');

const node = new IPFS();
const app = express();
const upload = multer({ dest: 'uploads/' });
const { EMAIL_USER, EMAIL_PASSWORD } = process.env;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/public`));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

var crypto = require('crypto'),
	algorithm = 'aes-256-ctr',
	password = 'd6F3Efeq';

function encrypt(buffer) {
	var cipher = crypto.createCipher(algorithm, password);
	var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
	return crypted;
}

function decrypt(buffer) {
	var decipher = crypto.createDecipher(algorithm, password);
	var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
	return dec;
}

// const crypto = require('crypto');
//
// const algorithm = 'aes192';
// const password = 'password';
// const encrypt = crypto.createCipher(algorithm, password);
// const decrypt = crypto.createDecipher(algorithm, password);
// const input = fs.createReadStream('uploads/de341c0f2082e1189b63705baa61637a');
//
// const output = fs.createWriteStream('test.enc');
//
// const stream = ipfs.files.addReadableStream()
// stream.on('data', function (file) {
//   console.log(file);
// })
//
// stream.write({
//   path: <path>
//   content: <data>
// })
// // write as many files as you want
//
// stream.end()
// })

// input
// 	.pipe(encrypt)
// 	.pipe(decrypt)
// 	.pipe(output);

// nodemailer.createTestAccount((err, account) => {
// 	// create reusable transporter object using the default SMTP transport
// 	console.log(account.user);
// 	console.log(account.pass);
// 	let transporter = nodemailer.createTransport({
// 		host: 'smtp.ethereal.email',
// 		port: 587,
// 		secure: false, // true for 465, false for other ports
// 		auth: {
// 			user: account.user, // generated ethereal user
// 			pass: account.pass // generated ethereal password
// 		}
// 	});
//
// 	// setup email data with unicode symbols
// 	let mailOptions = {
// 		from: '"Fred Foo 👻" <foo@example.com>', // sender address
// 		to: 'bar@example.com, baz@example.com', // list of receivers
// 		subject: 'Hello ✔', // Subject line
// 		text: 'Hello world?', // plain text body
// 		html: '<b>Hello world?</b>' // html body
// 	};
//
// 	// send mail with defined transport object
// 	transporter.sendMail(mailOptions, (error, info) => {
// 		if (error) {
// 			return console.log(error);
// 		}
// 		console.log('Message sent: %s', info.messageId);
// 		// Preview only available when sending through an Ethereal account
// 		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//
// 		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
// 		// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
// 	});
// });

app.post('/upload', upload.single('design'), async (req, res, next) => {
	const file = fs.readFileSync(req.file.path);
	const encryptedFile = encrypt(file);
	const added = await node.files.add(encryptedFile);
	console.log('HASH', added[0].hash);

	const fetchedEncryptedFile = await node.files.cat(added[0].hash);

	fs.writeFileSync('uploads/testicle.jpg', fetchedEncryptedFile);
	//fs.writeFileSync('uploads/testicle.jpg', decrypt(fetchedEncryptedFile));
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
});

(async () => {
	// const file = await fs.readFile('uploads/de341c0f2082e1189b63705baa61637a');
	// const encryptedFile = encrypt(file);
	//
	// //const file = fs.readFileSync(req.file.path);
	// const hash = await node.files.add(encryptedFile);
	// console.log(hash);
	// const ipfsFile = node.files.cat(hash);
	// console.log(decrypt(ipfsFile));
})();

node.on('ready', async () => {
	console.log('ipfs node ready');
	app.listen(8080, function(a) {
		console.log('Listening to port 808');
	});

	// const files = [
	// 	{
	// 		path: 'uploads/de341c0f2082e1189b63705baa61637a',
	// 		content: fs.readFileSync('uploads/de341c0f2082e1189b63705baa61637a')
	// 	}
	// ];

	//const filesAdded = await node.files.add(files);

	//console.log('Added file:', filesAdded[0].path, filesAdded[0].hash);
	//console.log(filesAdded);

	//const fileBuffer = await node.files.cat(filesAdded[0].hash);
});
