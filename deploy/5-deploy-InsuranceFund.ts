import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

const deployInsuranceFund: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const minter = await hre.deployments.get("Minter");
  const exchangeWrapper = await hre.deployments.get("ExchangeWrapper");
  const inflationMonitor = await hre.deployments.get("InflationMonitor");

  console.log(`Deploying InsuranceFund...`);

  const deployResult = await deploy("InsuranceFund", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [],
      },
    },
    args: [],
    log: true,
  });

  console.log(`InsuranceFund is deployed at ${deployResult.address}\n`);

  console.log(`Configuring Minter...`);
  console.log(`>>> Setting insurance fund...`);
  await execute("Minter", { from: deployer, log: true }, "setInsuranceFund", deployResult.address);
  console.log("\n");

  console.log(`Configuring InsuranceFund...`);
  console.log(`>>> Setting exchange...`);
  await execute(
    "InsuranceFund",
    { from: deployer, log: true },
    "setExchange",
    exchangeWrapper.address
  );
  console.log(`>>> Setting minter...`);
  await execute("InsuranceFund", { from: deployer, log: true }, "setMinter", minter.address);
  console.log(`>>> Setting inflation monitor...`);
  await execute(
    "InsuranceFund",
    { from: deployer, log: true },
    "setInflationMonitor",
    inflationMonitor.address
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

export default deployInsuranceFund;
deployInsuranceFund.tags = ["InsuranceFund"];
deployInsuranceFund.dependencies = ["Minter", "InflationMonitor", "ExchangeWrapper"];
