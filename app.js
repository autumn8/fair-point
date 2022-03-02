const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
const sharp = require('sharp');
const cors = require('cors');
const OrbitDB = require('orbit-db');
const stream = require('stream');
const web3 = require('./web3');
const contractInstance = require('./contractInstance');
const { __ } = require('./utils');

const { encrypt, decrypt } = require('./crypto');
const {
	getBytes32FromIpfsHash,
	getIpfsHashFromBytes32
} = require('./ipfsHashConversion');
require('now-env');

const ipfsOptions = {
	EXPERIMENTAL: {
		pubsub: true
	},
	config: {
		Addresses: {
			Swarm: [
				'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
			]
		}
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

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post(
	'/upload',
	upload.fields([
		{ name: 'primary', maxCount: 1 },
		{ name: 'preview', maxCount: 1 }
	]),
	async (req, res, next) => {		
		
		const {
			buffer: primaryBuffer,
			originalname: fileName,
			mimetype: contentType
		} = req.files['primary'][0];

		const title = req.body.title;
		const encryptedPrimary = encrypt(primaryBuffer);
		const primaryAdded = await ipfs.files.add(encryptedPrimary);
		const primaryHash = primaryAdded[0].hash;

		//console.log('Primary hash:', primaryHash);
		const previewBuffer = req.files['preview'][0].buffer;
		const thumbnailCreated = await __(
			sharp(previewBuffer)
				.resize(250, 250)
				.toBuffer()
		);
		if (thumbnailCreated.error) {
			console.log('error creating thumbnail');
			return;
		}
		const thumbNailAdded = await ipfs.files.add(thumbnailCreated.data);
		const thumbNailHash = thumbNailAdded[0].hash;		

		const previewAdded = await ipfs.files.add(previewBuffer);
		const previewHash = previewAdded[0].hash;
		

		const _id = getBytes32FromIpfsHash(primaryHash);
		const file = {
			_id,
			primaryHash,
			previewHash,
			thumbNailHash,
			title,
			fileName,
			contentType
		};
		
		const productHash = await db.put(file);
		console.log(file);
		res.send(file);
	}
);

app.get('/purchase/:id', async (req, res) => {
	const file = await db.get(req.params.id.toString());
	if (file) return res.send(file[0]); // TODO fix array requirement
	res.status(400).send();
});

app.get('/files', async (req, res) => {
	// TODO handle errors
	console.log('getting files');
	const data = await db.query(doc => doc._id);
	console.log(data);
	res.send(data);
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
	console.log(db.address.toString());
	db.drop();  //TODO N.B. This is only to drop db for testing purposes. Remove for deployment.
	//await db.load();
	const all = db.query(doc => doc._id);
	console.log(all);

	app.listen(8081, function (a) {
		console.log('Listening to port 8081');
	});
});
