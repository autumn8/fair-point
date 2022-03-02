const web3 = require('./web3');

const FairPoint = require('./contracts/FairPoint.json');
const address = '0xC1b6816665f796349c951B85faE4473341644386';
const { abi } = FairPoint;

const contractInstance = new web3.eth.Contract(abi, address);

module.exports = contractInstance;
