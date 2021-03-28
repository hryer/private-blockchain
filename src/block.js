/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform,
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {
	constructor(data) {
		this.hash = null;
		this.height = 0;
		this.body = Buffer(JSON.stringify(data)).toString('hex');
		this.time = 0;
		this.previousBlockHash = null;
	}

	/**
	 *  validate() method will validate if the block has been tampered or not.
	 */
	validate() {
		const self = this;
		return new Promise((resolve, reject) => {
			const validHash = self.hash;
      /*
        if use self.hash = null, the current value on the class will be null also.
        Which is making a bug on the future. it's still better using temporary var instead nulling this.hash
      */
			const currentData = {
        hash: null,
				height: self.height,
				body: self.body,
				time: self.time,
				previousBlockHash: self.previousBlockHash,
			};
			const currentHash = SHA256(JSON.stringify(currentData)).toString();

			if (currentHash === validHash) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	}

	/**
	 *  Auxiliary Method to return the block body (decoding the data)
	 *  Steps:
	 *
	 *  1. Use hex2ascii module to decode the data
	 *  2. Because data is a javascript object use JSON.parse(string) to get the Javascript Object
	 *  3. Resolve with the data and make sure that you don't need to return the data for the `genesis block`
	 *     or Reject with an error.
	 */
	getBData() {
		return this.height !== 0 ? JSON.parse(hex2ascii(this.body)) : 'Error: Genesis Block';
		// Getting the encoded data saved in the Block
		// Decoding the data to retrieve the JSON representation of the object
		// Parse the data to an object to be retrieve.
		// Resolve with the data if the object isn't the Genesis block
	}
}

module.exports.Block = Block; // Exposing the Block class as a module
