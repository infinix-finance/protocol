import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";


const deployInsuranceFund: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy, log},
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const deployResult = await deploy("InsuranceFund", {
    from: deployer,
    // proxy: {
    //   proxyContract: ,
    //   methodName: 'initialize'
    // },
    args: [],
    log: true,
  });

  if (deployResult.newlyDeployed) {
    log(
      `*** InsuranceFund deployed at ${deployResult.address} using ${deployResult.receipt?.gasUsed} ***`
    );
  }

  await execute('InsuranceFund', {from: deployer, log: true}, 'initialize');

  try {
    await new Promise(r => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address
    });
  } catch (error) {
    console.log(error);
  }

};

export default deployInsuranceFund;
deployInsuranceFund.tags = ["InsuranceFund"];