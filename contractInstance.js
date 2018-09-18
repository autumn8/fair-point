const web3 = require('./web3');

const FairPoint = require('./contracts/FairPoint.json');
const address = '0xe4651f1f52995f08320a28aa9c0f296fe721ffe4';
const { abi } = FairPoint;

const contractInstance = new web3.eth.Contract(abi, address);

module.exports = contractInstance;
