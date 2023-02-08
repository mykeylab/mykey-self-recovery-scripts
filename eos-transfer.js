let eosjs = require('eosjs');
const ecc = require('eosjs-ecc')
require('dotenv').config();

const httpEndpoint = 'https://eos.greymass.com';
const keyProvider = process.env.PostmanPrivateKey; //tx sender on mainnet: mykeyuserxxx

let eos = eosjs({
    keyProvider: keyProvider,
    httpEndpoint: httpEndpoint,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",  // main
    sign: true
});

let contract_mgr = 'mykeymanager';
let contract_logic = 'mykeylogica1';
let account_from = process.env.MykeyAccount;
let account_to = process.env.ToAccount;
let quantity = '0.0001 EOS'

let target_contract = process.env.TokenAccount;
let sign_action = 'transfer';//'sayhello'//'transfer';
let sign_key_index = 1; // sign with the first operation key

(async() => {

    let binArg1 = await eos.abiJsonToBin(target_contract, sign_action, [account_from, account_to, quantity, ''])
    let bin1 = binArg1["binargs"];
    console.log("bin1:", bin1);

    let binArg2 = await eos.abiJsonToBin(contract_mgr, 'forward', [target_contract, sign_action, account_from, bin1]);
    let bin2 = binArg2["binargs"];
    console.log("bin2:", bin2);

    let res = await eos.getTableRows({
        code:contract_mgr,
        scope:account_from,
        table:'keydata',
        json: true
    });
    let row = res.rows[sign_key_index];
    let key = row['key'];
    let nonce = key['nonce'];
    let pub = key['pubkey'];
    console.log(`pub ${pub} nonce ${nonce}`);

    let msg = account_from + ":" + sign_action + ":" + bin2 + ":" + nonce;
    var digest = ecc.sha256(msg);
    var privkey = process.env.AssetkeyPrivateKey;// asset key

    var sigstr = ecc.signHash(digest, privkey).toString();
    console.log(sigstr);

    let binArg3 = await eos.abiJsonToBin(contract_logic, 'sendexternal', [sigstr, bin2]);
    let bin3 = binArg3["binargs"];
    console.log("bin3:", bin3);

    eos.transaction({
            actions: [
                {
                    account: contract_mgr,
                    name: "sendaction",
                    authorization: [
                        {
                            actor: process.env.PostmanAccount,
                            permission: "active"
                        }
                    ],
                    data: {
                        act: "sendexternal",
                        bin_data: bin3
                    }
                }
            ]
        })
        .then(result => {
            console.log("==========send action ok, result:", result);
        });

})();

