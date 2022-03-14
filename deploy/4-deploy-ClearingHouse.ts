import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  INIT_MARGIN_RATIO,
  MAINTENANCE_MARGIN_RATIO,
  LIQUIDATION_FEE_RATIO,
  TRUSTED_FORWARDER
} from "../constants/constants";

import { run } from "hardhat";

const deployClearingHouse: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy, log},
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const insuranceFund =  await hre.deployments.get('InsuranceFund');

  

  const deployResult = await deploy("ClearingHouse", {
    from: deployer,
    // proxy: {
    //   proxyContract: "" ,
    //   methodName: 'initialize',
    //   execute: {
    //     init: {
    //       methodName: "initialize",
    //       args: [
    //         INIT_MARGIN_RATIO,
    //         MAINTENANCE_MARGIN_RATIO,
    //         LIQUIDATION_FEE_RATIO,
    //         insuranceFund.address,
    //         TRUSTED_FORWARDER
    //       ]
    //     }
    //   }
    // },
    args: [],
    log: true,
  });

  if (deployResult.newlyDeployed) {
    log(
      `*** ClearingHouse deployed at ${deployResult.address} using ${deployResult.receipt?.gasUsed} ***`
    );
  }

  // await execute('ClearingHouse', {from: deployer}, 'initialize', [
  //   INIT_MARGIN_RATIO,
  //   MAINTENANCE_MARGIN_RATIO,
  //   LIQUIDATION_FEE_RATIO,
  //   insuranceFund.address,
  //   TRUSTED_FORWARDER
  // ]);


  try {
    await new Promise(r => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address
    });
  } catch (error) {
    console.log(error);
  }

};

export default deployClearingHouse;
deployClearingHouse.tags = ["ClearingHouse"];
// deployClearingHouse.dependencies = ["InsuranceFund"]
