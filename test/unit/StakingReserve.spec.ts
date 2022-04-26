import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { IfnxTokenMock, StakingReserve } from "../../types";
import { deployStakingReserve } from "../helper/contract";
import { deployIfnxTokenMock } from "../helper/mockContract";

// skip, won't be in v1
describe("StakingReserve Spec", () => {
  let admin: Wallet;
  let alice: Wallet;
  let ifnxToken: IfnxTokenMock;
  let clearingHouse: Wallet;
  let stakingReserve: StakingReserve;
  let vestingPeriod: number;

  beforeEach(async () => {
    const addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];
    clearingHouse = addresses[2];
    const supplyScheduleMock = addresses[2];
    vestingPeriod = 1;

    ifnxToken = await deployIfnxTokenMock();
    stakingReserve = await deployStakingReserve(
      ifnxToken.address,
      supplyScheduleMock.address,
      clearingHouse.address,
      ethers.BigNumber.from(vestingPeriod)
    );
    await stakingReserve.setRewardsDistribution(admin.address);
  });

  describe("claimFeesAndVestedReward", () => {
    it("can't claim if there's no reward", async () => {
      await expect(stakingReserve.claimFeesAndVestedReward()).to.be.revertedWith(
        "no vested reward or fee"
      );
    });
  });
});
