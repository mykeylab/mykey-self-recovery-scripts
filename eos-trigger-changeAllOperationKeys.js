let eosjs = require('eosjs');
const ecc = require('eosjs-ecc')
require('dotenv').config();

const httpEndpoint = 'https://eos.greymass.com';
const keyProvider = process.env.PostmanPrivateKey; 

let eos = eosjs({
    keyProvider: keyProvider,
    httpEndpoint: httpEndpoint,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",  // main
    sign: true
});

let contract_mgr = 'mykeymanager'
let contract_logic = 'mykeylogica1'

let account_to = process.env.MykeyAccount;
let index = 0; 

let sign_action = 'kickdeferred';
let def_action = 'chgalloprkey';

(async() => {

    let binArg1 = await eos.abiJsonToBin(contract_logic, sign_action, [account_to, def_action, index]);
    let bin1 = binArg1["binargs"];
    console.log("bin1:", bin1);

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
                    act: sign_action,
                    bin_data: bin1
                }
            }
        ]
    })
        .then(result => {
            console.log("==========send action ok, result:", result);
        });

})();

