import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

const deployRewardsDistribution: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const minter = await hre.deployments.get("Minter");
  const stakingReserve = await hre.deployments.get("StakingReserve");

  console.log(`Deploying RewardsDistribution...`);

  const deployResult = await deploy("RewardsDistribution", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [minter.address, stakingReserve.address],
      },
    },
    args: [],
    log: true,
  });

  console.log(`RewardsDistribution is deployed at ${deployResult.address}\n`);

  console.log(`Configuring Minter...`);
  console.log(`>>> Setting reward distribution...`);
  await execute(
    "Minter",
    { from: deployer, log: true },
    "setRewardsDistribution",
    deployResult.address
  );
  console.log("\n");

  console.log(`Configuring StakingReserve...`);
  console.log(`>>> Setting reward distribution...`);
  await execute(
    "StakingReserve",
    { from: deployer, log: true },
    "setRewardsDistribution",
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

export default deployRewardsDistribution;
deployRewardsDistribution.tags = ["RewardsDistribution"];
deployRewardsDistribution.dependencies = ["Minter", "StakingReserve"];
