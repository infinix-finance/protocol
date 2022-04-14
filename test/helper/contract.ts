import { BigNumber } from "ethers";
import { artifacts, ethers } from "hardhat";
import {
  AMBBridgeMock,
  AmmFake,
  AmmReader,
  API3PriceFeedMock,
  ClearingHouseFake,
  ClearingHouseViewer,
  ClientBridge,
  ERC20Fake,
  ExchangeWrapper,
  ExchangeWrapperMock,
  IfnxToken,
  InflationMonitorFake,
  InsuranceFundFake,
  MetaTxGateway,
  Minter,
  MultiTokenMediatorMock,
  RewardsDistributionFake,
  StakingReserveFake,
  SupplyScheduleFake,
  TollPool,
} from "../../types";

import { Decimal, toFullDigit } from "./number";

export enum Side {
  BUY = 0,
  SELL = 1,
}

export enum Dir {
  ADD_TO_AMM = 0,
  REMOVE_FROM_AMM = 1,
}

export enum PnlCalcOption {
  SPOT_PRICE = 0,
  TWAP = 1,
}

export interface StakeBalance {
  totalBalance: { d: number | BigNumber | string };
  stakeBalanceForCurrentEpoch: { d: number | BigNumber | string };
  stakeBalanceForNextEpoch: { d: number | BigNumber | string };
}

export interface EpochReward {
  reward: { d: number | BigNumber | string };
  timeWeightedStake: { d: number | BigNumber | string };
}

// typechain can't handle array of struct correctly, it will return every thing as string
// https://github.com/ethereum-ts/TypeChain/issues/139
export interface PositionCost {
  side: string;
  size: { d: number | BigNumber | string };
  baseAssetReserve: { d: number | BigNumber | string };
  quoteAssetReserve: { d: number | BigNumber | string };
}

export interface AmmSettings {
  spreadRatio: { d: number | BigNumber | string };
  tollRatio: { d: number | BigNumber | string };
  tradeLimitRatio: { d: number | BigNumber | string };
}

export interface AmmPrice {
  price: { d: number | BigNumber | string };
  amount: { d: number | BigNumber | string };
  fee: { d: number | BigNumber | string };
  spread: { d: number | BigNumber | string };
}

export async function deployAmm(params: {
  deployer: string;
  quoteAssetTokenAddr: string;
  priceFeedAddr: string;
  fluctuation: BigNumber;
  priceFeedKey?: string;
  fundingPeriod?: BigNumber;
  baseAssetReserve?: BigNumber;
  quoteAssetReserve?: BigNumber;
  tollRatio?: BigNumber;
  spreadRatio?: BigNumber;
}): Promise<AmmFake> {
  const {
    deployer,
    quoteAssetTokenAddr,
    priceFeedAddr,
    fluctuation,
    fundingPeriod = BigNumber.from(8 * 60 * 60), // 8hr
    baseAssetReserve = toFullDigit(100),
    quoteAssetReserve = toFullDigit(1000),
    priceFeedKey = "ETH",
    tollRatio = BigNumber.from(0),
    spreadRatio = BigNumber.from(0),
  } = params;

  const AmmFactory = await ethers.getContractFactory("AmmFake");

  return (await AmmFactory.deploy(
    quoteAssetReserve,
    baseAssetReserve,
    toFullDigit(0.9), // tradeLimitRatio
    fundingPeriod,
    priceFeedAddr,
    ethers.utils.formatBytes32String(priceFeedKey),
    quoteAssetTokenAddr,
    fluctuation,
    tollRatio,
    spreadRatio
    // { from: deployer }
  )) as AmmFake;
}

export async function deployAmmReader(): Promise<AmmReader> {
  const AmmReaderFactory = await ethers.getContractFactory("AmmReader");
  return (await AmmReaderFactory.deploy()) as AmmReader;
}

export async function deployClearingHouse(
  initMarginRatio: Decimal,
  maintenanceMarginRatio: Decimal,
  liquidationFeeRatio: Decimal,
  insuranceFund: string,
  trustedForwarder: string
): Promise<ClearingHouseFake> {
  const ClearingHouseFakeFactory = await ethers.getContractFactory("ClearingHouseFake");
  const instance = (await ClearingHouseFakeFactory.deploy()) as ClearingHouseFake;

  await instance.initialize_Fake(
    initMarginRatio.d.toString(),
    maintenanceMarginRatio.d.toString(),
    liquidationFeeRatio.d.toString(),
    insuranceFund,
    trustedForwarder
  );

  return instance;
}

export async function deployClearingHouseViewer(
  clearingHouse: string
): Promise<ClearingHouseViewer> {
  const ClearingHouseViewerFactory = await ethers.getContractFactory("ClearingHouseViewer");
  return (await ClearingHouseViewerFactory.deploy(clearingHouse)) as ClearingHouseViewer;
}

