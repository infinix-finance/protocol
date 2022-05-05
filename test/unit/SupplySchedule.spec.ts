import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { Minter, IfnxTokenMock, SupplyScheduleFake } from "../../types";
import { deployMinter, deploySupplySchedule } from "../helper/contract";
import { deployIfnxTokenMock } from "../helper/mockContract";
import { toFullDigit } from "../helper/number";

// skip, won't be in v1
describe("SupplySchedule Unit Test", () => {
  let admin: Wallet;
  let alice: Wallet;
  let ifnxToken: IfnxTokenMock;
  let supplySchedule: SupplyScheduleFake;
  let minter: Minter;

  const inflationRate = toFullDigit(0.01);
  const decayRate = toFullDigit(0.01);
  const mintDuration = ethers.BigNumber.from(7 * 24 * 60 * 60); // 7 days
  const supplyDecayPeriod = ethers.BigNumber.from(7 * 24 * 60 * 60 * 209); // 209 weeks

  beforeEach(async () => {
    const addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    ifnxToken = await deployIfnxTokenMock();
    minter = await deployMinter(ifnxToken.address);
    supplySchedule = await deploySupplySchedule(
      minter.address,
      inflationRate,
      decayRate,
      mintDuration
    );
  });

  async function gotoNextMintTime(): Promise<void> {
    const nextMintTime = await supplySchedule.nextMintTime();
    await supplySchedule.mock_setBlockTimestamp(nextMintTime);
  }

  describe("isMintable", () => {
    it("is not mintable before start", async () => {
      expect(await supplySchedule.isMintable()).be.false;
    });

    it("is not mintable before start", async () => {
      await supplySchedule.startSchedule();
      expect(await supplySchedule.isMintable()).be.false;
      await gotoNextMintTime();
      expect(await supplySchedule.isMintable()).be.true;
    });
  });

  describe("startSchedule", async () => {
    it("can't start by account which is not owner", async () => {
      await expect(
        supplySchedule.connect(alice).startSchedule(),
        
      ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
    });

    it("start after a while", async () => {
      expect(await supplySchedule.supplyDecayEndTime()).eq(0);
      await supplySchedule.startSchedule();
      const now = await supplySchedule.mock_getCurrentTimestamp();
      const supplyDecayEndTime = now.add(supplyDecayPeriod);
      expect(await supplySchedule.supplyDecayEndTime()).eq(supplyDecayEndTime);
    });
  });

  describe("mintableSupply", () => {
    it("zero when it's not mintable", async () => {
      expect((await supplySchedule.mintableSupply()).d).eq(0);
    });

    it("based on inflationRate before decay end", async () => {
      await supplySchedule.startSchedule();
      await gotoNextMintTime();
      await ifnxToken.setTotalSupply(toFullDigit(100));

      // 100 * 1% = 1
      expect((await supplySchedule.mintableSupply()).d).eq(toFullDigit(1));
    });

    it("will keeps the fixed inflationRate after decay end", async () => {
      await supplySchedule.startSchedule();
      const now = await supplySchedule.mock_getCurrentTimestamp();
      const supplyDecayEndTime = now.add(supplyDecayPeriod);
      await supplySchedule.mock_setBlockTimestamp(supplyDecayEndTime);
      await ifnxToken.setTotalSupply(toFullDigit(100));

      // 100 * 0.04749% ~= 0.04749
      expect((await supplySchedule.mintableSupply()).d).eq("47497069730730000");
    });
  });
});
