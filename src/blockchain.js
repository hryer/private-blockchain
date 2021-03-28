/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const e = require('express');

class Blockchain {
	/**
	 * Constructor of the class, you will need to setup your chain array and the height
	 * of your chain (the length of your chain array).
	 * Also everytime you create a Blockchain class you will need to initialized the chain creating
	 * the Genesis Block.
	 * The methods in this class will always return a Promise to allow client applications or
	 * other backends to call asynchronous functions.
	 */
	constructor() {
		this.chain = [];
		this.height = -1;
		this.initializeChain();
	}

	/**
	 * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
	 * You should use the `addBlock(block)` to create the Genesis Block
	 * Passing as a data `{data: 'Genesis Block'}`
	 */
	async initializeChain() {
		if (this.height === -1) {
			let block = new BlockClass.Block({ data: 'Genesis Block' });
			await this._addBlock(block);
		}
	}

	/**
	 * Utility method that return a Promise that will resolve with the height of the chain
	 */
	getChainHeight() {
		return new Promise((resolve, reject) => {
			resolve(this.height);
		});
	}

	/**
	 * _addBlock(block) will store a block in the chain
	 * @param {*} block
	 */
	_addBlock(block) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			if (self.chain.length > 0) {
				const prevBlock = await self.getBlockByHeight(self.height);
				block.previousBlockHash = prevBlock.hash;
			}
			block.height = self.chain.length;
			block.time = new Date().getTime().toString().slice(0, -3);
			block.hash = SHA256(JSON.stringify(block)).toString();
			self.chain.push(block);

			if (self.height !== self.chain.length) {
				self.height++;
				resolve(block);
			} else {
				reject(block);
			}
		}).catch((e) => {
			return e;
		});
	}

	/**
	 * The requestMessageOwnershipVerification(address) method
	 * will allow you  to request a message that you will use to
	 * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
	 * This is the first step before submit your Block.
	 * The method return a Promise that will resolve with the message to be signed
	 * @param {*} address
	 */
	requestMessageOwnershipVerification(address) {
		return new Promise((resolve, reject) => {
			if (!address) {
				reject('address empty');
			} else {
				resolve(`${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`);
			}
		});
	}

	/**
	 * The submitStar(address, message, signature, star) method
	 * will allow users to register a new Block with the star object
	 * into the chain. This method will resolve with the Block added or
	 * reject with an error.
	 * @param {*} address
	 * @param {*} message
	 * @param {*} signature
	 * @param {*} star
	 */
	submitStar(address, message, signature, star) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			const validateChain = self.validateChain();

			if (validateChain.length > 0) {
				resolve(validateChain);
			} else {
				// default getTime is ms thant slice into -3 it means the unit is second so divide by 60 to get the minute
				const diffTime = parseInt(new Date().getTime().toString().slice(0, -3)) - parseInt(message.split(':')[1]);
				if (diffTime / 60 <= 5) {
					const verified = await bitcoinMessage.verify(message, address, signature);

					if (verified) {
						const res = await self._addBlock(new BlockClass.Block({ owner: address, star }));
						resolve(res);
					} else {
						reject('error: You are not verified');
					}
				} else {
					reject('error: message timeout, try again to requestValidation ');
				}
			}
		}).catch((e) => {
			return e;
		});
	}

	/**
	 * This method will return a Promise that will resolve with the Block
	 *  with the hash passed as a parameter.
	 * Search on the chain array for the block that has the hash.
	 * @param {*} hash
	 */
	getBlockByHash(hash) {
		let self = this;
		return new Promise((resolve, reject) => {
			const block = self.chain.filter((b) => b.hash === hash)[0];
			if (block) {
				resolve(block);
			} else {
				reject(null);
			}
		});
	}

	/**
	 * This method will return a Promise that will resolve with the Block object
	 * with the height equal to the parameter `height`
	 * @param {*} height
	 */
	getBlockByHeight(height) {
		let self = this;
		return new Promise((resolve) => {
			const block = self.chain.find((p) => p.height === height);
			if (block) {
				resolve(block);
			} else {
				resolve(null);
			}
		});
	}

	/**
	 * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
	 * and are belongs to the owner with the wallet address passed as parameter.
	 * Remember the star should be returned decoded.
	 * @param {*} address
	 */
	getStarsByWalletAddress(address) {
		let self = this;
		let stars = [];

		return new Promise((resolve, reject) => {
			self.chain.forEach(async b => {
        const data = await b.getBData();
				if (data.owner === address) {
					stars.push(data);
				}
			});
			if (stars) {
				resolve(stars);
			} else {
				reject('data not found');
			}
		});
	}

	/**
	 * This method will return a Promise that will resolve with the list of errors when validating the chain.
	 */
	validateChain() {
		let self = this;
		let errorLog = [];
		return new Promise(async (resolve, reject) => {
			let prevHash = null;
			self.chain.forEach( async block => {
				if (block.previousBlockHash !== prevHash) {
					errorLog.push({
						prevHash,
						blockPrevHash: block.previousBlockHash,
						message: 'error: prevHash and blockPrevHash not valid',
					});
				}
				prevHash = block.hash;

				if(await block.validate() === false) {
					errorLog.push({
						prevHash,
						blockPrevHash: block.previousBlockHash,
						message: "error: data has been modified or data it's not valid",
					});
				}
			});

			resolve(errorLog);
		}).catch((e) => {
			return e;
		});
	}
}

module.exports.Blockchain = Blockchain;