export async function deployErc20Fake(
  initSupply: BigNumber = BigNumber.from(0),
  name = "name",
  symbol = "symbol",
  decimal: BigNumber = BigNumber.from(18)
): Promise<ERC20Fake> {
  const ERC20FakeFactory = await ethers.getContractFactory("ERC20Fake");
  const instance = (await ERC20FakeFactory.deploy()) as ERC20Fake;
  await instance.initializeERC20Fake(
    BigNumber.from(initSupply),
    name,
    symbol,
    BigNumber.from(decimal)
  );

  return instance;
}

export async function deployIfnxToken(initSupply: BigNumber): Promise<IfnxToken> {
  const IfnxTokenFactory = await ethers.getContractFactory("IfnxToken");
  return (await IfnxTokenFactory.deploy(initSupply)) as IfnxToken;
}

export async function deployAPI3MockPriceFeed(defaultPrice: BigNumber): Promise<API3PriceFeedMock> {
  const API3PriceFeedMockFactory = await ethers.getContractFactory("API3PriceFeedMock");
  return (await API3PriceFeedMockFactory.deploy(defaultPrice)) as API3PriceFeedMock;
}

export async function deployInsuranceFund(
  exchange: string,
  minter: string
): Promise<InsuranceFundFake> {
  const InsuranceFundFakeFactory = await ethers.getContractFactory("InsuranceFundFake");
  const instance = (await InsuranceFundFakeFactory.deploy()) as InsuranceFundFake;
  await instance.initialize();
  await instance.setExchange(exchange);
  await instance.setMinter(minter);
  return instance;
}

// export async function deployExchangeWrapper(
//   balancerPoolAddr: string,
//   compoundCUsdtAddr: string,
//   InfxToken: string
// ): Promise<ExchangeWrapper> {
//   const ExchangeWrapperFactory = await ethers.getContractFactory("ExchangeWrapper");
//   const instance = (await ExchangeWrapperFactory.deploy()) as ExchangeWrapper;
//   await instance.initialize(balancerPoolAddr, compoundCUsdtAddr, InfxToken);
//   return instance;
// }

export async function deployMockExchangeWrapper(): Promise<ExchangeWrapperMock> {
  const ExchangeWrapperMockFactory = await ethers.getContractFactory("ExchangeWrapperMock");
  return (await ExchangeWrapperMockFactory.deploy()) as ExchangeWrapperMock;
}

// export async function deployMockBalancer(
//   InfxAddr: string,
//   cUSDTAddr: string
// ): Promise<BalancerMockInstance> {
//   const instance = await BalancerMock.new();
//   instance.initialize(InfxAddr, cUSDTAddr);
//   return instance;
// }

// export async function deployMockCUsdt(): Promise<CUsdtMockInstance> {
//   const instance = await CUsdtMock.new();
//   await instance.initializeERC20Fake(toFullDigit(100000), "CToken", "CUsdt", 8);
//   return instance;
// }

export async function deployStakingReserve(
  InfxToken: string,
  supplySchedule: string,
  clearingHouse: string,
  vestingPeriod: BigNumber
): Promise<StakingReserveFake> {
  const StakingReserveFakeFactory = await ethers.getContractFactory("StakingReserveFake");
  const instance = (await StakingReserveFakeFactory.deploy()) as StakingReserveFake;
  await instance.initialize(InfxToken, supplySchedule, clearingHouse, vestingPeriod);
  return instance;
}

export async function deployRewardsDistribution(
  minter: string,
  stakingReserve: string
): Promise<RewardsDistributionFake> {
  const RewardsDistributionFakeFactory = await ethers.getContractFactory("RewardsDistributionFake");
  const instance = (await RewardsDistributionFakeFactory.deploy()) as RewardsDistributionFake;
  await instance.initialize(minter, stakingReserve);
  return instance;
}

// export async function deployL2PriceFeed(
//   clientBridge: string,
//   keeper: string
// ): Promise<L2PriceFeedFakeInstance> {
//   const instance = await L2PriceFeedFake.new();
//   await instance.initialize(clientBridge, keeper);
//   return instance;
// }

// export async function deployChainlinkL1(
//   rootBridgeAddress: string,
//   priceFeedL2Address: string
// ): Promise<ChainlinkL1FakeInstance> {
//   const instance = await ChainlinkL1Fake.new();
//   await instance.initialize(rootBridgeAddress, priceFeedL2Address);
//   return instance;
// }

// export async function deployChainlinkPriceFeed(): Promise<ChainlinkPriceFeedFakeInstance> {
//   const instance = await ChainlinkPriceFeedFake.new();
//   await instance.initialize();
//   return instance;
// }

