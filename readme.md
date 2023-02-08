# MYKEY self recovery
工具目前支持两条链ETH和EOS，用户可以使用密钥和执行脚本，自行恢复资产。具体分为两种情况
1. 能正常打开MYKEY APP
2. 仅持有管理密钥助词

## 情况1-能正常打开MYKEY APP
1. 使用安卓手机安装MYKEY Recover Scan APP，并导出**操作密钥**
安装和使用步骤参考 https://github.com/mykeylab/MYKEYRecoverScanAPP

2. 调用transfer脚本，将MYKEY中的资产转到其他账户
- ETH链
    根据token类型，分别使用 eth-transfer.js 或者 eth-transfer-erc20.js
    创建配置文件.env，参考 [.env.eth.transfer.sample](https://github.com/mykeylab/mykey-self-recovery-scripts/blob/master/.env.eth.transfer.sample)。
    ```
    PostmanPrivateKey，   Postman账户的私钥, 是可以用于支付链上Gas或者资源的账号的私钥
    AssetkeyPrivateKey，  步骤1中导出的操作密钥 
    MykeyAccountAddress， MYKEY账户ETH地址
    ToAccountAddress，    转账的目标账户的地址
    TokenAddress，        ERC20合约地址（ETH不需要该配置）
    ```
    
    
- EOS链
    使用 eos-transfer.js 脚本
    创建配置文件.env，参考 [.env.eos.transfer.sample](https://github.com/mykeylab/mykey-self-recovery-scripts/blob/master/.env.eos.transfer.sample)
    ```
    PostmanAccount,   Postman账户的地址 
    PostmanPrivateKey,    Postman账户的私钥
    MykeyAccount，     MYKEY账户EOS地址
    AssetkeyPrivateKey,   步骤1中导出的操作密钥 
    ToAccount，       转账的目标账户的地址
    TokenAccount,     Token合约账户，比如EOS是eosio.token
    ```

## 情况2-仅持有管理密钥助记词
根据助记词导出管理密钥，再修改资产密钥(有7天延时)。 修改完成后，再通过情况1的步骤2，进行资产恢复
1. 从助记词导出管理密钥
具体使用步骤，参考 https://github.com/mykeylab/MYKEYMnemonicTool


2. 修改操作密钥
修改操作密钥，需要等待7天。到期后按照步骤三发送触发交易后, 新的操作密钥才会生效。

- ETH链
提前生成新的操作密钥，本地保存好密钥的备份。 密钥的生成，参考 https://ethereum.org/en/developers/docs/accounts/#account-creation
使用 eth-changeAllOperationKeys.js 脚本进行链上更新。
创建配置文件.env，参考 [.env.eth.OperationKeys.sample](https://github.com/mykeylab/mykey-self-recovery-scripts/blob/master/.env.eth.OperationKeys.sample)
    ```
    PostmanPrivateKey，   Postman账户的私钥
    AdminkeyPrivateKey，  步骤1中导出的管理密钥
    MykeyAccountAddress， MYKEY账户ETH地址
    NewOperatorKey，      新的操作密钥
    ```

- EOS链
提前生成新的操作密钥，本地保存好密钥的备份。密钥的生成，参考 https://eosauthority.com/blog/How_to_generate_EOS_private_and_public_key_pairs
使用 eos-changeAllOperationKeys.js 脚本进行链上更新。
创建配置文件.env，参考 [.env.eos.OperationKeys.sample](https://github.com/mykeylab/mykey-self-recovery-scripts/blob/master/.env.eos.OperationKeys.sample)
    ```
    PostmanAccount，      Postman账户的地址
    PostmanPrivateKey，   Postman账户的私钥
    MykeyAccount，        MYKEY账户的地址
    AdminkeyPrivateKey，  步骤1中导出的管理密钥
    MykeyAccountAddress， MYKEY账户EOS地址
    NewOperatorKey，      新的操作密钥
    ```
    
3. 触发修改操作密钥的延时交易
- ETH链， 执行 eth-trigger-changeAllOperationKeys.js, 配置文件与步骤2中的相同
- EOS链， 执行 eos-trigger-changeAllOperationKeys.js, 配置文件与步骤2中的相同


