import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

const deployMetaTxGateway: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, deploy },
    getNamedAccounts,
    network: {
      config: { chainId },
    },
  } = hre;
  const { deployer } = await getNamedAccounts();

  if (process.env.WITH_PROXY) return;

  const deployResult = await deploy("MetaTxGateway", {
    from: deployer,
    // proxy: {
    //   proxyContract: ,
    //   methodName: 'initialize'
    // },
    args: [],
    log: true,
  });

  await execute("MetaTxGateway", { from: deployer, log: true }, "initialize", "Ifnx", "1", chainId);

  try {
    await new Promise((r) => setTimeout(r, 30000));
    await run("verify:verify", {
      address: deployResult.address,
    });
  } catch (error) {
    console.log(error);
  }
};

export default deployMetaTxGateway;
deployMetaTxGateway.tags = ["MetaTxGateway"];
