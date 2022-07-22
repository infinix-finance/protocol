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
import { toFullDigit } from "../test/helper/number";
import { BigNumber } from "ethers";

const deployAmmAVAXUSDC3: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const API3PriceFeed = await hre.deployments.get("API3PriceFeed");
  const insuranceFund = await hre.deployments.get("InsuranceFund");
  const clearingHouse = await hre.deployments.get("ClearingHouse");

  console.log(`Deploying AVAX/USDC3 Amm...`);

  const deployResult = await deploy("AmmAVAXUSDC3", {
    contract: "Amm",
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          toFullDigit(10000),
          toFullDigit(100),
          toFullDigit(1),
          BigNumber.from(60 * 60),
          API3PriceFeed.address,
          PRICE_FEED_KEY,
          "0xeD0748d0c60D587fd26f830c786d1F7aB8204b0a",
          toFullDigit(0),
          toFullDigit(0),
          toFullDigit(0),
        ],
      },
    },
    args: [],
    log: true,
  });

  console.log(`AVAX/USDC3 Amm is deployed at ${deployResult.address}\n`);

  console.log(`Configuring AVAX/USDC3 Amm...`);
  console.log(`>>> Setting global shutdown...`);
  await execute(
    "AmmAVAXUSDC3",
    { from: deployer, log: true },
    "setGlobalShutdown",
    insuranceFund.address
  );
  console.log(`>>> Setting counter party...`);
  await execute(
    "AmmAVAXUSDC3",
    { from: deployer, log: true },
    "setCounterParty",
    clearingHouse.address
  );
  console.log("\n");

  console.log(`Configuring InsuranceFund...`);
  console.log(`>>> Adding AVAX/USDC3 Amm...`);
  await execute("InsuranceFund", { from: deployer, log: true }, "addAmm", deployResult.address);
  console.log("\n");

  console.log(`Opening AVAX/USDC3 Amm...`);
  await execute("AmmAVAXUSDC3", { from: deployer, log: true }, "setOpen", true);
  console.log("\n");

  // console.log(`Starting supply schedule...`);
  // await execute("SupplySchedule", { from: deployer, log: true }, "startSchedule");
  // console.log("\n");

  // try {
  //   await new Promise((r) => setTimeout(r, 30000));
  //   await run("verify:verify", {
  //     address: deployResult.address,
  //   });
  // } catch (error) {
  //   console.log(error);
  // }
};

export default deployAmmAVAXUSDC3;
deployAmmAVAXUSDC3.tags = ["AmmAVAXUSDC3"];
deployAmmAVAXUSDC3.dependencies = [
  "API3PriceFeed",
  "SupplySchedule",
  "InsuranceFund",
  "ClearingHouse",
];
