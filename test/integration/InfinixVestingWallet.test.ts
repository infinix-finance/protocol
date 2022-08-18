import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Wallet } from "ethers";
import { InfinixVestingWallet, IfnxToken } from "../../types";

const { parseUnits } = ethers.utils;

async function mine(seconds: number): Promise<void> {
  await ethers.provider.send("evm_mine", [seconds]);
}

describe("InfinixVestingWallet Unit Test", () => {
  let vestingWallet: InfinixVestingWallet;
  let ifnxToken: IfnxToken;
  let admin: Wallet;
  let alice: Wallet;

  const OneDayInSeconds = 60 * 60 * 24;
  let startTS: number;

  before(async () => {
    [admin, alice] = waffle.provider.getWallets();

    const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
    startTS = currentTS + OneDayInSeconds;

    const InfinixVestingWallet = await ethers.getContractFactory("InfinixVestingWallet");
    vestingWallet = await InfinixVestingWallet.deploy(alice.address, startTS);

    const IfnxToken = await ethers.getContractFactory("IfnxToken");
    ifnxToken = await IfnxToken.deploy(0);
    await ifnxToken.addMinter(admin.address);
    await ifnxToken.mint(vestingWallet.address, parseUnits("1000000", 18));
  });

  describe("Deployment", () => {
    it("should be valid deployments", async () => {
      expect(await vestingWallet.beneficiary()).to.eq(alice.address);
      expect(await vestingWallet.start()).to.eq(startTS);
      expect(await vestingWallet.duration()).to.eq(730 * OneDayInSeconds);
      expect(await ifnxToken.totalSupply()).to.eq(parseUnits("1000000", 18));
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.eq(parseUnits("1000000", 18));
    });

    it("InfinixVestingWallet deployment should fail without beneficiary address", async () => {
      const InfinixVestingWallet = await ethers.getContractFactory("InfinixVestingWallet");
      await expect(InfinixVestingWallet.deploy(ethers.constants.AddressZero, 0)).to.be.revertedWith(
        "VestingWallet: beneficiary is zero address"
      );
    });
  });

  describe("Before vesting period starts", () => {
    it("vested amount should be zero", async () => {
      const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        await vestingWallet["vestedAmount(address,uint64)"](ifnxToken.address, currentTS)
      ).to.eq(0);
    });

    it("should not be able to release tokens", async () => {
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.eq(0);
      await vestingWallet["release(address)"](ifnxToken.address);
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.eq(0);
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.eq(parseUnits("1000000", 18));
      expect(await ifnxToken.balanceOf(alice.address)).to.eq(0);
    });
  });

  describe("Between vesting start period and duration end", () => {
    it("6 months after start timestamp", async () => {
      await mine(startTS + OneDayInSeconds * 30 * 6);
      const tokenCalcMargin = parseUnits("4000", 18);
      const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        await vestingWallet["vestedAmount(address,uint64)"](ifnxToken.address, currentTS)
      ).to.be.closeTo(parseUnits("250000", 18), tokenCalcMargin);

      await vestingWallet["release(address)"](ifnxToken.address);
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.be.closeTo(
        parseUnits("250000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.be.closeTo(
        parseUnits("750000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(alice.address)).to.be.closeTo(
        parseUnits("250000", 18),
        tokenCalcMargin
      );
    });

    it("12 months after start timestamp", async () => {
      await mine(startTS + OneDayInSeconds * 30 * 12);
      const tokenCalcMargin = parseUnits("8000", 18);
      const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        await vestingWallet["vestedAmount(address,uint64)"](ifnxToken.address, currentTS)
      ).to.be.closeTo(parseUnits("500000", 18), tokenCalcMargin);

      await vestingWallet["release(address)"](ifnxToken.address);
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.be.closeTo(
        parseUnits("500000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.be.closeTo(
        parseUnits("500000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(alice.address)).to.be.closeTo(
        parseUnits("500000", 18),
        tokenCalcMargin
      );
    });

    it("18 months after start timestamp", async () => {
      await mine(startTS + OneDayInSeconds * 30 * 18);
      const tokenCalcMargin = parseUnits("12000", 18);
      const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        await vestingWallet["vestedAmount(address,uint64)"](ifnxToken.address, currentTS)
      ).to.be.closeTo(parseUnits("750000", 18), tokenCalcMargin);

      await vestingWallet["release(address)"](ifnxToken.address);
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.be.closeTo(
        parseUnits("750000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.be.closeTo(
        parseUnits("250000", 18),
        tokenCalcMargin
      );
      expect(await ifnxToken.balanceOf(alice.address)).to.be.closeTo(
        parseUnits("750000", 18),
        tokenCalcMargin
      );
    });
  });

  describe("After duration end", () => {
    it("730 days after start timestamp", async () => {
      await mine(startTS + OneDayInSeconds * 730);
      const currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        await vestingWallet["vestedAmount(address,uint64)"](ifnxToken.address, currentTS)
      ).to.be.eq(parseUnits("1000000", 18));

      await vestingWallet["release(address)"](ifnxToken.address);
      expect(await vestingWallet["released(address)"](ifnxToken.address)).to.be.eq(
        parseUnits("1000000", 18)
      );
      expect(await ifnxToken.balanceOf(vestingWallet.address)).to.be.eq(0);
      expect(await ifnxToken.balanceOf(alice.address)).to.be.eq(parseUnits("1000000", 18));
    });

    it("should not work after releasing full allocation", async () => {
      await mine(startTS + OneDayInSeconds * 731);
      await vestingWallet["release(address)"](ifnxToken.address);

      let currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      const iniVestedAmount = await vestingWallet["vestedAmount(address,uint64)"](
        ifnxToken.address,
        currentTS
      );
      const iniReleased = await vestingWallet["released(address)"](ifnxToken.address);
      const iniUserBal = await ifnxToken.balanceOf(alice.address);
      const iniVestingWalletBal = await ifnxToken.balanceOf(vestingWallet.address);

      await vestingWallet["release(address)"](ifnxToken.address);

      currentTS = (await ethers.provider.getBlock("latest")).timestamp;
      const finalVestedAmount = await vestingWallet["vestedAmount(address,uint64)"](
        ifnxToken.address,
        currentTS
      );
      const finalReleased = await vestingWallet["released(address)"](ifnxToken.address);
      const finalUserBal = await ifnxToken.balanceOf(alice.address);
      const finalVestingWalletBal = await ifnxToken.balanceOf(vestingWallet.address);

      expect(iniVestedAmount).to.be.eq(finalVestedAmount);
      expect(iniReleased).to.be.eq(finalReleased);
      expect(iniUserBal).to.be.eq(finalUserBal);
      expect(iniVestingWalletBal).to.be.eq(finalVestingWalletBal);
    });
  });
});
