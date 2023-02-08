const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ankr.com/eth'));

// accountLogic contract 
let accountLogicAddr = "0x205dc661Ee6946319ebb0698A017BCc20549910F"
let AccountLogicAbi = require('./abi/AccountLogic.abi.json')
let accountLogic = new web3.eth.Contract(AccountLogicAbi, accountLogicAddr);

const GasPrice = '25.000001' // Gwei
const Gas = 250000

let MykeyAccount = process.env.MykeyAccountAddress
let pks = [process.env.NewOperatorKey, process.env.NewOperatorKey, process.env.NewOperatorKey];

(async () => {

	// var myData = accountLogic.methods.triggerChangeAdminKey(account, pknew).encodeABI();
	var myData = accountLogic.methods.triggerChangeAllOperationKeys(MykeyAccount, pks).encodeABI();

	let postmanAccount = web3.eth.accounts.privateKeyToAccount(process.env.PostmanPrivateKey)
	const estimateGas = await web3.eth.estimateGas({
		to: accountLogicAddr,
		data: myData
	})
	console.log(`estimateGas ${estimateGas}`)

	web3.eth.getTransactionCount(postmanAccount.address, 'latest', (err, txCount) => {
		console.log(`${postmanAccount.address}, ${txCount}`);

		// Build the transaction
		const txObject = {
			nonce: web3.utils.toHex(txCount),
			to: accountLogicAddr,
			value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
			gasLimit: web3.utils.toHex(Gas),
			gasPrice: web3.utils.toHex(web3.utils.toWei(GasPrice, 'gwei')),
			data: myData
		}
		console.log(txObject)

		// Sign the transaction
		const tx = new Tx(txObject);
		tx.sign(Buffer.from(process.env.PostmanPrivateKey, 'hex'));

		const serializedTx = tx.serialize();
		const raw = '0x' + serializedTx.toString('hex');
		console.log(raw)

		// Broadcast the transaction
		const transaction = web3.eth.sendSignedTransaction(raw, (err, tx) => {
			console.log("tx hash:", tx)
		});
	});

})();

