# FAIR POINT

*Note: This repo is not actively maintained. Dependencies will currently break.*

The Fairpoint application enables image authors to encrypt & upload images to IPFS, with object references stored in orbitDb.

The application exposes express endpoints through which an image can be uploaded, encrypted, and subsequently added to IPFS. 

After a user has purchased a file by interacting with the fair point solidity contract (see https://github.com/autumn8/fair-point-dapp repo for solidity contract and dapp) they are able to claim the unencrypted image through offchain signatures (signed through metamask for example). 