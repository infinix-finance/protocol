import { BigNumber } from "ethers";
import {
  AmmFake,
  AmmReader,
  API3PriceFeedMock,
  ClearingHouseFake,
  ClearingHouseViewer,
  ClientBridge,
  ERC20Fake,
  ExchangeWrapperMock,
  IfnxToken,
  InflationMonitorFake,
  InsuranceFundFake,
  MetaTxGateway,
  Minter,
  RewardsDistributionFake,
  StakingReserveFake,
  SupplyScheduleFake,
} from "../../types";
import {
  deployAmm,
  deployAmmReader,
  deployAPI3MockPriceFeed,
  deployClearingHouse,
  deployClearingHouseViewer,
  deployClientBridge,
  deployErc20Fake,
  deployIfnxToken,
  deployInflationMonitor,
  deployInsuranceFund,
  deployMetaTxGateway,
  deployMinter,
  deployMockAMBBridge,
  deployMockExchangeWrapper,
  deployMockMultiToken,
  deployRewardsDistribution,
  deployStakingReserve,
  deploySupplySchedule,
} from "./contract";

import { toDecimal, toFullDigit } from "./number";

export interface PerpContracts {
  metaTxGateway: MetaTxGateway;
  quoteToken: ERC20Fake;
  priceFeed: API3PriceFeedMock;
  ifnxToken: IfnxToken;
  supplySchedule: SupplyScheduleFake;
  stakingReserve: StakingReserveFake;
  exchangeWrapper: ExchangeWrapperMock;
  insuranceFund: InsuranceFundFake;
  clearingHouse: ClearingHouseFake;
  rewardsDistribution: RewardsDistributionFake;
  amm: AmmFake;
  ammReader: AmmReader;
  clearingHouseViewer: ClearingHouseViewer;
  inflationMonitor: InflationMonitorFake;
  minter: Minter;
  clientBridge: ClientBridge;
}

export interface ContractDeployArgs {
  sender: string;
  quoteTokenAmount?: BigNumber;
  ifnxInitSupply?: BigNumber;
  ifnxRewardVestingPeriod?: BigNumber;
  ifnxInflationRate?: BigNumber;
  ifnxMintDuration?: BigNumber;
  ifnxDecayRate?: BigNumber;
  tollRatio?: BigNumber;
  spreadRatio?: BigNumber;
  quoteAssetReserve?: BigNumber;
  baseAssetReserve?: BigNumber;
  startSchedule?: boolean;
  stakingPoolAsFee?: boolean;
}

const quoteTokenDecimals = 6;

const DEFAULT_CONTRACT_DEPLOY_ARGS: ContractDeployArgs = {
  sender: "",
  quoteTokenAmount: toFullDigit(20000000, quoteTokenDecimals),
  ifnxInitSupply: toFullDigit(1000000),
  ifnxRewardVestingPeriod: BigNumber.from(0),
  ifnxInflationRate: toFullDigit(0.01), // 1%
  ifnxMintDuration: BigNumber.from(7 * 24 * 60 * 60), // 1 week
  ifnxDecayRate: BigNumber.from(0),
  tollRatio: BigNumber.from(0),
  spreadRatio: BigNumber.from(0),
  quoteAssetReserve: toFullDigit(1000),
  baseAssetReserve: toFullDigit(100),
  startSchedule: true,
};

