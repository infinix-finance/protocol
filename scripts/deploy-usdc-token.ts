import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const TetherToken = await ethers.getContractFactory("TetherToken");

  // Initial Supply 1,000,000,000
  const usdc = await TetherToken.deploy(1e15, "USD Coin", "USDC", 6);

  await usdc.deployed();

  console.log("TetherToken deployed to:", usdc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
