import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { waffle } from "hardhat";
import {
  AmmFake,
  API3PriceFeedMock,
  ClearingHouseFake,
  ERC20Fake,
  InsuranceFundFake,
  RewardsDistributionFake,
  SupplyScheduleFake,
} from "../../../types";
import { Side } from "../../helper/contract";
import { fullDeploy } from "../../helper/deploy";
import { toDecimal, toFullDigit } from "../../helper/number";

describe("Bad Debt Test", () => {
  let wallets: Wallet[];
  let admin: Wallet;
  let whale: Wallet;
  let shrimp: Wallet;

  let amm: AmmFake;
  let insuranceFund: InsuranceFundFake;
  let quoteToken: ERC20Fake;
  let mockPriceFeed!: API3PriceFeedMock;
  let rewardsDistribution: RewardsDistributionFake;
  let clearingHouse: ClearingHouseFake;
  let supplySchedule: SupplyScheduleFake;

  async function forwardBlockTimestamp(time: number): Promise<void> {
    const now = await supplySchedule.mock_getCurrentTimestamp();
    const newTime = now.add(time);
    await rewardsDistribution.mock_setBlockTimestamp(newTime);
    await amm.mock_setBlockTimestamp(newTime);
    await supplySchedule.mock_setBlockTimestamp(newTime);
    await clearingHouse.mock_setBlockTimestamp(newTime);
    const movedBlocks = time / 15 < 1 ? 1 : time / 15;

    const blockNumber = BigNumber.from(await amm.mock_getCurrentBlockNumber());
    const newBlockNumber = blockNumber.add(movedBlocks);
    await rewardsDistribution.mock_setBlockNumber(newBlockNumber);
    await amm.mock_setBlockNumber(newBlockNumber);
    await supplySchedule.mock_setBlockNumber(newBlockNumber);
    await clearingHouse.mock_setBlockNumber(newBlockNumber);
  }

  async function approve(account: Wallet, spender: string, amount: number): Promise<void> {
    await quoteToken
      .connect(account)
      .approve(spender, toFullDigit(amount, +(await quoteToken.decimals())));
  }

  async function syncAmmPriceToOracle() {
    const marketPrice = await amm.getSpotPrice();
    await mockPriceFeed.setPrice(marketPrice.d);
  }

  beforeEach(async () => {
    wallets = await waffle.provider.getWallets();
    admin = wallets[0];

    const contracts = await fullDeploy({ sender: admin.address });
    amm = contracts.amm;
    insuranceFund = contracts.insuranceFund;
    quoteToken = contracts.quoteToken;
    mockPriceFeed = contracts.priceFeed;
    rewardsDistribution = contracts.rewardsDistribution;
    clearingHouse = contracts.clearingHouse;
    supplySchedule = contracts.supplySchedule;

    // for manipulating the price
    whale = wallets[1];
    await quoteToken.transfer(whale.address, toFullDigit(5000, +(await quoteToken.decimals())));
    await approve(whale, clearingHouse.address, 5000);

    // account that will incur bad debt
    shrimp = wallets[2];
    await quoteToken.transfer(shrimp.address, toFullDigit(15, +(await quoteToken.decimals())));
    await approve(shrimp, clearingHouse.address, 15);

    await quoteToken.transfer(
      insuranceFund.address,
      toFullDigit(50000, +(await quoteToken.decimals()))
    );

    await amm.setCap(toDecimal(0), toDecimal(0));

    await syncAmmPriceToOracle();

    // shrimp open small long
    // position size: 7.40740741
    await clearingHouse
      .connect(shrimp)
      .openPosition(amm.address, Side.BUY, toDecimal(10), toDecimal(8), toDecimal(0));

    // whale drop spot price
    for (let i = 0; i < 5; i++) {
      await clearingHouse
        .connect(whale)
        .openPosition(amm.address, Side.SELL, toDecimal(10), toDecimal(10), toDecimal(0));
    }

    // spot price: 3.364
    await forwardBlockTimestamp(1);
  });

  it("cannot increase position when bad debt", async () => {
    // increase position should fail since margin is not enough
    await expect(
      clearingHouse
        .connect(shrimp)
        .openPosition(amm.address, Side.BUY, toDecimal(10), toDecimal(10), toDecimal(0))
    ).to.be.revertedWith("Margin ratio not meet criteria");

    // pump spot price
    await clearingHouse.connect(whale).closePosition(amm.address, toDecimal(0));

    // increase position should succeed since the position no longer has bad debt
    await clearingHouse
      .connect(shrimp)
      .openPosition(amm.address, Side.BUY, toDecimal(1), toDecimal(1), toDecimal(0));
  });

  it("cannot reduce position when bad debt", async () => {
    // reduce position should fail since margin is not enough
    await expect(
      clearingHouse
        .connect(shrimp)
        .openPosition(amm.address, Side.SELL, toDecimal(1), toDecimal(1), toDecimal(0))
    ).to.be.revertedWith("Margin ratio not meet criteria");

    // pump spot price
    await clearingHouse.connect(whale).closePosition(amm.address, toDecimal(0));

    // reduce position should succeed since the position no longer has bad debt
    await clearingHouse
      .connect(shrimp)
      .openPosition(amm.address, Side.SELL, toDecimal(1), toDecimal(1), toDecimal(0));
  });

  it("cannot close position when bad debt", async () => {
    // close position should fail since bad debt
    // open notional = 80
    // estimated realized PnL (partial close) = 7.4 * 3.36 - 80 = -55.136
    // estimated remaining margin = 10 + (-55.136) = -45.136
    // real bad debt: 46.10795455
    await expect(
      clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0))
    ).to.be.revertedWith("bad debt");

    // pump spot price
    await clearingHouse.connect(whale).closePosition(amm.address, toDecimal(0));

    // increase position should succeed since the position no longer has bad debt
    await clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0));
  });

  it("can not partial close position when bad debt", async () => {
    // set fluctuation limit ratio to trigger partial close
    await amm.setFluctuationLimitRatio(toDecimal("0.000001"));
    await clearingHouse.setPartialLiquidationRatio(toDecimal("0.25"));

    // position size: 7.4074074074
    // open notional = 80
    // estimated realized PnL (partial close) = 7.4 * 0.25 * 3.36 - 80 * 0.25 = -13.784
    // estimated remaining margin = 10 + (-13.784) = -3.784
    // real bad debt = 4.027
    await expect(
      clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0))
    ).to.be.revertedWith("bad debt");
  });

  it("can partial close position as long as it does not incur bad debt", async () => {
    // set fluctuation limit ratio to trigger partial close
    await amm.setFluctuationLimitRatio(toDecimal("0.000001"));
    await clearingHouse.setPartialLiquidationRatio(toDecimal("0.1"));

    // position size: 7.4074074074
    // open notional = 80
    // estimated realized PnL (partial close) = 7.4 * 0.1 * 3.36 - 80 * 0.1 = -5.5136
    // estimated remaining margin = 10 + (-5.5136) = 4.4864
    // real bad debt = 0
    await clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0));

    // remaining position size = 7.4074074074 * 0.9 = 6.66666667
    expect((await clearingHouse.getPosition(amm.address, shrimp.address)).size.d).to.be.eq(
      "6666666666666666667"
    );
  });

  it("can liquidate position by backstop LP when bad debt", async () => {
    // set whale to backstop LP
    await clearingHouse.setBackstopLiquidityProvider(whale.address, true);

    // close position should fail since bad debt
    // open notional = 80
    // estimated realized PnL (partial close) = 7.4 * 3.36 - 80 = -55.136
    // estimated remaining margin = 10 + (-55.136) = -45.136
    // real bad debt: 46.10795455
    await expect(
      clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0))
    ).to.be.revertedWith("bad debt");

    // no need to manipulate TWAP because the spot price movement is large enough
    // that getMarginRatio() returns negative value already
    await syncAmmPriceToOracle();

    // can liquidate bad debt position
    await clearingHouse.connect(whale).liquidate(amm.address, shrimp.address);
  });

  it("cannot liquidate position by non backstop LP when bad debt", async () => {
    // close position should fail since bad debt
    // open notional = 80
    // estimated realized PnL (partial close) = 7.4 * 3.36 - 80 = -55.136
    // estimated remaining margin = 10 + (-55.136) = -45.136
    // real bad debt: 46.10795455
    await expect(
      clearingHouse.connect(shrimp).closePosition(amm.address, toDecimal(0))
    ).to.be.revertedWith("bad debt");

    // no need to manipulate TWAP because the spot price movement is large enough
    // that getMarginRatio() returns negative value already
    await syncAmmPriceToOracle();

    // can liquidate bad debt position
    await expect(
      clearingHouse.connect(whale).liquidate(amm.address, shrimp.address)
    ).to.be.revertedWith("not backstop LP");
  });
});
