const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
const path = require('path');
const mail = require('./mail');
const cors = require('cors');
const OrbitDB = require('orbit-db');
const stream = require('stream');
const web3 = require('./web3');
const contractInstance = require('./contractInstance');

const { encrypt, decrypt } = require('./crypto');
const {
	getBytes32FromIpfsHash,
	getIpfsHashFromBytes32
} = require('./ipfsHashConversion');
require('now-env');

const ipfsOptions = {
	EXPERIMENTAL: {
		pubsub: true
	}
};

const ipfs = new IPFS(ipfsOptions);
const app = express();

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 1000 * 1000 * 12 }
});

let db;

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
		console.log(req.files['primary'][0]);
		const {
			buffer: primaryBuffer,
			originalname: fileName,
			mimetype: contentType
		} = req.files['primary'][0];

		const encryptedPrimary = encrypt(primaryBuffer);
		const primaryAdded = await ipfs.files.add(encryptedPrimary);
		const primaryHash = primaryAdded[0].hash;

		console.log('Primary hash:', primaryHash);
		const previewBuffer = req.files['preview'][0].buffer;

		const previewAdded = await ipfs.files.add(previewBuffer);
		const previewHash = previewAdded[0].hash;
		console.log(previewHash);

		const _id = getBytes32FromIpfsHash(primaryHash);
		const product = { _id, primaryHash, previewHash, fileName, contentType };
		console.log('Preview hash:', previewHash);
		const productHash = await db.put(product);
		console.log(product);
		res.send(product);
	}
);

app.get('/purchase/:id', async (req, res) => {
	//todo sync this in browser and grab db entry directly.
	const product = await db.get(req.params.id.toString());
	if (product) return res.send(product[0]); //TODO fix array requirement
	res.status(400).send();
});

//todo add auth layer
app.get('/download/:id/:signature', async (req, res) => {
	const { id, signature } = req.params;
	const accounts = await web3.eth.getAccounts();
	const signedBy = await web3.eth.personal.ecRecover(
		web3.utils.utf8ToHex(id),
		signature
	);

	contractInstance.methods
		.files(id)
		.call({ from: accounts[0] })
		.then(async file => {
			console.log(file);
			console.log('signedBy', signedBy);
			console.log('buyer', file.buyer);
			if (
				web3.utils.hexToNumberString(signedBy) ===
				web3.utils.hexToNumberString(file.buyer)
			) {
				console.log('Legit. This user has purchased the file. Send it sailor!');
				const product = await db.get(id);
				const { primaryHash, fileName, contentType } = product[0];
				const file = await ipfs.files.cat(primaryHash);
				// TODO stream decrypt?
				const decrypted = decrypt(file);
				const fileStream = new stream.PassThrough();
				fileStream.end(decrypted);
				res.set('Content-disposition', `attachment; filename=${fileName}`);
				res.set('Content-Type', contentType);
				fileStream.pipe(res);
			} else {
				res.sendFile(__dirname + '/public/downloadNonOwner.html');
			}
		})
		.catch(err => console.log(err));
});

ipfs.on('ready', async () => {
	console.log('ipfs node ready');

	const nodeID = await ipfs.id();
	console.log(`Node ID: ${nodeID.id}`);
	const orbitdb = new OrbitDB(ipfs);
	const dbOptions = {
		write: [orbitdb.key.getPublic('hex')] //only we can write to DB
	};
	db = await orbitdb.docs('autumn8.fairpoint', dbOptions);
	await db.load();
	const all = db.query(doc => doc._id);
	console.log(all);

	app.listen(8080, function(a) {
		console.log('Listening to port 8080');
	});
});
