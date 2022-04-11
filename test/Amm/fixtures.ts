import { MockContract, smockit } from "@eth-optimism/smock"
//import { default as BigNumber, default as BN } from "bn.js"
import { ethers } from "hardhat"
import {BigNumber} from "ethers"
//import { Decimal, toFullDigit } from "../../helper/number"
import {
    MockAmm,
    MockERC20,
    MockPriceFeed,
    Api3Oracle  
} from "../../types"
import { Address } from "hardhat-deploy/types"
import { parseEther } from "ethers/lib/utils"


export interface AmmFixture {
    oracle: MockPriceFeed
    quoteToken: MockERC20
    amm: MockAmm
}
export function createAmmFixture(
    tokenSupply: BigNumber,
    price: BigNumber,
    deployer: Address,
    fluctuation: BigNumber,
    fundingPeriod: BigNumber = BigNumber.from(8 * 60 * 60), // 8hr
    tradeLimitRatio = parseEther("0.9"),
    baseAssetReserve: BigNumber = parseEther("100"),
    quoteAssetReserve: BigNumber = parseEther("1000"),
    //priceFeedKey: String = "0x4554482f55534400000000000000000000000000000000000000000000000000",
    tollRatio: BigNumber = BigNumber.from(0),
    spreadRatio: BigNumber = BigNumber.from(0),
): () => Promise<AmmFixture> {
    return async (): Promise<AmmFixture> => {
        const MockPriceFeedFactory = await ethers.getContractFactory("MockPriceFeed");
        const key = "0x4554482f55534400000000000000000000000000000000000000000000000000"
        const oracle = (await MockPriceFeedFactory.deploy()) as MockPriceFeed
        //const mockOracle = await smockit(oracle)
        //mockOracle.mintUpTo.whenCalledWith(key).returns(Math.log2(price));
        await oracle.setPrice(price)

        //deploy test token
        const MockERC20 = await ethers.getContractFactory("MockERC20")
        const quoteToken = (await MockERC20.deploy()) as MockERC20
        await quoteToken.initializeERC20Mock(tokenSupply, 'Test', 'TEST', 18)

        const AmmFactory = await ethers.getContractFactory("MockAmm")
        const amm = (await AmmFactory.deploy(
            quoteAssetReserve,
            baseAssetReserve,
            tradeLimitRatio,
            fundingPeriod,
            oracle.address,
            //priceFeedKey,
            key,
            quoteToken.address,
            fluctuation,
            tollRatio,
            spreadRatio,
            //{from: deployer}
        )) as MockAmm


        return{oracle, quoteToken, amm}
        
    }
}
