import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

import {
  INIT_MARGIN_RATIO,
  MAINTENANCE_MARGIN_RATIO,
  LIQUIDATION_FEE_RATIO,
} from "../constants/constants";

const deployClearingHouse: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const insuranceFund = await hre.deployments.get("InsuranceFund");

  console.log(`Deploying ClearingHouse...`);

  const deployResult = await deploy("ClearingHouse", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          INIT_MARGIN_RATIO,
          MAINTENANCE_MARGIN_RATIO,
          LIQUIDATION_FEE_RATIO,
          insuranceFund.address,
        ],
      },
    },
    log: true,
  });

  console.log(`ClearingHouse is deployed at ${deployResult.address}\n`);

  console.log(`Configuring InsuranceFund...`);
  console.log(`>>> Setting beneficiary...`);
  await execute(
    "InsuranceFund",
    { from: deployer, log: true },
    "setBeneficiary",
    deployResult.address
  );
  console.log("\n");

  // try {
  //   await new Promise((r) => setTimeout(r, 30000));
  //   await run("verify:verify", {
  //     address: deployResult.address,
  //   });
  // } catch (error) {
  //   console.log(error);
  // }
};

export default deployClearingHouse;
deployClearingHouse.tags = ["ClearingHouse"];
deployClearingHouse.dependencies = ["InsuranceFund"];
