import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { SELF_SERVE_RRP_BEACON_WHITELISTER } from "../constants/constants";
import { run } from "hardhat";

const deployAPI3PriceFeed: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const deployResult = await deploy("API3PriceFeed", {
    from: deployer,
    // proxy: {
    //   proxyContract: ,
    // },
    args: [SELF_SERVE_RRP_BEACON_WHITELISTER],
    log: true,
  });

  try {
    await new Promise((r) => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address,
      constructorArguments: [SELF_SERVE_RRP_BEACON_WHITELISTER],
    });
  } catch (error) {
    console.log(error);
  }
};

export default deployAPI3PriceFeed;
deployAPI3PriceFeed.tags = ["Api3API3PriceFeed"];
