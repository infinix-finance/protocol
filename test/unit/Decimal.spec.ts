import { expect, use } from "chai";
import { ethers } from "hardhat";
import { DecimalFake, MixedDecimalFake, SignedDecimalFake } from "../../types";
import { DEFAULT_TOKEN_DECIMALS, toDecimal, toFullDigit } from "../helper/number";

const BN_TOKEN_DIGIT = ethers.utils.parseUnits("1.0", DEFAULT_TOKEN_DECIMALS);
const INVALID_INT_256 = "0x8FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
const INT_256_MAX = "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

describe("Decimal/SignedDecimal/MixedDecimal Unit Test", () => {
  let decimal: DecimalFake;
  let signDecimal: SignedDecimalFake;
  let mixedDecimal: MixedDecimalFake;

  before(async () => {
    const DecimalFakeFactory = await ethers.getContractFactory("DecimalFake");
    decimal = (await DecimalFakeFactory.deploy()) as DecimalFake;
    const SignedDecimalFakeFactory = await ethers.getContractFactory("SignedDecimalFake");
    signDecimal = (await SignedDecimalFakeFactory.deploy()) as SignedDecimalFake;
    const MixedDecimalFakeFactory = await ethers.getContractFactory("MixedDecimalFake");
    mixedDecimal = (await MixedDecimalFakeFactory.deploy()) as MixedDecimalFake;
  });

  // we don't test add/sub here, they are all covered by SafeMath
  describe("Decimal", () => {
    it("Mul decimals", async () => {
      const ret = await decimal.mul(toDecimal(100), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul scalar", async () => {
      const ret = await decimal.mulScalar(toDecimal(100), 123);
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul scalar with two 18+ digit number", async () => {
      const ret = await decimal.mulScalar(toDecimal(100), toDecimal(123).d);
      expect(ret.d).to.eq(toFullDigit(12300).mul(BN_TOKEN_DIGIT));
    });

    it("Div decimals", async () => {
      const ret = await decimal.div(toDecimal(12300), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div scalar", async () => {
      const ret = await decimal.divScalar(toDecimal(12300), 123);
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div scalar by a 18+ digit number", async () => {
      const ret = await decimal.divScalar(toDecimal(12300), toDecimal(123).d);
      expect(ret.d).to.eq(100);
    });
  });

  // we don't test add/sub here, they are all covered by SignedSafeMath
  describe("SignedDecimal", () => {
    it("Mul signDecimal (positive x positive)", async () => {
      const ret = await signDecimal.mul(toDecimal(100), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul signDecimal (positive x negative)", async () => {
      const ret = await signDecimal.mul(toDecimal(100), toDecimal(-123));
      expect(ret.d).to.eq(toFullDigit(-12300));
    });

    it("Mul signDecimal (negative x negative)", async () => {
      const ret = await signDecimal.mul(toDecimal(-100), toDecimal(-123));
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul signedDecimal by positive scalar", async () => {
      const ret = await signDecimal.mulScalar(toDecimal(100), 123);
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul signedDecimal by negative scalar", async () => {
      const ret = await signDecimal.mulScalar(toDecimal(100), -123);
      expect(ret.d).to.eq(toFullDigit(-12300));
    });

    it("Mul negative signedDecimal by positive scalar", async () => {
      const ret = await signDecimal.mulScalar(toDecimal(-100), 123);
      expect(ret.d).to.eq(toFullDigit(-12300));
    });

    it("Mul negative signedDecimal by negative scalar", async () => {
      const ret = await signDecimal.mulScalar(toDecimal(-100), -123);
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul scalar with two 18+ digit number", async () => {
      const ret = await signDecimal.mulScalar(toDecimal(100), toDecimal(123).d);
      expect(ret.d).to.eq(toFullDigit(12300).mul(BN_TOKEN_DIGIT));
    });

    it("Div signDecimals (positive / positive)", async () => {
      const ret = await signDecimal.div(toDecimal(12300), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div signDecimals (negative / positive)", async () => {
      const ret = await signDecimal.div(toDecimal(-12300), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(-100));
    });

    it("Div signDecimals (negative / negative)", async () => {
      const ret = await signDecimal.div(toDecimal(-12300), toDecimal(-123));
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div positive signDecimal by positive scalar", async () => {
      const ret = await signDecimal.divScalar(toDecimal(12300), 123);
      expect(ret.d).to.eq(toFullDigit(100));
    });
    it("Div positive signDecimal by negative scalar", async () => {
      const ret = await signDecimal.divScalar(toDecimal(12300), -123);
      expect(ret.d).to.eq(toFullDigit(-100));
    });
    it("Div negative signDecimal by positive scalar", async () => {
      const ret = await signDecimal.divScalar(toDecimal(-12300), 123);
      expect(ret.d).to.eq(toFullDigit(-100));
    });

    it("Div negative signDecimal by negative scalar", async () => {
      const ret = await signDecimal.divScalar(toDecimal(-12300), -123);
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div scalar by a 18+ digit number", async () => {
      const ret = await signDecimal.divScalar(toDecimal(12300), toDecimal(123).d);
      expect(ret.d).to.eq(100);
    });
  });

  // we don't test add/sub here, they are all covered by SignedSafeMath
  describe("MixedDecimal", () => {
    it("Mul a positive signDecimal by a decimal", async () => {
      const ret = await mixedDecimal.mul(toDecimal(100), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul a negative signDecimal by a decimal", async () => {
      const ret = await mixedDecimal.mul(toDecimal(-100), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(-12300));
    });

    it("Mul a positive mixedDecimal by a scalar", async () => {
      const ret = await mixedDecimal.mulScalar(toDecimal(100), 123);
      expect(ret.d).to.eq(toFullDigit(12300));
    });

    it("Mul a negative mixedDecimal by a scalar", async () => {
      const ret = await mixedDecimal.mulScalar(toDecimal(-100), 123);
      expect(ret.d).to.eq(toFullDigit(-12300));
    });

    it("Mul scalar with two 18+ digit number", async () => {
      const ret = await mixedDecimal.mulScalar(toDecimal(100), toDecimal(123).d);
      expect(ret.d).to.eq(toFullDigit(12300).mul(BN_TOKEN_DIGIT));
    });

    it("Div a positive signDecimal by a decimal", async () => {
      const ret = await mixedDecimal.div(toDecimal(12300), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(100));
    });

    it("Div a negative signDecimal by a decimal", async () => {
      const ret = await mixedDecimal.div(toDecimal(-12300), toDecimal(123));
      expect(ret.d).to.eq(toFullDigit(-100));
    });

    it("Div positive mixedDecimal by a positive scalar", async () => {
      const ret = await mixedDecimal.divScalar(toDecimal(12300), 123);
      expect(ret.d).to.eq(toFullDigit(100));
    });
    it("Div negative mixedDecimal by a scalar", async () => {
      const ret = await mixedDecimal.divScalar(toDecimal(-12300), 123);
      expect(ret.d).to.eq(toFullDigit(-100));
    });

    it("Div scalar by a 18+ digit number", async () => {
      const ret = await mixedDecimal.divScalar(toDecimal(12300), toDecimal(123).d);
      expect(ret.d).to.eq(100);
    });

    it("mul by a (2**255 - 1) scalar", async () => {
      const maxInt = ethers.BigNumber.from(2)
        .pow(ethers.BigNumber.from(255))
        .sub(ethers.BigNumber.from(1));
      const ret = await mixedDecimal.mulScalar({ d: maxInt.toString() }, 1);
      expect(ret.d).eq(maxInt);
    });

    it("Force error, mul by a 2**255 decimal", async () => {
      await expect(
        mixedDecimal.mul(toDecimal(1), {
          d: INVALID_INT_256,
        })
      ).to.be.revertedWith("MixedDecimal: uint value is bigger than _INT256_MAX");
    });

    it("Force error, mul by a 2**255 scalar", async () => {
      await expect(mixedDecimal.mulScalar(toDecimal(1), INVALID_INT_256)).to.be.revertedWith(
        "MixedDecimal: uint value is bigger than _INT256_MAX"
      );
    });

    it("Force error, div by a 2**255 scalar", async () => {
      await expect(mixedDecimal.divScalar(toDecimal(1), INVALID_INT_256)).to.be.revertedWith(
        "MixedDecimal: uint value is bigger than _INT256_MAX"
      );
    });
  });
});
