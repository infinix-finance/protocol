import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import {
  API3PriceFeed,
  RrpBeaconServerFake,
  SelfServeRrpBeaconServerWhitelisterMock,
} from "../../types";
import {
  deployApi3PriceFeed,
  deployRrpBeaconServerFake,
  deploySelfServeRrpBeaconServerWhitelisterMock,
} from "../helper/contract";
import { toDecimal, toFullDigit } from "../helper/number";

describe.only("API3PriceFeed Unit Test", () => {
  let addresses: Wallet[];
  let admin: Wallet;
  let alice: Wallet;

  let priceFeed: API3PriceFeed;
  let rrpServer: RrpBeaconServerFake;
  let whitelister: SelfServeRrpBeaconServerWhitelisterMock;

  before(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];

    rrpServer = await deployRrpBeaconServerFake();
    await rrpServer.deployed();

    whitelister = await deploySelfServeRrpBeaconServerWhitelisterMock();
    await whitelister.deployed();

    await whitelister.mockSetRrpBeaconServer(rrpServer.address);

    expect(await whitelister.rrpBeaconServer()).to.eq(rrpServer.address);

    priceFeed = await deployApi3PriceFeed(whitelister.address);
    await priceFeed.deployed();
  });

  it("setBeacon, getBeacon, isPriceFeedWhitelisted", async () => {
    const priceFeedKey = ethers.utils.solidityKeccak256(["string"], ["priceFeedKey"]);
    const beaconId = ethers.utils.solidityKeccak256(["string"], ["beaconId"]);

    const r = await priceFeed.setBeacon(priceFeedKey, beaconId);
    expect(r).to.emit(priceFeed, "BeaconWhitelisted").withArgs(priceFeedKey, beaconId);

    const isWhitelisted = await priceFeed.isPriceFeedWhitelisted(priceFeedKey);
    expect(isWhitelisted).to.be.eq(true);

    const setBeaconId = await priceFeed.getBeacon(priceFeedKey);
    expect(setBeaconId).to.be.eq(beaconId);
  });

  it("getPrice", async () => {
    const priceFeedKey = ethers.utils.solidityKeccak256(["string"], ["priceFeedKey"]);
    const beaconId = ethers.utils.solidityKeccak256(["string"], ["beaconId"]);

    await priceFeed.setBeacon(priceFeedKey, beaconId);

    const value = toFullDigit(100);
    await rrpServer.mockSetValueAndTimestamp(value, 0);

    await priceFeed.getPrice(priceFeedKey);
  });
});
