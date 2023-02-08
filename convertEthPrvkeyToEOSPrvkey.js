
// Extracted from https://github.com/eoscafe/eoskeyio

const ecc = require('eosjs-ecc');
const eth = require('ethereumjs-util');

let ethereumPrivateKey = '';

if (eth.isValidPrivate(Buffer.from(ethereumPrivateKey, 'hex'))) {
    let ethereumAddress = '0x' + eth.privateToAddress(Buffer.from(ethereumPrivateKey, 'hex')).toString('hex')
    let ethereumPublicKey = eth.privateToPublic(Buffer.from(ethereumPrivateKey, 'hex')).toString('hex')

    // Create EOS keys
    let eosWIF = ecc.PrivateKey(Buffer.from(ethereumPrivateKey, 'hex')).toWif()
    let convertedEOSPrivateKey = eosWIF
    let convertedEOSPublicKey = ecc.privateToPublic(eosWIF)

    console.log(`EOS Private Key: ${convertedEOSPrivateKey}`)
    console.log(`EOS Public Key: ${convertedEOSPublicKey}`)
} else {
    console.log("Invalid Ethereum Private Key")
}