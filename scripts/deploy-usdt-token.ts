import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const TetherToken = await ethers.getContractFactory("TetherToken");

  // Initial Supply 1,000,000,000
  const tether = await TetherToken.deploy(1e15, "TetherToken", "USDT", 6);

  await tether.deployed();

  console.log("TetherToken deployed to:", tether.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
