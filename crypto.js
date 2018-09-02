const crypto = require('crypto');
const algorithm = 'aes-128-cbc';
require('now-env');
const { ENCRYPTION_PASSWORD } = process.env;
const password = ENCRYPTION_PASSWORD;

function encrypt(buffer) {
	const cipher = crypto.createCipher(algorithm, password);
	const crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
	return crypted;
}

function decrypt(buffer) {
	const decipher = crypto.createDecipher(algorithm, password);
	const dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
	return dec;
}

module.exports = { encrypt, decrypt };
