import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  INIT_MARGIN_RATIO,
  MAINTENANCE_MARGIN_RATIO,
  LIQUIDATION_FEE_RATIO,
} from "../constants/constants";
import { run } from "hardhat";

const deployClearingHouse: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const insuranceFund = await hre.deployments.get("InsuranceFund");
  const metaTxGateway = await hre.deployments.get("MetaTxGateway");

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

  // await execute('ClearingHouse', {from: deployer}, 'initialize', [
  //   INIT_MARGIN_RATIO,
  //   MAINTENANCE_MARGIN_RATIO,
  //   LIQUIDATION_FEE_RATIO,
  //   insuranceFund.address,
  //   TRUSTED_FORWARDER
  // ]);

  // await execute("ClearingHouse", { from: deployer }, "setInitialMarginRatio", INIT_MARGIN_RATIO);
  // await execute(
  //   "ClearingHouse",
  //   { from: deployer },
  //   "setMaintenanceMarginRatio",
  //   MAINTENANCE_MARGIN_RATIO
  // );
  // await execute(
  //   "ClearingHouse",
  //   { from: deployer },
  //   "setLiquidationFeeRatio",
  //   LIQUIDATION_FEE_RATIO
  // );

  // await execute(
  //   "ClearingHouse",
  //   { from: deployer, log: true },
  //   "setInsuranceFund",
  //   insuranceFund.address
  // );
  // await execute(
  //   "ClearingHouse",
  //   { from: deployer, log: true },
  //   "setTrustedForwarder",
  //   metaTxGateway.address
  // );

  // Add MetaTXGateway whitelist
  // await execute(
  //   "MetaTxGateway",
  //   { from: deployer, log: true },
  //   "addToWhitelists",
  //   deployResult.address
  // );

  // // Set InsuranceFund beneficiary
  // await execute(
  //   "InsuranceFund",
  //   { from: deployer, log: true },
  //   "setBeneficiary",
  //   deployResult.address
  // );

  try {
    await new Promise((r) => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address,
    });
  } catch (error) {
    console.log(error);
  }
};

export default deployClearingHouse;
deployClearingHouse.tags = ["ClearingHouse"];
deployClearingHouse.dependencies = ["MetaTxGateway", "InsuranceFund"];
