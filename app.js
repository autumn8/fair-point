const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const IPFS = require('ipfs');
const fs = require('fs');
const mail = require('./mail');
const cors = require('cors');
const OrbitDB = require('orbit-db');
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
const upload = multer({ dest: 'uploads/' });

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
		console.log(req.body);
		//add preview image
		// TODO create better way of doing this
		const primary = fs.readFileSync(req.files['primary'][0].path);
		const encryptedPrimary = encrypt(primary);
		const primaryAdded = await ipfs.files.add(encryptedPrimary);
		const primaryHash = primaryAdded[0].hash;

		const preview = fs.readFileSync(req.files['preview'][0].path);
		const previewAdded = await ipfs.files.add(preview);
		const previewHash = previewAdded[0].hash;
		const { price } = req.body;
		// _id is the hash of the encrypted file. Also contains price and preview hash.
		const product = { _id: primaryHash, previewHash, price };
		const productHash = await db.put(product);
		console.log(productHash);
		res.send({ success: true, primaryHash });

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

app.get('/purchase/:id', async (req, res) => {
	const product = await db.get(req.params.id.toString());
	if (product) return res.send(product);
	res.status(400).send();
});

ipfs.on('ready', async () => {
	console.log('ipfs node ready');

	const nodeID = await ipfs.id();
	console.log(`Node ID: ${nodeID.id}`);

	const dbOptions = {
		write: ['*']
	};

	const orbitdb = new OrbitDB(ipfs);
	db = await orbitdb.docs('autumn8.fairpoint', dbOptions);
	await db.load();
	const all = db.query(doc => doc._id);
	console.log(all);

	app.listen(8080, function(a) {
		console.log('Listening to port 8080');
	});
});
