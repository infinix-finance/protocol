import { ethers } from "hardhat";
import { AmmMock, IfnxTokenMock } from "../../types";

export async function deployAmmMock(): Promise<AmmMock> {
  const AmmMockFactory = await ethers.getContractFactory("AmmMock");
  return (await AmmMockFactory.deploy()) as AmmMock;
}

export async function deployIfnxTokenMock(): Promise<IfnxTokenMock> {
  const IfnxTokenMockFactory = await ethers.getContractFactory("IfnxTokenMock");
    return (await IfnxTokenMockFactory.deploy()) as IfnxTokenMock;
}
