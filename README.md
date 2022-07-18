# REIT Smart Contract
 
 This is a recreation of a simple real estate investment trust coded with solidity. 
 
### Introduction
 The goal of the smart contract is to create a REIT with <br />
  -Collect tax, <br />
  -Distribute revenue, <br />
  -Add/ban shareholders, <br />
  -Buy/sell shares functions. <br />
  
  ***Tested with hardhat mocha/chai.***
 
### Installation
First, install the necessary dependencies.
```sh
yarn install # or npm
```
Create a .env file for your <br />
***PRIVATE_KEY***, <br />
***RPC_URL*** for desired testnet to deploy, <br />
and ***ETHERSCAN_API_KEY*** to verify the contract after deployment.

### Preview
Contract has been deployed on [Rinkeby Testnet](https://rinkeby.etherscan.io) at [***0x88AE1eAdEF7e806fb40E36BAc1C8f36e2E61f7D5***](https://rinkeby.etherscan.io/address/0x88ae1eadef7e806fb40e36bac1c8f36e2e61f7d5) and ***verified!***

[REIT.sol](https://github.com/cnrcoo/REIT-Solidity/blob/master/contracts/REIT.sol) can also be used on [Remix](https://remix.ethereum.org/).
