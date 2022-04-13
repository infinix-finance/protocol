import { expect, use } from "chai";
import { BigNumber } from "ethers";
import { waffle } from "hardhat";
import { AmmFake, AmmReader, API3PriceFeed, API3PriceFeedMock, ERC20Fake } from "../../types";
import {
  deployAmm,
  deployAmmReader,
  deployErc20Fake,
  deployAPI3MockPriceFeed,
} from "../helper/contract";
import { toFullDigit, toFullDigitStr } from "../helper/number";

describe("AmmReader Unit Test", () => {
  const ETH_PRICE = 100;
  const ETH_BYTES32 = "0x4554480000000000000000000000000000000000000000000000000000000000";

  let amm: AmmFake;
  let ammReader: AmmReader;
  let api3PriceFeed: API3PriceFeedMock;
  let quoteToken: ERC20Fake;
  let admin: string;

  beforeEach(async () => {
    const wallets = waffle.provider.getWallets();
    admin = wallets[0].address;

    api3PriceFeed = await deployAPI3MockPriceFeed(toFullDigit(ETH_PRICE));
    quoteToken = await deployErc20Fake(toFullDigit(20000000));
    amm = await deployAmm({
      deployer: admin,
      quoteAssetTokenAddr: quoteToken.address,
      priceFeedAddr: api3PriceFeed.address,
      fluctuation: toFullDigit(0),
      fundingPeriod: BigNumber.from(3600), // 1 hour
    });
    await amm.setCounterParty(admin);

    ammReader = await deployAmmReader();
  });

  it("verify inputs & outputs", async () => {
    const {
      quoteAssetReserve,
      baseAssetReserve,
      tradeLimitRatio,
      fundingPeriod,
      quoteAssetSymbol,
      baseAssetSymbol,
      priceFeedKey,
      priceFeed,
    } = await ammReader.getAmmStates(amm.address);
    expect(quoteAssetReserve).to.eq(toFullDigitStr(1000));
    expect(baseAssetReserve).to.eq(toFullDigitStr(100));
    expect(tradeLimitRatio).to.eq(toFullDigitStr(0.9));
    expect(fundingPeriod).to.eq("3600");
    expect(quoteAssetSymbol).to.eq("symbol");
    expect(baseAssetSymbol).to.eq("ETH");
    expect(priceFeedKey).to.eq(ETH_BYTES32);
    expect(priceFeed).to.eq(api3PriceFeed.address);
  });
});
