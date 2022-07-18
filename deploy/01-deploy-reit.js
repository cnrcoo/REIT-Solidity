const { getNamedAccounts, deployments } = require('hardhat');
const { verify } = require('../scripts/verify');

const P_NAME = 'CINARCO';
const P_SYMBOL = 'CNR';
const TAX = 10;

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	const args = [P_NAME, P_SYMBOL, TAX];

	const REIT = await deploy('RealEstateInvestmentTrust', {
		from: deployer,
		args: args,
		log: true,
	});
	console.log(REIT.address);

	if (chainId === 4 && process.env.ETHERSCAN_API_KEY) {
		await verify(REIT.address, args);
	}
};

module.exports.tags = ['all', 'reit'];
