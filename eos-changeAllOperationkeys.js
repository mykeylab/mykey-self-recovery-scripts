let eosjs = require('eosjs');
const ecc = require('eosjs-ecc');
require('dotenv').config();

const httpEndpoint = 'https://eos.greymass.com';
const keyProvider = process.env.PostmanPrivateKey; 

let eos = eosjs({
    keyProvider: keyProvider,
    httpEndpoint: httpEndpoint,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",  // main
    sign: true
});

let contract_mgr = 'mykeymanager';
let contract_logic = 'mykeylogica1';

let account_to = process.env.MykeyAccount;
let new_keys = [process.env.NewOperatorKey, process.env.NewOperatorKey, process.env.NewOperatorKey];

let sign_action = 'chgalloprkey';
let sign_key_index = 0; // sign with admin key

(async() => {

    console.log(account_to, new_keys)
    let binArg1 = await eos.abiJsonToBin(contract_logic, sign_action, [account_to, new_keys]);
    let bin1 = binArg1["binargs"];
    console.log("bin1:", bin1);

    let res = await  eos.getTableRows({
        code:contract_mgr,
        scope:account_to,
        table:'keydata',
        json: true,
        lower_bound:sign_key_index,
        limit:1
    });
    let row = res.rows[0];
    let key = row['key'];
    let nonce = key['nonce'];
    console.log(nonce);

    let msg = account_to + ":" + sign_action + ":" + bin1 + ":" + nonce;

    var digest = ecc.sha256(msg);
    var privkey = process.env.AdminkeyPrivateKey;// admin key

    var sigstr = ecc.signHash(digest, privkey).toString();
    console.log(sigstr);

    let binArg2 = await eos.abiJsonToBin(contract_logic, 'sendinternal', [sign_action, sigstr, bin1]);
    let bin2 = binArg2["binargs"];
    console.log("bin2:", bin2);

    // let binArg3 = await eos.abiJsonToBin(contract_logic, 'sendexternal', [sigstr, bin2]);
    // let bin3 = binArg3["binargs"];
    // console.log("bin3:", bin3);

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
                    act: "sendinternal",
                    bin_data: bin2
                }
            }
        ]
    })
        .then(result => {
            console.log("==========send action ok, result:", result);
        });

})();

