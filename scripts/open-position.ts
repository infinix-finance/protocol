import { Wallet } from "ethers";
import { deployments, ethers } from "hardhat";
import { Side } from "../test/helper/contract";
import { toDecimal, toFullDigit } from "../test/helper/number";
import { TetherToken } from "../types";

async function main() {
  const [alice, bob] = await ethers.getSigners();

  const TetherToken = await ethers.getContractFactory("TetherToken");
  const quoteToken = await TetherToken.attach("0xeD0748d0c60D587fd26f830c786d1F7aB8204b0a");

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = await ClearingHouse.attach("0x115eB30d254161Fc7C16a2E20c1c34aCbA56cCD1");

  const Amm = await ethers.getContractFactory("Amm");
  const amm = Amm.attach("0xE5639cBB02eC3bd65c77E128B0c7350AeEFb2bd1");

  await quoteToken.connect(alice).approve(clearingHouse.address, toFullDigit(2000));
  await quoteToken.connect(bob).approve(clearingHouse.address, toFullDigit(2000));

  await new Promise((r) => setTimeout(r, 2000));

  await clearingHouse
    .connect(alice)
    .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(2), toDecimal(0));

  await new Promise((r) => setTimeout(r, 2000));

  await new Promise((r) => setTimeout(r, 2000));

  await clearingHouse
    .connect(bob)
    .openPosition(amm.address, Side.BUY, toDecimal(100), toDecimal(2), toDecimal(0));

  let alicePosition = await clearingHouse.getPosition(amm.address, alice.address);
  let bobPosition = await clearingHouse.getPosition(amm.address, bob.address);

  console.log(alicePosition);
  console.log(bobPosition);

  await clearingHouse
    .connect(bob)
    .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));
  await new Promise((r) => setTimeout(r, 2000));
  await clearingHouse
    .connect(alice)
    .openPosition(amm.address, Side.SELL, toDecimal(100), toDecimal(2), toDecimal(0));
  await new Promise((r) => setTimeout(r, 2000));
  alicePosition = await clearingHouse.getPosition(amm.address, alice.address);
  bobPosition = await clearingHouse.getPosition(amm.address, bob.address);

  console.log(alicePosition);
  console.log(bobPosition);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
