const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ankr.com/eth'));

// accountStorage contract
let accountStorageAddr = "0xADc92d1fD878580579716d944eF3460E241604b7"
const AccountStorageAbi = require('./abi/AccountStorage.abi.json')
let accountStorage = new web3.eth.Contract(AccountStorageAbi, accountStorageAddr);

// accountLogic contract 
let accountLogicAddr = "0x205dc661Ee6946319ebb0698A017BCc20549910F"
let AccountLogicAbi = require('./abi/AccountLogic.abi.json')
let accountLogic = new web3.eth.Contract(AccountLogicAbi, accountLogicAddr);

const GasPrice = '16.000001' // Gwei
const Gas = 250000

let MykeyAccount = process.env.MykeyAccountAddress
let pks = [process.env.NewOperatorKey, process.env.NewOperatorKey, process.env.NewOperatorKey];

(async () => {
	let nonce = await getNonce();
	console.log(nonce)

	let data = web3.eth.abi.encodeFunctionCall({
		name: 'changeAllOperationKeys',
		type: 'function',
		inputs: [{
			type: 'address',
			name: 'account'
		}, {
			type: 'address[]',
			name: 'pks'
		}]
	}, [MykeyAccount, pks]);

	let msg = '0x1900' + accountLogicAddr.slice(2) + data.slice(2) + nonce.toString('16').slice(2);
	let hash = web3.utils.soliditySha3(msg);
	console.log('hash:', hash);
	var adminKeyOnchain = await accountStorage.methods.getKeyData(MykeyAccount, 0).call(); // admin key
	let adminKey = web3.eth.accounts.privateKeyToAccount(process.env.AdminkeyPrivateKey)
	console.log(`adminKeyOnchain ${adminKeyOnchain}, adminKey from AdminkeyPrivateKey ${adminKey.address}`);

	if (adminKeyOnchain != adminKey.address) {
		console.log(`AdminkeyPrivateKey is incorrect`);
		return
	}

	let sig = await web3.eth.accounts.sign(hash, process.env.AdminkeyPrivateKey);
	sig = sig.signature;
	sig = fixSignature(sig);
	console.log('MykeyAccount:', MykeyAccount);
	console.log('sig:', sig);
	console.log('data:', data);
	console.log('nonce:', nonce);

	var myData = accountLogic.methods.enter(data, sig, nonce).encodeABI();
	var ethValue = web3.utils.toHex(web3.utils.toWei('0', 'ether'));

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
			value: ethValue,
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

async function getNonce() {
	// await sleep(1000);
	return web3.eth.abi.encodeParameter('uint256', Math.floor(Date.now() * 1000));
}

function fixSignature(signature) {
	// in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
	// signature malleability if version is 0/1
	// see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
	let v = parseInt(signature.slice(130, 132), 16);
	if (v < 27) {
		v += 27;
	}
	const vHex = v.toString(16);
	return signature.slice(0, 130) + vHex;
}

