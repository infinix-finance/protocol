import { ethers } from "hardhat";
import { AmmMock } from "../../types";

export async function deployAmmMock(): Promise<AmmMock> {
  const AmmMockFactory = await ethers.getContractFactory("AmmMock");
  return (await AmmMockFactory.deploy()) as AmmMock;
}

// export async function deployChainlinkAggregatorMock(): Promise<ChainlinkAggregatorMockInstance> {
//     return ChainlinkAggregatorMock.new()
// }

// export async function deployChainlinkL1Mock(): Promise<ChainlinkL1MockInstance> {
//     return ChainlinkL1Mock.new()
// }

// export async function deployClearingHouseMock(): Promise<ClearingHouseMockInstance> {
//     return ClearingHouseMock.new()
// }

// export async function deployFeeRewardPoolMock(): Promise<FeeRewardPoolMockInstance> {
//     return FeeRewardPoolMock.new()
// }

// export async function deployPerpTokenMock(): Promise<PerpTokenMockInstance> {
//     return PerpTokenMock.new()
// }

// export async function deployRootBridgeMock(): Promise<RootBridgeMockInstance> {
//     return RootBridgeMock.new()
// }

// export async function deployStakedPerpTokenMock(): Promise<StakedPerpTokenMockInstance> {
//     return StakedPerpTokenMock.new()
// }
