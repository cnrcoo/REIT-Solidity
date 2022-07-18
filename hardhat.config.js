require('hardhat-deploy');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('solidity-coverage');

/** @type import('hardhat/config').HardhatUserConfig */

PRIVATE_KEY = process.env.PRIVATE_KEY;
RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
	solidity: '0.8.9',
	defaultNetwork: 'hardhat',
	networks: {
		rinkeby: {
			chainId: 4,
			url: RINKEBY_RPC_URL,
			accounts: [PRIVATE_KEY],
		},
	},
	namedAccounts: {
		deployer: {
			default: 0,
			1: 0,
		},
		owner: {
			default: 1,
		},
		shareholder1: {
			default: 2,
		},
		tenant: {
			default: 3,
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
};
