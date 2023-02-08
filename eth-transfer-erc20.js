const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ankr.com/eth'));

// accountStorage contract
let accountStorageAddr = "0xADc92d1fD878580579716d944eF3460E241604b7"
const AccountStorageAbi = require('./abi/AccountStorage.abi.json')
let accountStorage = new web3.eth.Contract(AccountStorageAbi, accountStorageAddr);

// transfer contract 
let transferLogicAddr = "0x1C2349ACBb7f83d07577692c75B6D7654899BF10"
let TransferLogicAbi = require('./abi/TransferLogic.abi.json')
let transferLogic = new web3.eth.Contract(TransferLogicAbi, transferLogicAddr);

// erc20 contract 
let tokenAddr = process.env.TokenAddress
let Erc20Abi = require('./abi/ERC20.abi.json')
let erc20Contract = new web3.eth.Contract(Erc20Abi, tokenAddr);

const TransferGasPrice = '25.000001' // Gwei
const TransferGas = 250000 

let MykeyAccount = process.env.MykeyAccountAddress
let ToAccount = process.env.ToAccountAddress
let TokenAmount = '1';

(async () => {
    let tokenBalance = await erc20Contract.methods.balanceOf(MykeyAccount).call(); // erc20 balance
    TokenAmount = tokenBalance
    console.log(`MykeyAccount ${MykeyAccount}, tokenAddr ${tokenAddr}, TokenAmount ${TokenAmount}`)
    if(TokenAmount == 0) {
        console.log(`TokenAmount is 0`);
        return
    }

    let nonce = await getNonce();
    console.log(nonce)

    let data = web3.eth.abi.encodeFunctionCall({
        name: 'transferErc20',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'from'
        }, {
            type: 'address',
            name: 'to'
        }, {
            type: 'address',
            name: 'token'
        }, {
            type: 'uint256',
            name: 'amount'
        }]
    }, [MykeyAccount, ToAccount, tokenAddr, TokenAmount]);
    let msg = '0x1900' + transferLogicAddr.slice(2) + data.slice(2) + nonce.toString('16').slice(2);
    console.log('msg:', msg);
    let hash = web3.utils.soliditySha3(msg);
    console.log('hash:', hash);
    var assetKeyOnchain = await accountStorage.methods.getKeyData(MykeyAccount, 1).call(); // asset key
    let assetKey = web3.eth.accounts.privateKeyToAccount(process.env.AssetkeyPrivateKey)
    console.log(`assetKeyOnchain ${assetKeyOnchain}, assetKey from AssetkeyPrivateKey ${assetKey.address}`);

    if (assetKeyOnchain != assetKey.address) {
        console.log(`AssetkeyPrivateKey is incorrect`);
        return
    }

    let sig = await web3.eth.accounts.sign(hash, process.env.AssetkeyPrivateKey);
    sig = sig.signature;
    sig = fixSignature(sig);
    console.log('MykeyAccount:', MykeyAccount);
    console.log('sig:', sig);
    console.log('data:', data);
    console.log('nonce:', nonce);

    var myData = transferLogic.methods.enter(data, sig, nonce).encodeABI();
    console.log("myData:", myData);
    var ethValue = web3.utils.toHex(web3.utils.toWei('0', 'ether'));//////

    let postmanAccount = web3.eth.accounts.privateKeyToAccount(process.env.PostmanPrivateKey)
    // console.log(postmanAccount)

    const estimateGas = await web3.eth.estimateGas({
        to: transferLogicAddr,
        data: myData
    })
    console.log(`estimateGas ${estimateGas}`)

    web3.eth.getTransactionCount(postmanAccount.address, 'latest', (err, txCount) => {
        console.log(`${postmanAccount.address}, ${txCount}`);
        // Build the transaction
        const txObject = {
            nonce: web3.utils.toHex(txCount),
            to: transferLogicAddr,
            value: ethValue,
            gasLimit: web3.utils.toHex(TransferGas),
            gasPrice: web3.utils.toHex(web3.utils.toWei(TransferGasPrice, 'gwei')),
            data: myData
        }
        console.log(txObject)

        // Sign the transaction
        const tx = new Tx(txObject);
        tx.sign(Buffer.from(process.env.PostmanPrivateKey, 'hex'));

        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex');
        console.log("raw:", raw)

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

