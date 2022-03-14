import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {SELF_SERVE_RRP_BEACON_WHITELISTER} from "../constants/constants";

import { run } from "hardhat";

const deployOracle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log},
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();


  const deployResult = await deploy("Api3Oracle", {
    from: deployer,
    // proxy: {
    //   proxyContract: ,
    // },
    args: [SELF_SERVE_RRP_BEACON_WHITELISTER],
    log: true,
  });

  if (deployResult.newlyDeployed) {
    log(
      `*** Oracle deployed at ${deployResult.address} using ${deployResult.receipt?.gasUsed} ***`
    );
  }

  try {
    await new Promise(r => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address,
      constructorArguments: [SELF_SERVE_RRP_BEACON_WHITELISTER]
    });
  } catch (error) {
    console.log(error);
  }
};

export default deployOracle;
deployOracle.tags = ["Api3Oracle"];
