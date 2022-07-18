const { messagePrefix } = require('@ethersproject/hash');
const { assert, expect } = require('chai');
const { ethers, deployments } = require('hardhat');

describe('REIT Unit Tests', function () {
	let deployer,
		owner,
		shareholder1,
		notShareholder,
		tenant,
		newRent,
		sharesAmount,
		sharesPrice;

	beforeEach(async () => {
		accounts = await ethers.getSigners();
		deployer = accounts[0];
		owner = accounts[1];
		shareholder1 = accounts[2];
		notShareholder = accounts[3];
		tenant = accounts[4];
		newRent = 300;
		sharesAmount = Math.floor(Math.random() * 100 + 1); //in any case it will be less than 100
		sharesPrice = Math.floor(Math.random() * 100000 + 1); //random price var.

		await deployments.fixture(['reit']); //deploying the contract here
		reit = await ethers.getContract('RealEstateInvestmentTrust', deployer);

		await reit.setTax(10); // Tax is 10%
	});

	describe('constructor', () => {
		it('Initializes the authority correctly', async () => {
			assert.equal(deployer.address, await reit.getAuthorityAddress());
		});

		it('Adds the authority to the shareholders array', async () => {
			isShareholder = await reit.isShareholder(deployer.address);

			assert(isShareholder);
		});
	});

	describe('setMainPropertyOwner', () => {
		it('Sets the main prop. owner correctly', async () => {
			await reit.setMainPropertyOwner(owner.address);
			ownerAddress = await reit.getMainPropertyOwnerAddress();

			assert.equal(owner.address, ownerAddress);
		});

		it('Adds the owner to shareholders array', async () => {
			await reit.setMainPropertyOwner(owner.address);
			isShareholder = await reit.isShareholder(owner.address);
			assert(isShareholder[0]);
		});

		it('Gives all the shares to the main prop. owner', async () => {
			await reit.setMainPropertyOwner(owner.address);
			sharesOf = await reit.showSharesOf(owner.address);

			assert.equal(sharesOf.toString(), '100');
		});
	});

	describe('addShareholder', () => {
		it('Adds a new shareholder', async () => {
			await reit.addShareholder(shareholder1.address);
			isShareholder = await reit.isShareholder(shareholder1.address);
			assert(isShareholder[0]);
		});

		it('Emits event when a new shareholder is added', async () => {
			await expect(reit.addShareholder(shareholder1.address))
				.to.emit(reit, 'ShareholderAdded')
				.withArgs(shareholder1.address);
		});
	});

	describe('banShareholder', () => {
		it('Bans an existing shareholder', async () => {
			await reit.addShareholder(shareholder1.address); //there need to be a shareholder
			await reit.banShareholder(shareholder1.address);
			isShareholder = await reit.isShareholder(shareholder1.address);
			assert(!isShareholder[0]);
		});

		it('Does not let others to ban shareholders', async () => {
			await reit.addShareholder(shareholder1.address); //there need to be a shareholder
			await expect(reit.connect(owner).banShareholder(shareholder1.address))
				.to.be.reverted;
		});

		it('Emits an event when a shareholder is banned', async () => {
			await expect(reit.addShareholder(shareholder1.address))
				.to.emit(reit, 'ShareholderAdded')
				.withArgs(shareholder1.address);
		});
	});

	describe('seizureFrom', () => {
		it('Authority seizes the shares of the shareholder', async () => {
			await reit.setMainPropertyOwner(owner.address);

			await reit.seizureFrom(owner.address, deployer.address, 100);
			authorityShares = await reit.showSharesOf(deployer.address);

			assert.equal(authorityShares.toString(), '100');
		});

		it('Emits an event when shares are seizured', async () => {
			await reit.setMainPropertyOwner(owner.address);
			await expect(reit.seizureFrom(owner.address, deployer.address, 100))
				.to.emit(reit, 'Seizure')
				.withArgs(owner.address, deployer.address, 100);
		});
	});

	describe('setTax', () => {
		it('Changes the tax with the new tax value', async () => {
			await reit.setTax(20);
			newTax = await reit.showTax();

			assert.equal(newTax.toString(), '20');
		});

		it('Emits an event when tax is changed', async () => {
			await expect(reit.setTax(20))
				.to.emit(reit, 'ChangedTax')
				.withArgs('20');
		});
	});

	//distribute

	describe('setTenant', () => {
		it('Sets the tenant correctly', async () => {
			await reit.setMainPropertyOwner(owner.address);
			await reit.connect(owner).setTenant(tenant.address);
			newTenant = await reit.showTenant();

			assert.equal(tenant.address, newTenant.toString());
		});

		it('Emits an event when tenant is set', async () => {
			await reit.setMainPropertyOwner(owner.address);
			expect(reit.connect(owner).setTenant(tenant.address))
				.to.emit(reit, 'ChangedTenant')
				.withArgs(tenant.address);
		});
	});

	describe('setRent', () => {
		it('Can only be called by the owner', async () => {
			await expect(reit.setRent(newRent)).to.be.reverted;
		});

		it('Sets the rent correctly', async () => {
			await reit.setMainPropertyOwner(owner.address);

			await reit.connect(owner).setRent(newRent);
			rent = await reit.showRent();

			assert.equal(newRent, rent);
		});

		it('Emits an event when rent is set', async () => {
			await reit.setMainPropertyOwner(owner.address);
			await expect(reit.connect(owner).setRent(newRent))
				.to.emit(reit, 'RentPer30DaySetTo')
				.withArgs(newRent);
		});
	});

	describe('offerShare', () => {
		it('Checks only the shareholder can offer shares', async () => {
			expect(reit.connect(notShareholder).offerShare(10, 10)).to.be.reverted;
		});

		it('Checks the shareholder can only offer shares less than they have', async () => {
			await reit.setMainPropertyOwner(owner.address); // by default owner has (max of) 100 shares
			totalShares = await reit.showSharesOf(owner.address);
			await reit.connect(owner).offerShare(sharesAmount, sharesPrice);

			expect(sharesAmount).to.be.lt(totalShares);
		});

		it('Emits an event when a shareholder offered shares', async () => {
			await expect(reit.offerShare(0, sharesPrice)).to.emit(
				reit,
				'SharesOffered'
			);
		});
	});

	describe('buyShares', () => {
		it('Checks if the caller is a shareholder', async () => {
			await expect(
				reit
					.connect(notShareholder)
					.buyShares(shareholder1.address, sharesAmount)
			).to.be.reverted;
		});

		// it('Transfers the money to seller, shares to buyer, and emits an event', async () => {
		// 	await reit.setMainPropertyOwner(owner.address); // owner with 100 shares
		// 	await reit.addShareholder(shareholder1.address); // shareholder1

		// 	totalCost = sharesAmount * sharesPrice;

		// 	await reit.connect(owner).offerShare(sharesAmount, sharesPrice); // owner offers sharesAmount of shares
		// 	await reit
		// 		.connect(shareholder1)
		// 		.buyShares(sharesAmount, owner.address)
		// 		.send({
		// 			from: shareholder1.address,
		// 			value: totalCost,
		// 		});

		// 	// await expect(
		// 	// 	reit.connect(shareholder1).buyShares(sharesAmount, owner.address)
		// 	// )
		// 	// 	.to.emit(reit, 'SharesSold')
		// 	// 	.withArgs(owner.address, shareholder1, sharesAmount, sharesPrice);
		// });
	});
});
