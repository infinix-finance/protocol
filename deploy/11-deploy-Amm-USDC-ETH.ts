import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

import {
  QUOTE_ASSET_RESERVE,
  BASE_ASSET_RESERVE,
  TRADE_LIMIT_RATIO,
  FUNDING_PERIOD,
  PRICE_FEED_KEY,
  QUOTE_ASSET,
  FLUNCTUATION_LIMIT_RATIO,
  TOLL_RATIO,
  SPREAD_RATIO,
} from "../constants/constants";

const deployAmmUSDCETH: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const API3PriceFeed = await hre.deployments.get("API3PriceFeed");
  const insuranceFund = await hre.deployments.get("InsuranceFund");
  const clearingHouse = await hre.deployments.get("ClearingHouse");

  console.log(`Deploying USDC/ETH Amm...`);

  const deployResult = await deploy("Amm", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          QUOTE_ASSET_RESERVE,
          BASE_ASSET_RESERVE,
          TRADE_LIMIT_RATIO,
          FUNDING_PERIOD,
          API3PriceFeed.address,
          PRICE_FEED_KEY,
          QUOTE_ASSET,
          FLUNCTUATION_LIMIT_RATIO,
          TOLL_RATIO,
          SPREAD_RATIO,
        ],
      },
    },
    args: [],
    log: true,
  });

  console.log(`USDC/ETH Amm is deployed at ${deployResult.address}\n`);

  console.log(`Configuring USDC/ETH Amm...`);
  console.log(`>>> Setting global shutdown...`);
  await execute("Amm", { from: deployer, log: true }, "setGlobalShutdown", insuranceFund.address);
  console.log(`>>> Setting counter party...`);
  await execute("Amm", { from: deployer, log: true }, "setCounterParty", clearingHouse.address);
  console.log("\n");

  console.log(`Configuring InsuranceFund...`);
  console.log(`>>> Adding USDC/ETH Amm...`);
  await execute("InsuranceFund", { from: deployer, log: true }, "addAmm", deployResult.address);
  console.log("\n");

  console.log(`Opening USDC/ETH Amm...`);
  await execute("Amm", { from: deployer, log: true }, "setOpen", true);
  console.log("\n");
      
  console.log(`Starting supply schedule...`);
  await execute("SupplySchedule", { from: deployer, log: true }, "startSchedule");
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

export default deployAmmUSDCETH;
deployAmmUSDCETH.tags = ["AmmUSDCETH"];
deployAmmUSDCETH.dependencies = [
  "API3PriceFeed",
  "SupplySchedule",
  "InsuranceFund",
  "ClearingHouse",
];
