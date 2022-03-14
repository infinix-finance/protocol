import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  QUOTE_ASSET_RESERVE,
  BASE_ASSET_RESERVE,
  TRADE_LIMIT_RATIO,
  FUNDING_PERIOD,
  PRICE_FEED_KEY,
  QUOTE_ASSET,
  FLUNCTUATION_LIMIT_RATIO,
  TOLL_RATIO,
  SPREAD_RATIO
} from "../constants/constants";
import { run } from "hardhat";


const deployAmm: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy, log},
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const oracle =  await hre.deployments.get('Api3Oracle');



  const deployResult = await deploy("Amm", {
    from: deployer,
    // proxy: {
    //   owner: deployer,
    //   proxyContract: "",
    //   execute: {
    //     init: {
    //       methodName: "initialize",
    //       args: [
    //         QUOTE_ASSET_RESERVE,
    //         BASE_ASSET_RESERVE,
    //         TRADE_LIMIT_RATIO,
    //         FUNDING_PERIOD,
    //         oracle.address,
    //         PRICE_FEED_KEY,
    //         QUOTE_ASSET,
    //         FLUNCTUATION_LIMIT_RATIO,
    //         TOLL_RATIO,
    //         SPREAD_RATIO 
    //       ]
    //     }
    //   }
    // },
    args: [],
    log: true,
  });


  if (deployResult.newlyDeployed) {
    log(
      `*** Amm deployed at ${deployResult.address} using ${deployResult.receipt?.gasUsed} ***`
    );
  }

  await execute('Amm', {from: deployer, log: true}, 'initialize',
    QUOTE_ASSET_RESERVE,
    BASE_ASSET_RESERVE,
    TRADE_LIMIT_RATIO,
    FUNDING_PERIOD,
    oracle.address,
    PRICE_FEED_KEY,
    QUOTE_ASSET,
    FLUNCTUATION_LIMIT_RATIO,
    TOLL_RATIO,
    SPREAD_RATIO
  );


  try {
    await new Promise(r => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address
    });
  } catch (error) {
    console.log(error);
  }

};

export default deployAmm;
deployAmm.tags = ["Amm"];
deployAmm.dependencies = ["Api3Oracle"];
