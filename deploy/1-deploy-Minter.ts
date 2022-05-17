import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

import { IFNX_TOKEN } from "../constants/constants";

const deployMinter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying Minter...`);

  const deployResult = await deploy("Minter", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [IFNX_TOKEN],
      },
    },
    args: [],
    log: true,
  });

  console.log(`Minter is deployed at ${deployResult.address}\n`);

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

export default deployMinter;
deployMinter.tags = ["Minter"];
