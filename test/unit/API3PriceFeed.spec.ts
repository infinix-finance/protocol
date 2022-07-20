import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { API3PriceFeed, DapiServerFake } from "../../types";
import { deployApi3PriceFeed, deployDapiServerFake } from "../helper/contract";
import { toFullDigit } from "../helper/number";

describe("API3PriceFeed Unit Test", () => {
  let addresses: Wallet[];
  let admin: Wallet;
  let alice: Wallet;

  let priceFeed: API3PriceFeed;
  let dapiServer: DapiServerFake;

  beforeEach(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    dapiServer = await deployDapiServerFake();
    await dapiServer.deployed();

    priceFeed = await deployApi3PriceFeed(dapiServer.address);
    await priceFeed.deployed();
  });

  it("should have correct default parameters", async () => {
    expect(await priceFeed.owner()).to.eq(admin.address);
    expect(await priceFeed.stalePriceThreshold()).to.eq(24 * 60 * 60);
  });

  it("API3PriceFeed is allowed to read - reads data feed with ID", async function () {
    const dataFeedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const dataFeedValue = toFullDigit(100);
    const dataFeedTimestamp = (await ethers.provider.getBlock(ethers.provider.getBlockNumber()))
      .timestamp;
    await dapiServer.mockDataFeed(dataFeedId, dataFeedValue, dataFeedTimestamp);
    const dapiName = ethers.utils.formatBytes32String("AVAX/USD");
    await dapiServer.mockDapiName(dapiName, dataFeedId);
    expect(await priceFeed.getPrice(dapiName)).to.equal("46506993328423072858");
  });

  it("API3PriceFeed is not allowed to read - reverts", async function () {
    const dataFeedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const dataFeedValue = toFullDigit(100);
    const dataFeedTimestamp = (await ethers.provider.getBlock(ethers.provider.getBlockNumber()))
      .timestamp;
    await dapiServer.mockDataFeed(dataFeedId, dataFeedValue, dataFeedTimestamp);
    const dapiName = ethers.utils.formatBytes32String("AVAX?USD");
    await dapiServer.mockDapiName(dapiName, dataFeedId);
    await dapiServer.mockIfAllowedToRead(false);
    await expect(priceFeed.getPrice(dapiName)).to.be.revertedWith("Sender cannot read");
  });

  it("reverts on stale price", async () => {
    await dapiServer.mockIfAllowedToRead(true);
    const dataFeedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const dataFeedValue = toFullDigit(100);
    const dataFeedTimestamp =
      (await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp - 25 * 60 * 60;
    await dapiServer.mockDataFeed(dataFeedId, dataFeedValue, dataFeedTimestamp);
    const dapiName = ethers.utils.formatBytes32String("AVAX/USD");
    await dapiServer.mockDapiName(dapiName, dataFeedId);
    await expect(priceFeed.getPrice(dapiName)).to.be.revertedWith("stale price feed");
  });

  it("does not revert on fresh price", async () => {
    const dataFeedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const dataFeedValue = toFullDigit(100);
    const dataFeedTimestamp =
      (await ethers.provider.getBlock(ethers.provider.getBlockNumber())).timestamp - 23 * 60 * 60;
    await dapiServer.mockDataFeed(dataFeedId, dataFeedValue, dataFeedTimestamp);
    const dapiName = ethers.utils.formatBytes32String("AVAX/USD");
    await dapiServer.mockDapiName(dapiName, dataFeedId);
    expect(await priceFeed.getPrice(dapiName)).to.equal("46506993328423072858");
  });

  it("admin should be able to set stalePriceThreshold", async () => {
    expect(await priceFeed.stalePriceThreshold()).to.eq(24 * 60 * 60);
    const newThreshold = 48 * 60 * 60;
    await expect(priceFeed.connect(admin).setStalePriceThreshold(newThreshold))
      .to.emit(priceFeed, "StalePriceThresholdChanged")
      .withArgs(24 * 60 * 60, newThreshold);
    expect(await priceFeed.stalePriceThreshold()).to.eq(newThreshold);
  });

  it("non admin should not be able to set stalePriceThreshold", async () => {
    const newThreshold = 48 * 60 * 60;
    await expect(priceFeed.connect(alice).setStalePriceThreshold(newThreshold)).to.be.revertedWith(
      "caller is not the owner"
    );
  });

  it("admin should be able to transfer ownership", async () => {
    expect(await priceFeed.owner()).to.eq(admin.address);
    await expect(priceFeed.connect(admin).transferOwnership(alice.address))
      .to.emit(priceFeed, "OwnershipTransferred")
      .withArgs(admin.address, alice.address);
    expect(await priceFeed.owner()).to.eq(alice.address);
  });

  it("admin should be able to renounce ownership", async () => {
    expect(await priceFeed.owner()).to.eq(admin.address);
    await expect(priceFeed.connect(admin).transferOwnership(ethers.constants.AddressZero))
      .to.emit(priceFeed, "OwnershipTransferred")
      .withArgs(admin.address, ethers.constants.AddressZero);
    expect(await priceFeed.owner()).to.eq(ethers.constants.AddressZero);
  });

  it("non admin should not be able to transfer ownership", async () => {
    expect(await priceFeed.owner()).to.not.eq(alice.address);
    await expect(priceFeed.connect(alice).transferOwnership(alice.address)).to.be.revertedWith(
      "caller is not the owner"
    );
  });
});
