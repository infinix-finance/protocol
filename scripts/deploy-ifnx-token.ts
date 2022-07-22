import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const IfnxToken = await ethers.getContractFactory("IfnxToken");

  // Initial Supply 1,000,000,000
  const ifnxToken = await IfnxToken.deploy(ethers.utils.parseEther("1000000000"));

  await ifnxToken.deployed();

  console.log("IfnxToken deployed to:", ifnxToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
