import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { RewardsDistributionFake } from "../../types";
import { deployRewardsDistribution } from "../helper/contract";
import { toDecimal, toFullDigit } from "../helper/number";

// skip, won't be in v1
describe("RewardsDistribution Unit Test", () => {
  let accounts: Wallet[];
  let rewardsDistribution: RewardsDistributionFake;

  beforeEach(async () => {
    accounts = await waffle.provider.getWallets();
    rewardsDistribution = await deployRewardsDistribution(accounts[1].address, accounts[2].address);
  });

  describe("addRewardsDistribution", () => {
    it("add by admin", async () => {
      await rewardsDistribution.addRewardsDistribution(accounts[5].address, toDecimal(100));
      await rewardsDistribution.addRewardsDistribution(accounts[6].address, toDecimal(200));

      const recipient0 = await rewardsDistribution.distributions(0);
      expect(recipient0[0]).eq(accounts[5].address);
      expect(recipient0[1].d).eq(toFullDigit(100));

      const recipient1 = await rewardsDistribution.distributions(1);
      expect(recipient1[0]).eq(accounts[6].address);
      expect(recipient1[1].d).eq(toFullDigit(200));
    });
  });

  describe("editRewardsDistribution", () => {
    it("edit by admin", async () => {
      await rewardsDistribution.addRewardsDistribution(accounts[5].address, toDecimal(100));
      await rewardsDistribution.editRewardsDistribution(0, accounts[6].address, toDecimal(200));
      const recipient = await rewardsDistribution.distributions(0);
      expect(recipient[0]).eq(accounts[6].address);
      expect(recipient[1].d).eq(toFullDigit(200));
    });

    // expectRevert section
    it("force error, the length of distribution is still 0", async () => {
      await expect(
        rewardsDistribution.editRewardsDistribution(0, accounts[5].address, toDecimal(200))
      ).to.be.revertedWith("index out of bounds");
    });

    it("force error, the index exceeds the current length", async () => {
      await rewardsDistribution.addRewardsDistribution(accounts[5].address, toDecimal(100));
      await expect(
        rewardsDistribution.editRewardsDistribution(1, accounts[5].address, toDecimal(200))
      ).to.be.revertedWith("index out of bounds");
    });
  });

  describe("removeRewardsDistribution", () => {
    it("remove by admin", async () => {
      await rewardsDistribution.addRewardsDistribution(accounts[5].address, toDecimal(100));
      await rewardsDistribution.addRewardsDistribution(accounts[6].address, toDecimal(200));
      await rewardsDistribution.removeRewardsDistribution(0);

      const recipient0 = await rewardsDistribution.distributions(0);
      expect(recipient0[0]).eq(accounts[6].address);
      expect(recipient0[1].d).eq(toFullDigit(200));

      let error;
      try {
        await rewardsDistribution.distributions(1);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist;
    });

    // expectRevert section
    it("force error, the length of distribution is still 0", async () => {
      await expect(rewardsDistribution.removeRewardsDistribution(0)).to.be.revertedWith(
        "index out of bounds"
      );
    });

    it("force error, the index exceeds the current length", async () => {
      await rewardsDistribution.addRewardsDistribution(accounts[5].address, toDecimal(100));
      await expect(rewardsDistribution.removeRewardsDistribution(1)).to.be.revertedWith(
        "index out of bounds"
      );
    });
  });
});
