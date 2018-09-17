const Web3 = require('web3');
require('now-env');

const HDWalletProvider = require('truffle-hdwallet-provider');
const { MNEMONIC, PROVIDER_URL } = process.env;
var provider = new HDWalletProvider(MNEMONIC, PROVIDER_URL);
const web3 = new Web3(provider);

module.exports = web3;
