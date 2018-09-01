const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
require('now-env');

const node = new IPFS();
const app = express();
const upload = multer({ dest: 'uploads/' });
const { EMAIL_USER, EMAIL_PASSWORD } = process.env;
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/public`));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

// const transporter = nodemailer.createTransport({
// 	host: 'smtp.ethereal.email',
// 	port: 587,
// 	auth: {
// 		user: `EMAIL_USER`,
// 		pass: `EMAIL_PASSWORD`
// 	}
// });

app.post('/upload', upload.single('design'), async (req, res, next) => {
	console.log(req.file);
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
	const file = fs.readFileSync(req.file.path);
	const hash = await node.files.add(file);
	console.log(hash);
});

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