export async function deploySupplySchedule(
  minter: string,
  inflationRate: BigNumber,
  decayRate: BigNumber,
  mintDuration: BigNumber
): Promise<SupplyScheduleFake> {
  const SupplyScheduleFakeFactory = await ethers.getContractFactory("SupplyScheduleFake");
  const instance = (await SupplyScheduleFakeFactory.deploy()) as SupplyScheduleFake;
  await instance.initialize(minter, inflationRate, decayRate, mintDuration);
  return instance;
}

export async function deployInflationMonitor(minter: string): Promise<InflationMonitorFake> {
  const InflationMonitorFakeFactory = await ethers.getContractFactory("InflationMonitorFake");
  const instance = (await InflationMonitorFakeFactory.deploy()) as InflationMonitorFake;
  await instance.initialize(minter);
  return instance;
}

export async function deployMinter(InfxToken: string): Promise<Minter> {
  const MinterFactory = await ethers.getContractFactory("Minter");
  const instance = (await MinterFactory.deploy()) as Minter;
  await instance.initialize(InfxToken);
  return instance;
}

// export async function deployRootBridge(
//   ambBridge: string,
//   tokenMediator: string
// ): Promise<RootBridgeInstance> {
//   const instance = await RootBridge.new();
//   await instance.initialize(ambBridge, tokenMediator);
//   return instance;
// }

export async function deployClientBridge(
  ambBridge: string,
  tokenMediator: string,
  trustedForwarder: string
): Promise<ClientBridge> {
  const ClientBridgeFactory = await ethers.getContractFactory("ClientBridge");
  const instance = (await ClientBridgeFactory.deploy()) as ClientBridge;
  await instance.initialize(ambBridge, tokenMediator, trustedForwarder);
  return instance;
}

export async function deployMockMultiToken(): Promise<MultiTokenMediatorMock> {
  const MultiTokenMediatorMockFactory = await ethers.getContractFactory("MultiTokenMediatorMock");
  return (await MultiTokenMediatorMockFactory.deploy()) as MultiTokenMediatorMock;
}

export async function deployMockAMBBridge(): Promise<AMBBridgeMock> {
  const AMBBridgeMockFactory = await ethers.getContractFactory("AMBBridgeMock");
  return (await AMBBridgeMockFactory.deploy()) as AMBBridgeMock;
}

export async function deployMetaTxGateway(
  name: string,
  version: string,
  chainIdL1: number
): Promise<MetaTxGateway> {
  const MetaTxGatewayFactory = await ethers.getContractFactory("MetaTxGateway");
  const instance = (await MetaTxGatewayFactory.deploy()) as MetaTxGateway;
  instance.initialize(name, version, chainIdL1);
  return instance;
}

// export async function deployL1KeeperReward(InfxToken: string): Promise<KeeperRewardL1Instance> {
//   const instance = await KeeperRewardL1.new();
//   await instance.initialize(InfxToken);
//   return instance;
// }

// export async function deployL2KeeperReward(InfxToken: string): Promise<KeeperRewardL2Instance> {
//   const instance = await KeeperRewardL2.new();
//   await instance.initialize(InfxToken);
//   return instance;
// }

// export async function deployStakedInfxToken(
//   InfxToken: string,
//   cooldownPeriod: BigNumber
// ): Promise<StakedInfxTokenFakeInstance> {
//   const instance = await StakedInfxToken.new();
//   await instance.initialize(InfxToken, cooldownPeriod);
//   return instance;
// }

// export async function deployInfxRewardVesting(
//   InfxToken: string,
//   vestingPeriod: BigNumber = new BigNumber(12 * 7 * 24 * 60 * 60)
// ): Promise<InfxRewardVestingFakeInstance> {
//   const instance = await InfxRewardVesting.new();
//   await instance.initialize(InfxToken, vestingPeriod);
//   return instance;
// }

export async function deployTollPool(
  clearingHouse: string,
  clientBridge: string
): Promise<TollPool> {
  const TollPoolFactory = await ethers.getContractFactory("TollPool");
  const instance = (await TollPoolFactory.deploy()) as TollPool;
  await instance.initialize(clearingHouse, clientBridge);
  return instance;
}

// export async function deployFeeTokenPoolDispatcherL1(): Promise<FeeTokenPoolDispatcherL1Instance> {
//   const instance = await FeeTokenPoolDispatcherL1.new();
//   await instance.initialize();
//   return instance;
// }

// export async function deployFeeRewardPoolL1(
//   erc20: string,
//   stakedInfxToken: string,
//   feeTokenPoolDispatcherL1: string
// ): Promise<FeeRewardPoolL1FakeInstance> {
//   const instance = await FeeRewardPoolL1.new();
//   await instance.initialize(erc20, stakedInfxToken, feeTokenPoolDispatcherL1);
//   return instance;
// }
