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

  before(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    dapiServer = await deployDapiServerFake();
    await dapiServer.deployed();

    priceFeed = await deployApi3PriceFeed(dapiServer.address);
    await priceFeed.deployed();
  });

  context("API3PriceFeed is allowed to read", function () {
    it("reads data feed with ID", async function () {
      const dataFeedId = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const dataFeedValue = toFullDigit(100);
      const dataFeedTimestamp = (await ethers.provider.getBlock(ethers.provider.getBlockNumber()))
        .timestamp;
      await dapiServer.mockDataFeed(dataFeedId, dataFeedValue, dataFeedTimestamp);
      const dapiName = ethers.utils.formatBytes32String("AVAX/USD");
      await dapiServer.mockDapiName(dapiName, dataFeedId);
      expect(await priceFeed.getPrice(dapiName)).to.equal("46506993328423072858");
    });
  });
  context("API3PriceFeed is not allowed to read", function () {
    it("reverts", async function () {
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
  });

  context("Stale prices", function () {
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
  });
});
