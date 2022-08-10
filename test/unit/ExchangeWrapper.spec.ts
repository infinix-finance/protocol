import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import {
  ERC20Fake,
  ExchangeWrapper,
  IERC20,
  IfnxToken,
  JoeRouterMock,
  TetherToken,
} from "../../types";
import { deployErc20Fake, deployExchangeWrapper, deployMockJoeRouter } from "../helper/contract";
import { toDecimal, toFullDigit } from "../helper/number";

// skip, won't be in v1
describe("ExchangeWrapper Unit Test", () => {
  let addresses: Wallet[];
  let admin: Wallet;
  let alice: Wallet;

  let exchangeWrapper: ExchangeWrapper;
  let tether: TetherToken;
  let usdc: TetherToken;
  let erc20Fake: ERC20Fake;
  let joeRouter: JoeRouterMock;

  before(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    const TetherTokenFactory = await ethers.getContractFactory("TetherToken");
    tether = await TetherTokenFactory.deploy(toFullDigit(1000), "Tether", "USDT", 6);
    usdc = await TetherTokenFactory.deploy(toFullDigit(1000), "USDC", "USDC", 6);
    erc20Fake = await deployErc20Fake(toFullDigit(10000), "NAME", "SYMBOL");
    joeRouter = await deployMockJoeRouter();

    exchangeWrapper = await deployExchangeWrapper(joeRouter.address, erc20Fake.address);
  });

  it("getSpotPrice, usdc in", async () => {
    // tether 6 decimals, erc20Fake 18 decimals
    // spot price will be n*(e-(18-6))*e18 = n*(e-12)*e18 = n*e6
    // assuming n = 1 here
    await joeRouter.mockSetSpotPrice("1000000");
    const r = await exchangeWrapper.getSpotPrice(usdc.address, erc20Fake.address);
    expect(r.d).to.eq(toFullDigit(1));
  });

  it("getSpotPrice, usdc out", async () => {
    // tether 6 decimals, erc20Fake 18 decimals
    // spot price will be n*(e(18-6))*e18 = n*(e12)*e18 = n*e30
    // assuming n = 1 here
    await joeRouter.mockSetSpotPrice(toFullDigit(1000000000000));
    const r = await exchangeWrapper.getSpotPrice(erc20Fake.address, usdc.address);
    expect(r.d).to.eq(toFullDigit(1));
  });

  it("getSpotPrice, erc20 in/out", async () => {
    const spotPrice = await exchangeWrapper.getSpotPrice(erc20Fake.address, erc20Fake.address);
    expect(spotPrice.d).to.eq(toFullDigit(1));
  });

  it("getSpotPrice, usdc in/out", async () => {
    const spotPrice = await exchangeWrapper.getSpotPrice(usdc.address, usdc.address);
    expect(spotPrice.d).to.eq(toFullDigit(1));
  });

  it("getSpotPrice, usdt in/out", async () => {
    const spotPrice = await exchangeWrapper.getSpotPrice(tether.address, tether.address);
    expect(spotPrice.d).to.eq(toFullDigit(1));
  });

  it("getInputPrice, usdt in/out", async () => {
    const amount = toDecimal(100);
    const outputPrice = await exchangeWrapper.getInputPrice(tether.address, tether.address, amount);
    expect(outputPrice.d).to.eq(amount.d);
  });

  it("getOutputPrice, usdt in/out", async () => {
    const amount = toDecimal(100);
    const outputPrice = await exchangeWrapper.getOutputPrice(
      tether.address,
      tether.address,
      amount
    );
    expect(outputPrice.d).to.eq(amount.d);
  });

  it("force error, only owner can setBalancerPool", async () => {
    await expect(exchangeWrapper.connect(alice).setJoeRouter(alice.address)).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: caller is not the owner"
    );
  });

  it("force error, only owner can approve", async () => {
    await expect(
      exchangeWrapper.connect(alice).approve(alice.address, alice.address, toDecimal(10))
    ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
  });

  it("admin should be able to set twap oracle for tokens", async () => {
    const fakeTwapAddr = "0x0000000000000000000000000000000000000001";
    await expect(
      exchangeWrapper.connect(admin).setTwapOracle(erc20Fake.address, usdc.address, fakeTwapAddr)
    )
      .to.emit(exchangeWrapper, "TwapOracleUpdated")
      .withArgs(erc20Fake.address, usdc.address, fakeTwapAddr);
    expect(
      await exchangeWrapper.twapOracles(
        ethers.utils.keccak256(ethers.utils.hexConcat([erc20Fake.address, usdc.address]))
      )
    ).to.eq(fakeTwapAddr);
  });

  it("admin should be not able to set twap oracle for invalid tokens", async () => {
    const fakeTwapAddr = "0x0000000000000000000000000000000000000001";
    await expect(
      exchangeWrapper.connect(admin).setTwapOracle(usdc.address, usdc.address, fakeTwapAddr)
    ).to.be.revertedWith("invalid tokens");
    await expect(
      exchangeWrapper
        .connect(admin)
        .setTwapOracle(usdc.address, usdc.address, ethers.constants.AddressZero)
    ).to.be.revertedWith("invalid tokens");
  });

  it("admin should be able to update twap oracle for tokens", async () => {
    const fakeTwapAddr = "0x0000000000000000000000000000000000000002";
    await expect(
      exchangeWrapper.connect(admin).setTwapOracle(erc20Fake.address, usdc.address, fakeTwapAddr)
    )
      .to.emit(exchangeWrapper, "TwapOracleUpdated")
      .withArgs(erc20Fake.address, usdc.address, fakeTwapAddr);
    expect(
      await exchangeWrapper.twapOracles(
        ethers.utils.keccak256(ethers.utils.hexConcat([erc20Fake.address, usdc.address]))
      )
    ).to.eq(fakeTwapAddr);
  });

  it("admin should be able to reset twap oracle for tokens", async () => {
    await expect(
      exchangeWrapper
        .connect(admin)
        .setTwapOracle(erc20Fake.address, usdc.address, ethers.constants.AddressZero)
    )
      .to.emit(exchangeWrapper, "TwapOracleUpdated")
      .withArgs(erc20Fake.address, usdc.address, ethers.constants.AddressZero);
    expect(
      await exchangeWrapper.twapOracles(
        ethers.utils.keccak256(ethers.utils.hexConcat([erc20Fake.address, usdc.address]))
      )
    ).to.eq(ethers.constants.AddressZero);
  });

  it("admin should be not able to set twap oracle for invalid tokens - sanity checks", async () => {
    const fakeTwapAddr = "0x0000000000000000000000000000000000000001";
    await expect(
      exchangeWrapper
        .connect(admin)
        .setTwapOracle(exchangeWrapper.address, usdc.address, fakeTwapAddr)
    ).to.be.reverted;
    await expect(
      exchangeWrapper
        .connect(admin)
        .setTwapOracle(usdc.address, exchangeWrapper.address, fakeTwapAddr)
    ).to.be.reverted;
    await expect(
      exchangeWrapper
        .connect(admin)
        .setTwapOracle(usdc.address, exchangeWrapper.address, ethers.constants.AddressZero)
    ).to.be.reverted;
  });

  it("non admin should be not able to set twap oracle for tokens", async () => {
    const fakeTwapAddr = "0x0000000000000000000000000000000000000001";
    await expect(
      exchangeWrapper.connect(alice).setTwapOracle(erc20Fake.address, usdc.address, fakeTwapAddr)
    ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
    await expect(
      exchangeWrapper
        .connect(alice)
        .setTwapOracle(erc20Fake.address, usdc.address, ethers.constants.AddressZero)
    ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
    await expect(
      exchangeWrapper.connect(alice).setTwapOracle(usdc.address, usdc.address, fakeTwapAddr)
    ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
  });
});
