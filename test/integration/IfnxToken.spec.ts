import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { Minter, IfnxToken, RewardsDistributionFake, SupplyScheduleFake } from "../../types";
import { fullDeploy } from "../helper/deploy";
import { toDecimal, toFullDigit } from "../helper/number";

describe("IfnxToken Test", () => {
  let addresses: Wallet[];
  let admin: Wallet;
  let alice: Wallet;
  let ifnxToken: IfnxToken;
  let minter: Minter;
  let supplySchedule: SupplyScheduleFake;
  let rewardsDistribution!: RewardsDistributionFake;

  const ifnxInflationRate = toFullDigit(0.005);
  const ifnxDecayRate = toFullDigit(0.01);
  const mintDuration = ethers.BigNumber.from(7 * 24 * 60 * 60); // 7 days
  const supplyDecayPeriod = ethers.BigNumber.from(7 * 24 * 60 * 60 * 209); // 209 weeks
  const ifnxInitSupply = toFullDigit(100_000_000); // 100M

  async function forwardBlockTimestamp(time: number): Promise<void> {
    const now = await supplySchedule.mock_getCurrentTimestamp();
    await supplySchedule.mock_setBlockTimestamp(now.add(time));
  }

  async function gotoNextMintTime(): Promise<void> {
    const mintDuration = await supplySchedule.mintDuration();
    await forwardBlockTimestamp(mintDuration.toNumber());
  }

  beforeEach(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    const contracts = await fullDeploy({
      sender: admin.address,
      quoteTokenAmount: toFullDigit(2000000),
      ifnxInitSupply,
      ifnxDecayRate,
      ifnxRewardVestingPeriod: ethers.BigNumber.from(0),
      ifnxInflationRate,
      tollRatio: toFullDigit(0.05),
      spreadRatio: toFullDigit(0.05),
    });
    ifnxToken = contracts.ifnxToken;
    supplySchedule = contracts.supplySchedule;
    rewardsDistribution = contracts.rewardsDistribution;
    minter = contracts.minter;

    await forwardBlockTimestamp(0);
  });

  describe("mintReward", () => {
    it("mintReward too early", async () => {
      await expect(minter.mintReward()).to.be.revertedWith("no supply is mintable");
    });

    it("mintReward success", async () => {
      await forwardBlockTimestamp(mintDuration.toNumber());
      const receipt = await minter.mintReward();

      // 100m * 0.5%
      expect(receipt).to.emit(minter, "IfnxMinted").withArgs(toFullDigit(500000));
    });

    it("mintReward late but still success", async () => {
      await forwardBlockTimestamp(mintDuration.toNumber() * 2);
      const receipt = await minter.mintReward();

      // 100m * 0.5%
      expect(receipt).to.emit(minter, "IfnxMinted").withArgs(toFullDigit(500000));
    });

    it("mintReward and distribute to an invalid rewardRecipient", async () => {
      const chad = addresses[10];
      await rewardsDistribution.addRewardsDistribution(chad.address, toDecimal(1));
      await forwardBlockTimestamp(mintDuration.toNumber());
      await minter.mintReward();
      expect(await ifnxToken.balanceOf(chad.address)).eq(toFullDigit(1));
    });

    it("mintReward", async () => {
      const supply = await ifnxToken.totalSupply();
      await gotoNextMintTime();

      const receipt = await minter.connect(admin).mintReward();
      expect(receipt).to.emit(minter, "IfnxMinted").withArgs(supply.mul(5).div(1000));
      const newSupply = await ifnxToken.totalSupply();

      // should be 100_500_000
      expect(newSupply).to.eq(toFullDigit(100500000));
    });

    it("mintReward twice too early", async () => {
      await gotoNextMintTime();
      await minter.mintReward();

      const nextMintTime = await supplySchedule.nextMintTime();
      await supplySchedule.mock_setBlockTimestamp(nextMintTime.sub(1));

      await expect(minter.mintReward()).to.be.revertedWith("no supply is mintable");
    });

    it("mintReward twice", async () => {
      await gotoNextMintTime();
      await minter.mintReward();

      await gotoNextMintTime();
      await minter.mintReward();

      const newSupply = await ifnxToken.totalSupply();

      // first minted result: 100_500_000,
      // inflation rate after first minted, 0.5% x (1 - 1%) = 0.495%
      // 100_500_000 x 100.495% = 100_998_747.5 * 10**18
      expect(newSupply).to.eq(toFullDigit(100997475));
    });

    it("mintReward at 4 years later", async () => {
      const now = await supplySchedule.mock_getCurrentTimestamp();
      await supplySchedule.mock_setBlockTimestamp(now.add(supplyDecayPeriod));
      const receipt = await minter.mintReward();

      // 100M * 0.047497% ~= 47497
      expect(receipt).to.emit(minter, "IfnxMinted").withArgs("47497069730730000000000");
    });

    it("not reach next mintable time", async () => {
      const supply = await ifnxToken.totalSupply();

      const nextMintTime = await supplySchedule.nextMintTime();
      await supplySchedule.mock_setBlockTimestamp(nextMintTime.sub(1));

      await expect(minter.mintReward()).to.be.revertedWith("no supply is mintable");

      const newSupply = await ifnxToken.totalSupply();
      expect(newSupply).to.eq(supply);
    });
  });
});