export async function fullDeploy(args: ContractDeployArgs): Promise<PerpContracts> {
  const {
    sender,
    quoteTokenAmount = DEFAULT_CONTRACT_DEPLOY_ARGS.quoteTokenAmount,
    ifnxInitSupply = DEFAULT_CONTRACT_DEPLOY_ARGS.ifnxInitSupply,
    ifnxRewardVestingPeriod = DEFAULT_CONTRACT_DEPLOY_ARGS.ifnxRewardVestingPeriod,
    ifnxInflationRate = DEFAULT_CONTRACT_DEPLOY_ARGS.ifnxInflationRate,
    ifnxDecayRate = DEFAULT_CONTRACT_DEPLOY_ARGS.ifnxDecayRate,
    ifnxMintDuration = DEFAULT_CONTRACT_DEPLOY_ARGS.ifnxMintDuration,
    tollRatio = DEFAULT_CONTRACT_DEPLOY_ARGS.tollRatio,
    spreadRatio = DEFAULT_CONTRACT_DEPLOY_ARGS.spreadRatio,
    quoteAssetReserve = DEFAULT_CONTRACT_DEPLOY_ARGS.quoteAssetReserve,
    baseAssetReserve = DEFAULT_CONTRACT_DEPLOY_ARGS.baseAssetReserve,
    startSchedule = DEFAULT_CONTRACT_DEPLOY_ARGS.startSchedule,
  } = args;

  const metaTxGateway = await deployMetaTxGateway("Ifnx", "1", 1234); // default hardhat evm chain ID
  const quoteToken = await deployErc20Fake(
    quoteTokenAmount,
    "Tether",
    "USDT",
    BigNumber.from(quoteTokenDecimals)
  );
  const priceFeed = await deployAPI3MockPriceFeed(toFullDigit(100));

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ifnxToken = await deployIfnxToken(ifnxInitSupply!);
  const minter = await deployMinter(ifnxToken.address);
  const inflationMonitor = await deployInflationMonitor(minter.address);
  const exchangeWrapper = await deployMockExchangeWrapper();
  const supplySchedule = await deploySupplySchedule(
    minter.address,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ifnxInflationRate!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ifnxDecayRate!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ifnxMintDuration!
  );

  const insuranceFund = await deployInsuranceFund(exchangeWrapper.address, minter.address);

  const clearingHouse = await deployClearingHouse(
    toDecimal(0.05),
    toDecimal(0.05),
    toDecimal(0.05),
    insuranceFund.address,
    metaTxGateway.address
  );
  await metaTxGateway.addToWhitelists(clearingHouse.address);
  const clearingHouseViewer = await deployClearingHouseViewer(clearingHouse.address);

  const stakingReserve = await deployStakingReserve(
    ifnxToken.address,
    supplySchedule.address,
    clearingHouse.address,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ifnxRewardVestingPeriod!
  );

  const ambBridge = await deployMockAMBBridge();
  const tokenMediator = await deployMockMultiToken();
  const clientBridge = await deployClientBridge(
    ambBridge.address,
    tokenMediator.address,
    metaTxGateway.address
  );

  await clearingHouse.setTollPool(stakingReserve.address);

  const rewardsDistribution = await deployRewardsDistribution(
    minter.address,
    stakingReserve.address
  );

  // deploy an amm with Q100/B1000 liquidity
  const amm = await deployAmm({
    deployer: sender,
    quoteAssetTokenAddr: quoteToken.address,
    priceFeedAddr: priceFeed.address,
    fundingPeriod: BigNumber.from(86400), // to make calculation easier we set fundingPeriod = 1 day
    fluctuation: toFullDigit(0),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    quoteAssetReserve: quoteAssetReserve!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baseAssetReserve: baseAssetReserve!,
    tollRatio,
    spreadRatio,
  });

  const ammReader = await deployAmmReader();

  await amm.setGlobalShutdown(insuranceFund.address);
  await amm.setCounterParty(clearingHouse.address);
  await insuranceFund.addAmm(amm.address);
  await stakingReserve.setRewardsDistribution(rewardsDistribution.address);
  await insuranceFund.setBeneficiary(clearingHouse.address);
  await insuranceFund.setInflationMonitor(inflationMonitor.address);
  await ifnxToken.addMinter(minter.address);
  await minter.setSupplySchedule(supplySchedule.address);
  await minter.setRewardsDistribution(rewardsDistribution.address);
  await minter.setInflationMonitor(inflationMonitor.address);
  await minter.setInsuranceFund(insuranceFund.address);

  if (startSchedule) {
    await supplySchedule.startSchedule();
  }
  await amm.setOpen(true);

  return {
    metaTxGateway,
    quoteToken,
    priceFeed,
    ifnxToken,
    supplySchedule,
    stakingReserve,
    exchangeWrapper,
    insuranceFund,
    clearingHouse,
    rewardsDistribution,
    amm,
    ammReader,
    clearingHouseViewer,
    inflationMonitor,
    minter,
    clientBridge,
  };
}
