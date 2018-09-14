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
	},
	config: {
		Addresses: {
			Swarm: [
				// Use IPFS dev signal server
				'/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star'
				//'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
				// Use local signal server
				// '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
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
		const primary = req.files['primary'][0].buffer;
		const encryptedPrimary = encrypt(primary);
		const primaryAdded = await ipfs.files.add(encryptedPrimary);
		const primaryHash = primaryAdded[0].hash;

		console.log('Primary hash:', primaryHash);

		//const fetchedEncryptedFile = await ipfs.files.cat(primaryHash);

		//fs.writeFileSync('uploads/decrypt.jpg', decrypt(fetchedEncryptedFile));

		const preview = req.files['preview'][0].buffer;
		//fs.writeFileSync('uploads/thing.jpg', preview);
		const previewAdded = await ipfs.files.add(preview);
		const previewHash = previewAdded[0].hash;
		console.log(previewHash);

		const _id = getBytes32FromIpfsHash(primaryHash);
		const product = { _id, primaryHash, previewHash };
		console.log('Preview hash:', previewHash);
		const productHash = await db.put(product);
		console.log(product);
		res.send(product);

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
	if (product) return res.send(product[0]); //TODO fix array requirement
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
	db = await orbitdb.docs('autumn8.fairpoint2', dbOptions);
	//db.drop();
	//await db.load();
	const all = db.query(doc => doc._id);
	console.log(all);

	app.listen(8080, function(a) {
		console.log('Listening to port 8080');
	});
});
