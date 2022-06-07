import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

import { DAPI_SERVER } from "../constants/constants";

const deployAPI3PriceFeed: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying API3PriceFeed...`);

  const deployResult = await deploy("API3PriceFeed", {
    from: deployer,
    args: [DAPI_SERVER],
    log: true,
  });

  console.log(`API3PriceFeed is deployed at ${deployResult.address}\n`);

  // try {
  //   await new Promise((r) => setTimeout(r, 30000));
  //   await run("verify:verify", {
  //     address: deployResult.address,
  //     constructorArguments: [SELF_SERVE_RRP_BEACON_WHITELISTER],
  //   });
  // } catch (error) {
  //   console.log(error);
  // }
};

export default deployAPI3PriceFeed;
deployAPI3PriceFeed.tags = ["Api3API3PriceFeed"];
