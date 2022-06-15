import {ethers} from 'hardhat';

async function main() {
  const API3PriceFeed = await ethers.getContractFactory('API3PriceFeed');

  const api3PriceFeed = await API3PriceFeed.attach("0x795036637AeB61359F1435C66117A371A433C174");

  const dapiName = process.env.DAPI_NAME;
  if (!dapiName) {
    throw new Error('dAPI name not defined');
  }
  const encodedDapiName = ethers.utils.formatBytes32String(dapiName);
  const dapi = await api3PriceFeed.getPrice(encodedDapiName);
  console.log(
    `API3PriceFeed at ${
      api3PriceFeed.address
    } read dAPI with name ${dapiName} as \n  value: ${dapi.toString()}\n}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
