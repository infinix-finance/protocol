import { expect } from "chai";
import { ethers } from "hardhat";
import { InfxUsdcTwap, UniV2PairMock } from "../../types";

const { parseUnits } = ethers.utils;

async function mine(seconds: number): Promise<void> {
  await ethers.provider.send("evm_mine", [seconds]);
}

describe("InfxUsdcTwap Unit Test", () => {
  describe("InfxUsdcTwap Unit Test: USDC-INFX Pair", () => {
    let twapOracle: InfxUsdcTwap;
    let mockPair: UniV2PairMock;
    let twapDeployTS: number;

    const TWAP_PERIOD_SECONDS = 100;

    const mockInitialReserves = {
      res0: parseUnits("100000", 6),
      res1: parseUnits("10000", 18),
    };

    beforeEach(async () => {
      /// token0 = USDC (6 decimals)
      /// token1 = INFX (18 decimals)
      const UniV2PairMock = await ethers.getContractFactory("UniV2PairMock");
      mockPair = await UniV2PairMock.deploy();
      await mockPair.setReserves(mockInitialReserves.res0, mockInitialReserves.res1);

      const InfxUsdcTwap = await ethers.getContractFactory("InfxUsdcTwap");
      twapOracle = await InfxUsdcTwap.deploy(mockPair.address, TWAP_PERIOD_SECONDS, true);
      twapDeployTS = (
        await ethers.provider.getBlock((await twapOracle.deployTransaction.wait()).blockHash)
      ).timestamp;
    });

    describe("Deployment", () => {
      it("should be valid UniV2PairMock deployment", async () => {
        expect(mockPair.address).to.exist;
        expect(await mockPair.reserve0()).to.eq(mockInitialReserves.res0);
        expect(await mockPair.reserve1()).to.eq(mockInitialReserves.res1);
        expect(await mockPair.blockTimestampLast()).to.not.eq(0);
        const [reserve0, reserve1, ts] = await mockPair.getReserves();
        expect(reserve0).to.eq(mockInitialReserves.res0);
        expect(reserve1).to.eq(mockInitialReserves.res1);
        expect(ts).to.not.eq(0);
      });

      it("should be valid InfxUsdcTwap deployment", async () => {
        expect(twapOracle.address).to.exist;
        expect(await twapOracle.pair()).to.eq(mockPair.address);
        expect(await twapOracle.period()).to.eq(TWAP_PERIOD_SECONDS);
        expect(await twapOracle.isReversed()).to.eq(true);
        expect((await twapOracle.oldObservation())[0]).to.eq(twapDeployTS);
        expect((await twapOracle.newObservation())[0]).to.eq(twapDeployTS);
      });

      it("InfxUsdcTwap deployment should fail with invalid constructor inputs", async () => {
        const InfxUsdcTwap = await ethers.getContractFactory("InfxUsdcTwap");
        await expect(
          InfxUsdcTwap.deploy(ethers.constants.AddressZero, TWAP_PERIOD_SECONDS, true)
        ).to.be.revertedWith("invalid pair");
        await expect(InfxUsdcTwap.deploy(ethers.constants.AddressZero, 0, true)).to.be.revertedWith(
          "invalid pair"
        );
        await expect(InfxUsdcTwap.deploy(mockPair.address, 0, true)).to.be.revertedWith(
          "invalid period"
        );
      });
    });

    describe("InfxUsdcTwap.update()", () => {
      it("should perform update if twap period has passed", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        const period = await twapOracle.period();
        const lastObservationTS = (await twapOracle.newObservation())[0];
        expect(lastObservationTS.add(period).gt(currentTS)).to.be.true;

        await mine(lastObservationTS.add(period).toNumber());
        [, currentTS] = await mockPair.getBlockNumberAndTs();
        expect(lastObservationTS.add(period).lte(currentTS)).to.be.true;

        const newObservationBeforeUpdate = await twapOracle.newObservation();
        const tx = await twapOracle.update();
        await expect(tx).to.emit(twapOracle, "WindowUpdated");

        const txTS = (await ethers.provider.getBlock((await tx.wait()).blockHash)).timestamp;
        expect((await twapOracle.oldObservation())[0]).to.eq(newObservationBeforeUpdate.timestamp);
        expect((await twapOracle.oldObservation())[1]).to.eq(newObservationBeforeUpdate.acc);
        expect((await twapOracle.newObservation())[0]).to.eq(txTS);
      });

      it("should not perform update if twap period has not passed", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        const period = await twapOracle.period();
        const lastObservationTS = (await twapOracle.newObservation())[0];
        expect(lastObservationTS.add(period).gt(currentTS)).to.be.true;

        const newObservationBeforeUpdate = await twapOracle.newObservation();
        const oldObservationBeforeUpdate = await twapOracle.oldObservation();

        await expect(twapOracle.update()).to.not.emit(twapOracle, "WindowUpdated");

        const newObservationAfterUpdate = await twapOracle.newObservation();
        const oldObservationAfterUpdate = await twapOracle.oldObservation();

        expect(newObservationAfterUpdate.timestamp).to.eq(newObservationBeforeUpdate.timestamp);
        expect(oldObservationAfterUpdate.acc).to.eq(oldObservationBeforeUpdate.acc);
      });
    });

    describe("InfxUsdcTwap.getTwapPrice()", () => {
      it("should return correct price", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq(parseUnits("10", 6));
      });

      it("should return correct price - scenario 1", async () => {
        await mockPair.setReserves(parseUnits("110000", 6), parseUnits("10000", 18));
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq("10792079");
      });

      it("should return correct price - scenario 2", async () => {
        await mockPair.setReserves(parseUnits("90000", 6), parseUnits("10000", 18));
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq("8811881");
      });
    });
  });

  describe("InfxUsdcTwap Unit Test: INFX-USDC Pair", () => {
    let twapOracle: InfxUsdcTwap;
    let mockPair: UniV2PairMock;
    let twapDeployTS: number;

    const TWAP_PERIOD_SECONDS = 100;

    const mockInitialReserves = {
      res0: parseUnits("10000", 18),
      res1: parseUnits("100000", 6),
    };

    beforeEach(async () => {
      /// token0 = INFX (18 decimals)
      /// token1 = USDC (6 decimals)
      const UniV2PairMock = await ethers.getContractFactory("UniV2PairMock");
      mockPair = await UniV2PairMock.deploy();
      await mockPair.setReserves(mockInitialReserves.res0, mockInitialReserves.res1);

      const InfxUsdcTwap = await ethers.getContractFactory("InfxUsdcTwap");
      twapOracle = await InfxUsdcTwap.deploy(mockPair.address, TWAP_PERIOD_SECONDS, false);
      twapDeployTS = (
        await ethers.provider.getBlock((await twapOracle.deployTransaction.wait()).blockHash)
      ).timestamp;
    });

    describe("Deployment", () => {
      it("should be valid UniV2PairMock deployment", async () => {
        expect(mockPair.address).to.exist;
        expect(await mockPair.reserve0()).to.eq(mockInitialReserves.res0);
        expect(await mockPair.reserve1()).to.eq(mockInitialReserves.res1);
        expect(await mockPair.blockTimestampLast()).to.not.eq(0);
        const [reserve0, reserve1, ts] = await mockPair.getReserves();
        expect(reserve0).to.eq(mockInitialReserves.res0);
        expect(reserve1).to.eq(mockInitialReserves.res1);
        expect(ts).to.not.eq(0);
      });

      it("should be valid InfxUsdcTwap deployment", async () => {
        expect(twapOracle.address).to.exist;
        expect(await twapOracle.pair()).to.eq(mockPair.address);
        expect(await twapOracle.period()).to.eq(TWAP_PERIOD_SECONDS);
        expect(await twapOracle.isReversed()).to.eq(false);
        expect((await twapOracle.oldObservation())[0]).to.eq(twapDeployTS);
        expect((await twapOracle.newObservation())[0]).to.eq(twapDeployTS);
      });

      it("InfxUsdcTwap deployment should fail with invalid constructor inputs", async () => {
        const InfxUsdcTwap = await ethers.getContractFactory("InfxUsdcTwap");
        await expect(
          InfxUsdcTwap.deploy(ethers.constants.AddressZero, TWAP_PERIOD_SECONDS, false)
        ).to.be.revertedWith("invalid pair");
        await expect(
          InfxUsdcTwap.deploy(ethers.constants.AddressZero, 0, false)
        ).to.be.revertedWith("invalid pair");
        await expect(InfxUsdcTwap.deploy(mockPair.address, 0, false)).to.be.revertedWith(
          "invalid period"
        );
      });
    });

    describe("InfxUsdcTwap.update()", () => {
      it("should perform update if twap period has passed", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        const period = await twapOracle.period();
        const lastObservationTS = (await twapOracle.newObservation())[0];
        expect(lastObservationTS.add(period).gt(currentTS)).to.be.true;

        await mine(lastObservationTS.add(period).toNumber());
        [, currentTS] = await mockPair.getBlockNumberAndTs();
        expect(lastObservationTS.add(period).lte(currentTS)).to.be.true;

        const newObservationBeforeUpdate = await twapOracle.newObservation();
        const tx = await twapOracle.update();
        await expect(tx).to.emit(twapOracle, "WindowUpdated");

        const txTS = (await ethers.provider.getBlock((await tx.wait()).blockHash)).timestamp;
        expect((await twapOracle.oldObservation())[0]).to.eq(newObservationBeforeUpdate.timestamp);
        expect((await twapOracle.oldObservation())[1]).to.eq(newObservationBeforeUpdate.acc);
        expect((await twapOracle.newObservation())[0]).to.eq(txTS);
      });

      it("should not perform update if twap period has not passed", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        const period = await twapOracle.period();
        const lastObservationTS = (await twapOracle.newObservation())[0];
        expect(lastObservationTS.add(period).gt(currentTS)).to.be.true;

        const newObservationBeforeUpdate = await twapOracle.newObservation();
        const oldObservationBeforeUpdate = await twapOracle.oldObservation();

        await expect(twapOracle.update()).to.not.emit(twapOracle, "WindowUpdated");

        const newObservationAfterUpdate = await twapOracle.newObservation();
        const oldObservationAfterUpdate = await twapOracle.oldObservation();

        expect(newObservationAfterUpdate.timestamp).to.eq(newObservationBeforeUpdate.timestamp);
        expect(oldObservationAfterUpdate.acc).to.eq(oldObservationBeforeUpdate.acc);
      });
    });

    describe("InfxUsdcTwap.getTwapPrice()", () => {
      it("should return correct price", async () => {
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq(parseUnits("10", 6));
      });

      it("should return correct price - scenario 1", async () => {
        await mockPair.setReserves(parseUnits("10000", 18), parseUnits("110000", 6));
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq("10792079");
      });

      it("should return correct price - scenario 2", async () => {
        await mockPair.setReserves(parseUnits("10000", 18), parseUnits("90000", 6));
        let [, currentTS] = await mockPair.getBlockNumberAndTs();
        await mine(currentTS.add(TWAP_PERIOD_SECONDS).toNumber());
        expect(await twapOracle.getTwapPrice()).to.eq("8811881");
      });
    });
  });
});
