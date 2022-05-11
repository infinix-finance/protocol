import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { waffle } from "hardhat";
import {
  AmmFake,
  API3PriceFeedMock,
  ClearingHouseFake,
  ERC20Fake,
  IfnxToken,
  InflationMonitorFake,
  InsuranceFundFake,
  Minter,
  SupplyScheduleFake,
} from "../../types";
import { deployAmm, deployErc20Fake, Side } from "../helper/contract";
import { fullDeploy } from "../helper/deploy";
import { ONE_DAY, toDecimal, toFullDigit } from "../helper/number";

describe("Protocol shutdown test", () => {
  let admin: Wallet;
  let alice: Wallet;
  let bob: Wallet;
  let carol: Wallet;
  let chad: Wallet;
  let clearingHouse: ClearingHouseFake;
  let amm: AmmFake;
  let quoteToken: ERC20Fake;
  let insuranceFund: InsuranceFundFake;
  let mockPriceFeed!: API3PriceFeedMock;
  let supplySchedule: SupplyScheduleFake;
  let ifnxToken: IfnxToken;
  let inflationMonitor: InflationMonitorFake;
  let minter: Minter;

  async function deployAmmPair(quoteToken?: ERC20Fake): Promise<any> {
    const quote = quoteToken || (await deployErc20Fake(toFullDigit(20000000), "DAI", "DAI"));
    const amm = await deployAmm({
      deployer: admin.address,
      quoteAssetTokenAddr: quote.address,
      priceFeedAddr: mockPriceFeed.address,
      fundingPeriod: BigNumber.from(86400),
      fluctuation: toFullDigit(0),
    });
    await amm.setGlobalShutdown(insuranceFund.address);
    await amm.setCounterParty(clearingHouse.address);
    await amm.setOpen(true);

    return { quote, amm };
  }

  async function approve(account: Wallet, spender: string, amount: number | string): Promise<void> {
    await quoteToken
      .connect(account)
      .approve(spender, toFullDigit(amount, +(await quoteToken.decimals())));
  }

  async function transfer(from: Wallet, to: string, amount: number | string): Promise<void> {
    await quoteToken
      .connect(from)
      .transfer(to, toFullDigit(amount, +(await quoteToken.decimals())));
  }

  beforeEach(async () => {
    const addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];
    bob = addresses[2];
    carol = addresses[3];
    chad = addresses[4];

    const contracts = await fullDeploy({
      sender: admin.address,
      quoteAssetReserve: toFullDigit(10000),
      baseAssetReserve: toFullDigit(100),
    });
    clearingHouse = contracts.clearingHouse;
    amm = contracts.amm;
    quoteToken = contracts.quoteToken;
    insuranceFund = contracts.insuranceFund;
    mockPriceFeed = contracts.priceFeed;
    supplySchedule = contracts.supplySchedule;
    ifnxToken = contracts.ifnxToken;
    inflationMonitor = contracts.inflationMonitor;
    minter = contracts.minter;
  });

  describe("global shutdown test", () => {
    let amm2: AmmFake;

    async function forwardBlockTimestamp(time = 15): Promise<void> {
      const now = await supplySchedule.mock_getCurrentTimestamp();

      await inflationMonitor.mock_setBlockTimestamp(now.add(time));
      await supplySchedule.mock_setBlockTimestamp(now.add(time));
      const movedBlocks = time / 15 < 1 ? 1 : time / 15;
      const blockNumber = await amm.mock_getCurrentBlockNumber();
      await inflationMonitor.mock_setBlockNumber(blockNumber.add(movedBlocks));
      await supplySchedule.mock_setBlockNumber(blockNumber.add(movedBlocks));
    }

    async function gotoNextMintTime(): Promise<void> {
      const nextMintTime = await supplySchedule.nextMintTime();
      await supplySchedule.mock_setBlockTimestamp(nextMintTime);
      await inflationMonitor.mock_setBlockTimestamp(nextMintTime);
    }

    async function mint(times = 1): Promise<void> {
      for (let i = 0; i < times; i++) {
        await gotoNextMintTime();
        await minter.mintReward();
      }
    }

    beforeEach(async () => {
      const set2 = await deployAmmPair();
      amm2 = set2.amm;

      await insuranceFund.addAmm(amm2.address);
      await amm2.setTollRatio(toDecimal(0.05));
      await amm2.setSpreadRatio(toDecimal(0.05));

      await transfer(admin, alice.address, 1000);
      await approve(alice, clearingHouse.address, 1000);

      // given an init mint history
      await minter.setInsuranceFund(admin.address);
      await minter.mintForLoss({ d: "1" });
    });

    it("weekly minted ifnx token is more than 10%", async () => {
      // mint totalSupply * 0.125
      // 0.125 / (1 + 0.125) ~= 11.1%
      const supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(8).toString() });

      await forwardBlockTimestamp(7 * ONE_DAY);

      const r = await insuranceFund.shutdownAllAmm();
      await expect(r).to.emit(insuranceFund, "ShutdownAllAmms");
      expect(await amm2.open()).to.eq(false);
    });

    it("can immediately shutdown if minted ifnx token is more than 10%", async () => {
      // mint totalSupply * 0.125
      // 0.125 / (1 + 0.125) ~= 11.1%
      const supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(8).toString() });

      const r = await insuranceFund.shutdownAllAmm();
      await expect(r).to.emit(insuranceFund, "ShutdownAllAmms");
      expect(await amm2.open()).to.eq(false);
    });

    it("cumulative minted ifnx token in a week is more than 10%", async () => {
      // mint totalSupply * 0.125
      // 0.125 / (1 + 0.125) ~= 11.1%
      const supply = await ifnxToken.totalSupply();
      const mintedAmount = supply.div(8).div(3);
      await minter.mintForLoss({ d: mintedAmount.toString() });
      await forwardBlockTimestamp(2 * ONE_DAY);
      await minter.mintForLoss({ d: mintedAmount.toString() });
      await forwardBlockTimestamp(2 * ONE_DAY);
      await minter.mintForLoss({ d: mintedAmount.toString() });
      await forwardBlockTimestamp(3 * ONE_DAY);

      const r = await insuranceFund.shutdownAllAmm();
      await expect(r).to.emit(insuranceFund, "ShutdownAllAmms");
      expect(await amm2.open()).to.eq(false);
    });

    it("not reach 10% criteria, still can trade", async () => {
      // mint totalSupply * 0.111
      // 0.111 / (1 + 0.111) ~= 9.9%
      const supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(9).toString() });
      await insuranceFund.shutdownAllAmm();
      const receipt = await clearingHouse
        .connect(alice)
        .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(1), toDecimal(0));
      expect(receipt).to.emit(clearingHouse, "PositionChanged");
    });

    it("minted ifnx token is less than 10% in a week but more than 10% at (now - 8days), still can trade", async () => {
      // mint totalSupply * 0.125
      // 0.125 / (1 + 0.125) ~= 11.1%
      let supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(8).toString() });
      await forwardBlockTimestamp(3 * ONE_DAY);

      supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(20).toString() });
      await forwardBlockTimestamp(3 * ONE_DAY);

      supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(8).toString() });
      await forwardBlockTimestamp(2 * ONE_DAY);

      expect(
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(1), toDecimal(0))
      ).to.emit(clearingHouse, "PositionChanged");
    });

    it("a week ago, minted ifnx token is more than 10%, still can trade", async () => {
      // mint totalSupply * 0.125
      // 0.125 / (1 + 0.125) ~= 11.1%
      const supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(8).toString() });
      await forwardBlockTimestamp(7 * ONE_DAY);

      expect(
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(1), toDecimal(0))
      ).to.emit(clearingHouse, "PositionChanged");
    });

    it("change threshold to 5%", async () => {
      await inflationMonitor.setShutdownThreshold(toDecimal(0.05));
      const supply = await ifnxToken.totalSupply();

      // mint totalSupply * 0.05
      // 0.05 / (1 + 0.05) ~= 4.7%, still can trade
      await minter.mintForLoss({ d: supply.div(20).toString() });
      await insuranceFund.shutdownAllAmm();
      expect(
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(1), toDecimal(0))
      ).to.emit(clearingHouse, "PositionChanged");

      await forwardBlockTimestamp(7 * ONE_DAY);

      // mint totalSupply * 0.111
      // 0.111 / (1 + 0.111) ~= 9.9%
      const supplyNew = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supplyNew.div(9).toString() });
      const r = await insuranceFund.shutdownAllAmm();
      await expect(r).to.emit(insuranceFund, "ShutdownAllAmms");
      expect(await amm2.open()).to.eq(false);
    });

    it("mintReward should not affect the criteria", async () => {
      // 1% inflation rate
      await mint();
      await forwardBlockTimestamp(2 * ONE_DAY);

      // mint totalSupply * 0.111
      // 0.111 / (1 + 0.111) ~= 9.9%
      const supply = await ifnxToken.totalSupply();
      await minter.mintForLoss({ d: supply.div(9).toString() });
      await insuranceFund.shutdownAllAmm();

      expect(
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(1), toDecimal(0))
      ).to.emit(clearingHouse, "PositionChanged");
    });
  });

  describe("shutdown Amm test", () => {
    beforeEach(async () => {
      await transfer(admin, alice.address, 100);
      await approve(alice, clearingHouse.address, 100);
      await transfer(admin, insuranceFund.address, 5000);
    });

    it("close amm", async () => {
      expect(await amm.open()).eq(true);
      const receipt = await clearingHouse
        .connect(alice)
        .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));
      expect(receipt).to.emit(clearingHouse, "PositionChanged");

      await amm.shutdown();

      expect(await amm.open()).eq(false);
      expect(await amm.getSettlementPrice()).to.not.eq(0);

      const error = "amm was closed";
      await expect(
        clearingHouse
          .connect(bob)
          .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0))
      ).to.be.revertedWith(error);
      await expect(
        clearingHouse.connect(alice).closePosition(amm.address, toDecimal(0))
      ).to.be.revertedWith(error);
      await expect(
        clearingHouse.connect(alice).addMargin(amm.address, toDecimal(10))
      ).to.be.revertedWith(error);
      await expect(
        clearingHouse.connect(alice).removeMargin(amm.address, toDecimal(10))
      ).to.be.revertedWith(error);
      await expect(clearingHouse.connect(alice).payFunding(amm.address)).to.be.revertedWith(error);
      await expect(
        clearingHouse.connect(carol).liquidateWithSlippage(amm.address, alice.address, { d: 0 })
      ).to.be.revertedWith(error);
    });

    it("close amm1 should not affect amm2", async () => {
      // add amm2
      const set2 = await deployAmmPair();
      const amm2 = set2.amm as AmmFake;
      const quote2 = set2.quote as ERC20Fake;
      await quote2.transfer(alice.address, toFullDigit(100));
      await quote2.connect(alice).approve(clearingHouse.address, toFullDigit(100));
      await quote2.transfer(insuranceFund.address, toFullDigit(5000));

      await amm2.setSpreadRatio(toDecimal(0.05));
      await amm2.setTollRatio(toDecimal(0.05));
      await insuranceFund.addAmm(amm2.address);
      await amm2.setTollRatio(toDecimal(0.5));
      await amm2.setSpreadRatio(toDecimal(0.5));

      // shutdown amm
      await amm.shutdown();

      expect(await amm.open()).eq(false);
      expect(await amm2.open()).eq(true);

      const r = await clearingHouse
        .connect(alice)
        .openPosition(amm2.address, Side.SELL, toDecimal(10), toDecimal(2), toDecimal(0));
      expect(r).to.emit(clearingHouse, "PositionChanged");
    });

    it("settle twice", async () => {
      expect(await amm.open()).eq(true);
      await clearingHouse
        .connect(alice)
        .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));

      await amm.shutdown();

      const aliceReceipt = await clearingHouse.connect(alice).settlePosition(amm.address);
      await expect(aliceReceipt).to.emit(quoteToken, "Transfer");
      await expect(clearingHouse.connect(alice).settlePosition(amm.address)).to.be.revertedWith(
        "positionSize is 0"
      );
    });

    it("force error, amm is open", async () => {
      expect(await amm.open()).eq(true);
      await clearingHouse
        .connect(alice)
        .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));

      await expect(clearingHouse.connect(alice).settlePosition(amm.address)).to.be.revertedWith(
        "amm is open"
      );
    });

    describe("how much refund trader can get", () => {
      beforeEach(async () => {
        await transfer(admin, bob.address, 100);
        await approve(bob, clearingHouse.address, 100);
        await transfer(admin, carol.address, 100);
        await approve(carol, clearingHouse.address, 100);
      });

      it("get their collateral if settlements price is 0", async () => {
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));
        await clearingHouse
          .connect(bob)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(2), toDecimal(0));
        const receipt = await amm.shutdown();
        await expect(receipt).to.emit(amm, "Shutdown").withArgs("0");

        // then alice get her total collateral
        const aliceReceipt = await clearingHouse.connect(alice).settlePosition(amm.address);
        await expect(aliceReceipt)
          .to.emit(quoteToken, "Transfer")
          .withArgs(
            clearingHouse.address,
            alice.address,
            toFullDigit(100, +(await quoteToken.decimals()))
          );

        // then bob get her total collateral
        const bobReceipt = await clearingHouse.connect(bob).settlePosition(amm.address);
        await expect(bobReceipt)
          .to.emit(quoteToken, "Transfer")
          .withArgs(
            clearingHouse.address,
            bob.address,
            toFullDigit(100, +(await quoteToken.decimals()))
          );
      });

      it("get trader's collateral back as closing position in average price", async () => {
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));
        await clearingHouse
          .connect(bob)
          .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(2), toDecimal(0));
        await clearingHouse
          .connect(carol)
          .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(1), toDecimal(0));
        const receipt = await amm.shutdown();
        await expect(receipt).to.emit(amm, "Shutdown").withArgs("98999999999999999804");

        const aliceReceipt = await clearingHouse.connect(alice).settlePosition(amm.address);
        await expect(aliceReceipt)
          .to.emit(quoteToken, "Transfer")
          .withArgs(clearingHouse.address, alice.address, "97959183");

        const bobReceipt = await clearingHouse.connect(bob).settlePosition(amm.address);
        await expect(bobReceipt)
          .to.emit(quoteToken, "Transfer")
          .withArgs(clearingHouse.address, bob.address, "102040816");

        const carolReceipt = await clearingHouse.connect(carol).settlePosition(amm.address);
        await expect(carolReceipt)
          .to.emit(quoteToken, "Transfer")
          .withArgs(clearingHouse.address, carol.address, "100000000");
      });

      it("debt is more than clearingHouse' balance, insuranceFund won't pay for it", async () => {
        await transfer(admin, alice.address, 100);
        await approve(alice, clearingHouse.address, 200);
        await transfer(admin, bob.address, 100);
        await approve(bob, clearingHouse.address, 200);
        await transfer(admin, carol.address, 100);
        await approve(carol, clearingHouse.address, 200);

        // open price 80, position size -25
        await clearingHouse
          .connect(alice)
          .openPosition(amm.address, Side.SELL, toDecimal(200), toDecimal(10), toDecimal(0));
        // open price 67.2, position size 5.95
        await clearingHouse
          .connect(bob)
          .openPosition(amm.address, Side.BUY, toDecimal(200), toDecimal(2), toDecimal(0));
        // open price 53.76, position size -37.2
        await clearingHouse
          .connect(carol)
          .openPosition(amm.address, Side.SELL, toDecimal(200), toDecimal(10), toDecimal(0));
        await amm.shutdown();

        // balance of clearingHouse is 600
        // alice should get 600, bob should get 180.95, carol losses 180.95 (can not get collateral back)
        const aliceReceipt = await clearingHouse.connect(alice).settlePosition(amm.address);
        expect(await quoteToken.balanceOf(alice.address)).to.eq("600000000");

        await expect(clearingHouse.connect(bob).settlePosition(amm.address)).to.be.revertedWith(
          "DecimalERC20: transfer failed"
        );
        const r = await clearingHouse.connect(carol).settlePosition(amm.address);
        expect(r).to.emit(clearingHouse, "PositionSettled").withArgs("0");

        expect(await quoteToken.balanceOf(clearingHouse.address)).eq(0);
      });
    });
  });
});
