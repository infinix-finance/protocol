import { expect } from "chai";
import { Wallet, BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import { DecimalERC20Fake, ERC20Fake, ERC20MinimalFake, TetherToken } from "../../types";
import { deployErc20Fake } from "../helper/contract";
import { toDecimal, toFullDigit } from "../helper/number";

describe("DecimalERC20", () => {
  let decimalErc20: DecimalERC20Fake;
  let erc20: ERC20Fake;
  let tether: TetherToken;
  let admin: Wallet;
  let alice: Wallet;
  let bob: Wallet;
  let decimal: BigNumber;
  let digit: BigNumber;

  beforeEach(async () => {
    const addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];
    bob = addresses[2];
    const DecimalERC20FakeFactory = await ethers.getContractFactory("DecimalERC20Fake");
    decimalErc20 = await DecimalERC20FakeFactory.deploy();
    await decimalErc20.deployed();
  });

  describe("decimal = 8", () => {
    beforeEach(async () => {
      decimal = ethers.BigNumber.from(8);
      digit = ethers.BigNumber.from(10).pow(decimal);

      const totalSupply = ethers.BigNumber.from(1000).mul(digit);
      erc20 = await deployErc20Fake(totalSupply, "NAME", "SYMBOL", decimal);
    });

    it("approve", async () => {
      await decimalErc20.approve(erc20.address, alice.address, toDecimal(5));
      expect(await erc20.allowance(decimalErc20.address, alice.address)).eq(
        ethers.BigNumber.from(5).mul(digit)
      );
    });

    it("allowance", async () => {
      await erc20.connect(admin).approve(alice.address, ethers.BigNumber.from(5).mul(digit));
      const allowance = await decimalErc20.allowance(erc20.address, admin.address, alice.address);
      expect(allowance.d).eq(toFullDigit(5));
    });

    it("transfer", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await erc20.transfer(decimalErc20.address, fiveInEightDigit);
      await decimalErc20.transfer(erc20.address, alice.address, toDecimal(5));
      expect(await erc20.balanceOf(alice.address)).eq(fiveInEightDigit);
    });

    it("balanceOf", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await erc20.transfer(decimalErc20.address, fiveInEightDigit);
      const balance = await decimalErc20.balanceOf(erc20.address, decimalErc20.address);
      expect(balance.d).eq(toFullDigit(5));
    });

    it("transferFrom", async () => {
      await erc20.approve(decimalErc20.address, ethers.BigNumber.from(5).mul(digit));
      await decimalErc20.transferFrom(erc20.address, admin.address, alice.address, toDecimal(5));
      expect(await erc20.balanceOf(alice.address)).eq(ethers.BigNumber.from(5).mul(digit));
    });
  });

  describe("decimal = 20", () => {
    beforeEach(async () => {
      decimal = ethers.BigNumber.from(20);
      digit = ethers.BigNumber.from(10).pow(decimal);

      const totalSupply = ethers.BigNumber.from(1000).mul(digit);
      erc20 = await deployErc20Fake(totalSupply, "NAME", "SYMBOL", decimal);
    });

    it("approve", async () => {
      await decimalErc20.approve(erc20.address, alice.address, toDecimal(5));
      expect(await erc20.allowance(decimalErc20.address, alice.address)).eq(
        ethers.BigNumber.from(5).mul(digit)
      );
    });

    it("allowance", async () => {
      await erc20.connect(admin).approve(alice.address, ethers.BigNumber.from(5).mul(digit));
      const allowance = await decimalErc20.allowance(erc20.address, admin.address, alice.address);
      expect(allowance.d).eq(toFullDigit(5));
    });

    it("transfer", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInTwentyDigit = five.mul(digit);
      await erc20.transfer(decimalErc20.address, fiveInTwentyDigit);
      await decimalErc20.transfer(erc20.address, alice.address, toDecimal(5));
      expect(await erc20.balanceOf(alice.address)).eq(fiveInTwentyDigit);
    });

    it("balanceOf", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await erc20.transfer(decimalErc20.address, fiveInEightDigit);
      const balance = await decimalErc20.balanceOf(erc20.address, decimalErc20.address);
      expect(balance.d).eq(toFullDigit(5));
    });

    it("transferFrom", async () => {
      await erc20.approve(decimalErc20.address, ethers.BigNumber.from(5).mul(digit));
      await decimalErc20.transferFrom(erc20.address, admin.address, alice.address, toDecimal(5));
      expect(await erc20.balanceOf(alice.address)).eq(ethers.BigNumber.from(5).mul(digit));
    });
  });

  describe("IERC20 without decimals", () => {
    let erc20Minimal: ERC20MinimalFake;

    beforeEach(async () => {
      const ERC20MinimalFakeFactory = await ethers.getContractFactory("ERC20MinimalFake");
      erc20Minimal = await ERC20MinimalFakeFactory.deploy();
      await erc20Minimal.initializeERC20MinimalFake(toFullDigit(1000));
    });

    it("approve", async () => {
      await expect(
        decimalErc20.approve(erc20Minimal.address, alice.address, toDecimal(5))
      ).to.be.revertedWith("DecimalERC20: get decimals failed");
    });

    it("allowance", async () => {
      await expect(
        decimalErc20.allowance(erc20Minimal.address, admin.address, alice.address)
      ).to.be.revertedWith("DecimalERC20: get decimals failed");
    });

    it("transfer", async () => {
      await erc20Minimal.transfer(decimalErc20.address, toFullDigit(5));
      await expect(
        decimalErc20.transfer(erc20Minimal.address, alice.address, toDecimal(5))
      ).to.be.revertedWith("DecimalERC20: get decimals failed");
    });

    it("balanceOf", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await erc20Minimal.transfer(decimalErc20.address, fiveInEightDigit);
      await expect(
        decimalErc20.balanceOf(erc20Minimal.address, decimalErc20.address)
      ).to.be.revertedWith("DecimalERC20: get decimals failed");
    });

    it("transferFrom", async () => {
      await erc20Minimal.approve(decimalErc20.address, toFullDigit(5));
      await expect(
        decimalErc20.transferFrom(erc20Minimal.address, admin.address, alice.address, toDecimal(5))
      ).revertedWith("DecimalERC20: get decimals failed");
    });
  });

  describe("non-standard ERC20 (tether)", () => {
    beforeEach(async () => {
      const TetherTokenFactory = await ethers.getContractFactory("TetherToken");
      tether = await TetherTokenFactory.deploy(toFullDigit(100), "Tether", "USDT", 6);
      decimal = await tether.decimals();
      digit = ethers.BigNumber.from(10).pow(decimal);
    });

    it("approve", async () => {
      await decimalErc20.approve(tether.address, alice.address, toDecimal(5));
      expect(await tether.allowance(decimalErc20.address, alice.address)).eq(
        ethers.BigNumber.from(5).mul(digit)
      );
    });

    it("allowance", async () => {
      await tether.connect(admin).approve(alice.address, ethers.BigNumber.from(5).mul(digit));
      const allowance = await decimalErc20.allowance(tether.address, admin.address, alice.address);
      expect(allowance.d).eq(
        toFullDigit(5)
      );
    });

    it("transfer", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await tether.transfer(decimalErc20.address, fiveInEightDigit);
      await decimalErc20.transfer(tether.address, alice.address, toDecimal(5));
      expect(await tether.balanceOf(alice.address)).eq(fiveInEightDigit);
    });

    it("balanceOf", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await tether.transfer(decimalErc20.address, fiveInEightDigit);
      const balance = await decimalErc20.balanceOf(tether.address, decimalErc20.address);
      expect(balance.d).eq(toFullDigit(5));
    });

    it("transferFrom", async () => {
      await tether.approve(decimalErc20.address, ethers.BigNumber.from(5).mul(digit));
      await decimalErc20.transferFrom(tether.address, admin.address, alice.address, toDecimal(5));
      expect(await tether.balanceOf(alice.address)).eq(ethers.BigNumber.from(5).mul(digit));
    });

    it("transferFrom with decimals", async () => {
      await tether.transfer(bob.address, ethers.BigNumber.from(5).mul(digit));
      await tether.connect(bob).approve(decimalErc20.address, ethers.BigNumber.from(5).mul(digit));

      await decimalErc20.transferFrom(tether.address, bob.address, alice.address, {
        d: "4999999999999",
      });
      expect(await tether.balanceOf(alice.address)).eq("4");
      expect(await tether.balanceOf(bob.address)).eq("4999996");
    });

    it("transfer with decimals", async () => {
      const five = ethers.BigNumber.from(5);
      const fiveInEightDigit = five.mul(digit);
      await tether.transfer(decimalErc20.address, fiveInEightDigit);

      await decimalErc20.transfer(tether.address, alice.address, { d: "4999999999999" });

      expect(await tether.balanceOf(alice.address)).eq("4");
      expect(await tether.balanceOf(decimalErc20.address)).eq("4999996");
    });

    describe("with fee (same as deflationary token)", () => {
      beforeEach(async () => {
        const TetherTokenFactory = await ethers.getContractFactory("TetherToken");
        tether = await TetherTokenFactory.deploy(toFullDigit(1000), "Tether", "USDT", 6);
        decimal = await tether.decimals();
        digit = ethers.BigNumber.from(10).pow(decimal);
        // set fee ratio to 0.001 and max fee to 10
        await tether.setParams("10", "10");
      });

      it("transfer", async () => {
        const five = ethers.BigNumber.from(5);
        const fiveInEightDigit = five.mul(digit);
        await tether.transfer(decimalErc20.address, fiveInEightDigit);

        await expect(
          decimalErc20.transfer(tether.address, alice.address, toDecimal(1))
        ).to.be.revertedWith("DecimalERC20: balance inconsistent");
      });

      it("transferFrom", async () => {
        await tether.approve(decimalErc20.address, ethers.BigNumber.from(5).mul(digit));
        await expect(
          decimalErc20.transferFrom(tether.address, admin.address, alice.address, toDecimal(1))
        ).to.be.revertedWith("DecimalERC20: balance inconsistent");
      });
    });
  });

  describe("approve", () => {
    before(async () => {
      erc20 = await deployErc20Fake(toFullDigit(1000), "NAME", "SYMBOL", ethers.BigNumber.from(18));
    });

    beforeEach(async () => {
      const TetherTokenFactory = await ethers.getContractFactory("TetherToken");
      tether = await TetherTokenFactory.deploy(toFullDigit(100), "Tether", "USDT", 6);

      await erc20.approve(alice.address, toFullDigit(5));
      await tether.approve(alice.address, toFullDigit(5));
      await decimalErc20.approve(erc20.address, alice.address, toDecimal(5));
      await decimalErc20.approve(tether.address, alice.address, toDecimal(5));
    });

    it("re-approve ERC20: approve to 0 and then approve again", async () => {
      await tether.approve(alice.address, toFullDigit(0));
      const r = await tether.approve(alice.address, toFullDigit(50));
      expect(r).to.emit(tether, "Approval");
    });

    it("re-approve ERC20: force error, approve again without resetting to 0", async () => {
      await expect(tether.approve(alice.address, toFullDigit(50))).to.be.revertedWith(
        "Transaction reverted without a reason"
      );
    });

    it("DecimalERC20: approve", async () => {
      const r = await decimalErc20.approve(tether.address, alice.address, toDecimal(50));
      expect(r).to.emit(tether, "Approval");
    });

    it("DecimalERC20: approve many times without resetting to 0", async () => {
      await decimalErc20.approve(tether.address, alice.address, toDecimal(50));
      const r = await decimalErc20.approve(tether.address, alice.address, toDecimal(500));
      expect(r).to.emit(tether, "Approval");
    });

    it("DecimalERC20/general ERC20: approve", async () => {
      const r = await decimalErc20.approve(erc20.address, alice.address, toDecimal(50));
      expect(r).to.emit(tether, "Approval");
    });

    it("DecimalERC20/general ERC20: approve many times without resetting to 0", async () => {
      await decimalErc20.approve(erc20.address, alice.address, toDecimal(50));
      const r = await decimalErc20.approve(erc20.address, alice.address, toDecimal(500));
      expect(r).to.emit(tether, "Approval");
    });
  });

  describe("transfer", () => {
    beforeEach(async () => {
      erc20 = await deployErc20Fake(toFullDigit(1000));
    });

    it("should fail when transfer more than allowance", async () => {
      await expect(
        decimalErc20.transfer(erc20.address, alice.address, toDecimal(1))
      ).to.be.revertedWith("DecimalERC20: transfer failed");
    });
  });
});
