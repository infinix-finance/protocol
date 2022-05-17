import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

import { IFNX_DECAY_RATE, IFNX_INFLATION_RATE, IFNX_MINT_DURATION } from "../constants/constants";

const deploySupplySchedule: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, execute },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const minter = await hre.deployments.get("Minter");

  console.log(`Deploying SupplySchedule...`);

  const deployResult = await deploy("SupplySchedule", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [minter.address, IFNX_INFLATION_RATE, IFNX_DECAY_RATE, IFNX_MINT_DURATION],
      },
    },
    args: [],
    log: true,
  });

  console.log(`SupplySchedule is deployed at ${deployResult.address}\n`);

  console.log(`Configuring Minter...`);
  console.log(`>>> Setting supply schedule...`);
  await execute("Minter", { from: deployer, log: true }, "setSupplySchedule", deployResult.address);
  console.log("\n");

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

export default deploySupplySchedule;
deploySupplySchedule.tags = ["SupplySchedule"];
deploySupplySchedule.dependencies = ["Minter"];
