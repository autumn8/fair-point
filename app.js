const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
const mail = require('./mail');
const cors = require('cors');
const { encrypt, decrypt } = require('./crypto');
const {
	getBytes32FromIpfsHash,
	getIpfsHashFromBytes32
} = require('./ipfsHashConversion');
require('now-env');

const node = new IPFS();
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(`${__dirname}/public`));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post(
	'/upload',
	upload.fields([
		{ name: 'primary', maxCount: 1 },
		{ name: 'preview', maxCount: 1 }
	]),
	async (req, res, next) => {
		console.log(req.files);
		console.log(req.body);
		//add preview image
		const file = fs.readFileSync(req.files['preview'][0].path);
		const added = await node.files.add(file);
		const hash = added[0].hash;
		console.log(hash);
		res.send({ success: true, hash });
		//const file = fs.readFileSync(req.file.path);
		// const amount = req.body.title;
		// const encryptedFile = encrypt(file);
		// const added = await node.files.add(encryptedFile);
		// const hash = added[0].hash;
		// console.log('HASH', hash);
		// mail.send('bob@cat.com', hash);
		// const bytes32 = getBytes32FromIpfsHash(hash);
		// console.log(bytes32);
		// const retrievedHash = getIpfsHashFromBytes32(bytes32);
		// console.log(retrievedHash);
		// const fetchedEncryptedFile = await node.files.cat(added[0].hash);

		//fs.writeFileSync('uploads/testicle2.jpg', decrypt(fetchedEncryptedFile));

		//console.log(amount);
	}
);

node.on('ready', async () => {
	console.log('ipfs node ready');
	app.listen(8080, function(a) {
		console.log('Listening to port 8080');
	});
});
