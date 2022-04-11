import { BigNumber, FixedNumber} from "@ethersproject/bignumber"
import {loadFixture, deployContract} from 'ethereum-waffle';
import { expect, use } from "chai"
import { ethers, waffle } from "hardhat"
import { parseEther, parseUnits } from "ethers/lib/utils"
import { MockAmm, MockERC20, MockPriceFeed } from "../../types"
import { toFullDigit, toFullDigitStr } from "../helper/number"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AmmFixture, createAmmFixture } from "./fixtures"


describe("Amm Unit Test", () => {
    const [admin, alice] = waffle.provider.getWallets()
    const ETH_PRICE = parseUnits("1000", 18)

    let fixture: AmmFixture
    let amm: MockAmm
    let priceFeed: MockPriceFeed
    let quoteToken: MockERC20
    let fundingPeriod
    let fundingBufferPeriod

    async function moveToNextBlocks(number: number = 1): Promise<void> {
        const blockNumber = await amm.mock_getCurrentBlockNumber()
        await amm.mock_setBlockNumber(blockNumber.add(number))
    }

    async function forward(seconds: number): Promise<void> {
        const timestamp = await amm.mock_getCurrentTimestamp()
        await amm.mock_setBlockTimestamp(timestamp.add(seconds))
        const movedBlocks = seconds / 15 < 1 ? 1 : seconds / 15
        await moveToNextBlocks(movedBlocks)
    }
    enum Dir {
            ADD_TO_AMM = 0,
            REMOVE_FROM_AMM = 1,
        }

    beforeEach(async () => {

        fixture = await loadFixture(createAmmFixture(
            BigNumber.from(20000000),
            ETH_PRICE,
            admin.address,
            BigNumber.from(0),
            fundingPeriod = BigNumber.from(3600)
        ))
        amm = fixture.amm
        priceFeed = fixture.oracle
        quoteToken = fixture.quoteToken

        await amm.setCounterParty(admin.address)

        fundingPeriod = await amm.fundingPeriod()
        fundingBufferPeriod = await amm.fundingBufferPeriod()
        
    })

    describe("default value", () => {
        it("updated after amm added", async () => {
            const liquidityChangedSnapshot = await amm.getLiquidityChangedSnapshots(0)
            expect(liquidityChangedSnapshot.quoteAssetReserve.toString()).eq(parseEther("1000").toString())
            expect(liquidityChangedSnapshot.baseAssetReserve.toString()).eq(parseEther("100").toString())
            expect(liquidityChangedSnapshot.cumulativeNotional.toString()).eq("0")
        })
    })
    describe("setOpen", () => {
        it("admin open amm", async () => {
            await amm.setOpen(true)
            expect(await amm.open()).is.true
        })

        it("init nextFundingTime is 0", async () => {
            expect(await amm.nextFundingTime()).eq(0)
        })

        it("admin open amm will update nextFundingTime", async () => {
            // given now: October 5, 2015 12:20:00 AM
            const now = await amm.mock_getCurrentTimestamp()
            expect(now).eq(1444004400)

            // when amm open
            await amm.setOpen(true)

            // then nextFundingTime should be: October 5, 2015 1:00:00 AM
            expect(await amm.nextFundingTime()).eq(1444006800)
        })

        it("admin close amm", async () => {
            await amm.setOpen(true)
            await amm.setOpen(false)
            expect(await amm.open()).is.false
        })

        it("can't do almost everything when it's beginning", async () => {
            const error = 'amm was closed'
            await expect(amm.connect(admin).settleFunding()).to.be.revertedWith(error)
            await expect(amm.swapInput(Dir.ADD_TO_AMM, {d: BigNumber.from(600)}, {d: BigNumber.from(0)}, false)).to.be.revertedWith(error)
            await expect(amm.swapOutput(Dir.ADD_TO_AMM, {d: BigNumber.from(600)}, {d: BigNumber.from(0)})).to.be.revertedWith(error)
        })

        it("can't do almost everything when it's closed", async () => {
            await amm.setOpen(true)
            await amm.setOpen(false)
            const error = "amm was closed"
            await expect(amm.connect(admin).settleFunding()).revertedWith(error)
            await expect(amm.swapInput(Dir.ADD_TO_AMM, {d: 600}, {d: 0}, false)).to.be.revertedWith(error)
            await expect(amm.swapOutput(Dir.ADD_TO_AMM, {d: 600}, {d: 0})).to.be.revertedWith(error)
        })

        it("force error: stranger close amm", async () => {
            await expect(amm.connect(alice).setOpen(false)).to.be.revertedWith("PerpFiOwnableUpgrade: caller is not the owner")
        })
    })

    describe("calculate fee/spread", () => {
        it("calcFee", async () => {
            // tx fee is 1%, spread is 1%
            await amm.setTollRatio({d: parseEther("0.01")})
            await amm.setSpreadRatio({d: parseEther("0.01")})
            const fee = await amm.calcFee({d: parseEther("10")})
            //[0] is tx fee, [1] is spread
            expect(fee[0].toString()).to.eq(toFullDigit(0.1).toString())
            expect(fee[1].toString()).to.eq(toFullDigit(0.1).toString())
        })

        it("set different fee ratio", async () => {
            // tx fee is 10%, spread is 5%
            await amm.setTollRatio({d: parseEther("0.1")})
            await amm.setSpreadRatio({d: parseEther("0.05")})

            const fee = await amm.calcFee({d: parseEther("100")})
            expect(fee[0].toString()).to.eq(toFullDigit(10).toString())
            expect(fee[1].toString()).to.eq(toFullDigit(5).toString())
        })

        it("set fee ratio to zero", async () => {
            // tx fee is 0%, spread is 5%
            await amm.setTollRatio({d: 0})
            await amm.setSpreadRatio({d: parseEther("0.05")})

            const fee = await amm.calcFee({d: parseEther("100")})
            expect(fee[0].toString()).to.eq(toFullDigit(0).toString())
            expect(fee[1].toString()).to.eq(toFullDigit(5).toString())
        })

        it("calcFee with input `0` ", async () => {
            const fee = await amm.calcFee({d: 0})

            expect(fee[0].toString()).to.eq(toFullDigit(0).toString())
            expect(fee[1].toString()).to.eq(toFullDigit(0).toString())
        })

        it("force error, only owner can set fee/spread ratio", async () => {
            const error = "PerpFiOwnableUpgrade: caller is not the owner"
            await expect(amm.connect(alice).setTollRatio({d: parseEther("0.2")})).to.be.revertedWith(error)
            await expect(amm.connect(alice).setSpreadRatio({d: parseEther("0.2")})).to.be.revertedWith(error)
        })
    })

    describe("getInputPrice/getOutputPrice", () => {
        beforeEach(async () => {
            await amm.setOpen(true)
        })
        it("getInputPrice, add to amm ", async () => {
            // amount = 100(quote asset reserved) - (100 * 1000) / (1000 + 50) = 4.7619...
            // price = 50 / 4.7619 = 10.499
            const amount = await amm.getInputPrice(Dir.ADD_TO_AMM, {d: parseEther("50")})
            // const amount = await amm.getReserve()
            //console.log(amount)
            expect(amount.toString()).to.eq("4761904761904761904")
        })

        it("getInputPrice, remove from amm ", async () => {
            // amount = (100 * 1000) / (1000 - 50) - 100(quote asset reserved) = 5.2631578947368
            // price = 50 / 5.263 = 9.5
            const amount = await amm.getInputPrice(Dir.REMOVE_FROM_AMM, {d: parseEther("50")})
            expect(amount.toString()).to.eq("5263157894736842106")
        })

        it("getOutputPrice, add to amm ", async () => {
            // amount = 1000(base asset reversed) - (100 * 1000) / (100 + 5) = 47.619047619047619048
            // price = 47.619 / 5 = 9.52
            const amount = await amm.getOutputPrice(Dir.ADD_TO_AMM, {d: parseEther("5")})
            expect(amount.toString()).to.eq("47619047619047619047")
        })

        it("getOutputPrice, add to amm with dividable output", async () => {
            // a dividable number should not plus 1 at mantissa
            const amount = await amm.getOutputPrice(Dir.ADD_TO_AMM, {d: parseEther("25")})
            expect(amount.toString()).to.eq(toFullDigit(200).toString())
        })

        it("getOutputPrice, remove from amm ", async () => {
            // amount = (100 * 1000) / (100 - 5) - 1000(base asset reversed) = 52.631578947368
            // price = 52.631 / 5 = 10.52
            const amount = await amm.getOutputPrice(Dir.REMOVE_FROM_AMM, {d: parseEther("5")})
            expect(amount.toString()).to.eq("52631578947368421053")
        })

        it("getOutputPrice, remove from amm  with dividable output", async () => {
            const amount = await amm.getOutputPrice(Dir.REMOVE_FROM_AMM, {d: parseEther("37.5")})
            expect(amount.toString()).to.eq(toFullDigit(600).toString())
        })
    })
    describe("swap", () => {
        beforeEach(async () => {
            await amm.setOpen(true)
        })
        it("swapInput, Long ", async () => {
            // quote asset = (1000 * 100 / (1000 + 600 ))) - 100 = - 37.5
            const reciept = await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("600")}, {d: 0}, false)
            await expect(reciept)
            .to.emit(amm, "SwapInput").withArgs(
                Dir.ADD_TO_AMM,
                toFullDigit(600),
                toFullDigit(37.5)
            );

            expect(reciept)
            .to.emit(amm, "ReserveSnapshotted").withArgs(
                toFullDigit(1600),
                toFullDigit(62.5),
                await amm.mock_getCurrentTimestamp()
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1600).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(62.5).toString())
        })

        it("swapInput, short ", async () => {
            // quote asset = (1000 * 100 / (1000 - 600)) - 100 = 150
            const receipt = await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("600")}, {d: 0}, false)
            expect(receipt).to.emit( amm, "SwapInput").withArgs(
                Dir.REMOVE_FROM_AMM,
                toFullDigit(600),
                toFullDigit(150),
            )
            expect(receipt).to.emit(amm, "ReserveSnapshotted").withArgs(
                toFullDigit(400),
                toFullDigit(250),
                await amm.mock_getCurrentTimestamp()
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(400).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(250).toString())
        })

        it("swapOutput, short", async () => {
            // base asset = 1000 - (1000 * 100 / (100 + 150)) = 600
            const receipt = await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("150")}, {d: 0},)
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.ADD_TO_AMM,
                toFullDigit(600),
                toFullDigit(150),
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(400).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(250).toString())
        })

        it("swapOutput, long", async () => {
            // base asset = (1000 * 100 / (100 - 50)) - 1000 = 1000
            const receipt = await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("50")}, {d: 0},)
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.REMOVE_FROM_AMM,
                toFullDigit(1000),
                toFullDigit(50)
            )

            // baseAssetReserve = 1000 * 100 / (1000 + 800) = 55.555...
            expect((await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(2000).toString())
            expect((await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(50).toString())
        })

        it("swapInput, short and then long", async () => {
            // quote asset = (1000 * 100 / (1000 - 480) - 100 = 92.30769230769...
            const response = await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("480")}, {d: 0}, false)
            expect(response).to.emit(amm, "SwapInput").withArgs(
                Dir.REMOVE_FROM_AMM,
                toFullDigit(480),
                "92307692307692307693",
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(520).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq("192307692307692307693")

            // quote asset = 192.307 - (1000 * 100 / (520 + 960)) = 30.555...
            const response2 = await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("960")}, {d: 0}, false)
            expect(response2).to.emit(amm, "SwapInput").withArgs(
                Dir.ADD_TO_AMM,
                toFullDigit(960),
                "124740124740124740125",
            )

            // pTokenAfter = 250 - 3000/16 = 1000 / 16
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1480).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq("67567567567567567568")
        })

        it("swapInput, short, long and long", async () => {
            await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("200")}, {d: 0}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(800).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(125).toString())

            // swapped base asset = 13.88...8
            // base reserved = 125 - 13.88...8 = 111.11...2
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("100")}, {d: 0}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(900).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq("111111111111111111112")

            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("200")}, {d: 0}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1100).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq("90909090909090909092")
        })

        it("swapInput, short, long and short", async () => {
            await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("200")}, {d: parseEther("25")}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(800).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(125).toString())

            // swapped base asset = 13.88...8
            // base reserved = 125 - 13.88...8 = 111.11...2
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("450")}, {d: parseEther("45")}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1250).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(80).toString())

            await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("250")}, {d: parseEther("20")}, false)
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1000).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(100).toString())
        })

        it("swapOutput, short and not dividable", async () => {
            const amount = await amm.getOutputPrice(Dir.ADD_TO_AMM, {d: parseEther("5")})
            const receipt = await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("5")}, {d: 0})
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.ADD_TO_AMM,
                amount.d,
                toFullDigit(5),
            )
        })

        it("swapOutput, long and not dividable", async () => {
            const amount = await amm.getOutputPrice(Dir.REMOVE_FROM_AMM, {d: parseEther("5")})
            const receipt = await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("5")}, {d: 0})
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.REMOVE_FROM_AMM,
                amount.d,
                toFullDigit(5),
            )
        })

        it("swapOutput, long and then short the same size, should got different base asset amount", async () => {
            // quote asset = (1000 * 100 / (100 - 10)) - 1000 = 111.111...2
            const amount1 = await amm.getOutputPrice(Dir.REMOVE_FROM_AMM, {d: parseEther("10")})
            await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("10")}, {d: 0})
            expect(await (await amm.quoteAssetReserve()).toString()).to.eq("1111111111111111111112")
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(90).toString())

            // quote asset = 1111.111 - (111.111 * 90 / (90 + 10)) = 111.11...1
            // price will be 1 wei less after traded
            const amount2 = await amm.getOutputPrice(Dir.ADD_TO_AMM, {d: parseEther("10")})
            expect(amount1.d.sub(amount2.d)).eq(1)
        })

        it("force error, swapInput, long but less than min base amount", async () => {
            // long 600 should get 37.5 base asset, and reserves will be 1600:62.5
            // but someone front run it, long 200 before the order 600/37.5
            await amm.mockSetReserve({d: parseEther("1250")}, {d: parseEther("80")})
            await expect(amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("600")}, {d: parseEther("37.5")}, false)).to.be.revertedWith("Less than minimal base token")
                
        })

        it("force error, swapInput, short but more than min base amount", async () => {
            // short 600 should get -150 base asset, and reserves will be 400:250
            // but someone front run it, short 200 before the order 600/-150
            await amm.mockSetReserve({d: parseEther("800")}, {d: parseEther("125")})
            await expect(amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("600")}, {d: parseEther("150")}, false)).to.be.revertedWith("More than maximal base token")

        })  
    })
    describe("swapOutput & forceSwapOutput, slippage limits of swaps", () => {
        beforeEach(async () => {
            await amm.setOpen(true)
        })

        // 1250 - 1250 * 80 / (80 + 20) = 1250 - 1000 = 250
        it("swapOutput, short", async () => {
            await amm.mockSetReserve({d: parseEther("1250")}, {d: parseEther("80")})
            const receipt = await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("20")}, {d: parseEther("100")})

            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.ADD_TO_AMM,
                toFullDigit(250),
                toFullDigit(20),
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1000).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(100).toString())
        })

        it("swapOutput, short, (amount should pay = 250) at the limit of min quote amount = 249", async () => {
            await amm.mockSetReserve({d: parseEther("1250")}, {d: parseEther("80")})
            const receipt = await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("20")}, {d: parseEther("249")})

            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.ADD_TO_AMM,
                toFullDigit(250),
                toFullDigit(20),
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1000).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(100).toString())
        })

        it("force error, swapOutput, short, less than min quote amount = 251", async () => {
            await amm.mockSetReserve({d: parseEther("1250")}, {d: parseEther("80")})
            await expect(amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("20")}, {d: parseEther("251")})).to.be.revertedWith(
                "Less than minimal quote token"
            )
        })

        it("force error, swapOutput, short, far less than min quote amount = 400", async () => {
            await amm.mockSetReserve({d: parseEther("1250")}, {d: parseEther("80")})
            await expect(
                amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("20")}, {d: parseEther("400")})).to.be.revertedWith(
                "Less than minimal quote token"
            )
        })

        // 800 * 125 / (125 - 25) - 800 = 1000 - 800 = 200
        it("swapOutput, long", async () => {
            await amm.mockSetReserve({d: parseEther("800")}, {d: parseEther("125")})

            const receipt = await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: parseEther("400")})
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.REMOVE_FROM_AMM,
                toFullDigit(200),
                toFullDigit(25)
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1000).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(100).toString())
        })

        it("swapOutput, long, (amount should pay = 200) at the limit of max quote amount = 201", async () => {
            await amm.mockSetReserve({d: parseEther("800")}, {d: parseEther("125")})

            const receipt = await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: parseEther("201")})
            expect(receipt).to.emit(amm, "SwapOutput").withArgs(
                Dir.REMOVE_FROM_AMM,
                toFullDigit(200),
                toFullDigit(25),
            )

            expect(await (await amm.quoteAssetReserve()).toString()).to.eq(toFullDigit(1000).toString())
            expect(await (await amm.baseAssetReserve()).toString()).to.eq(toFullDigit(100).toString())
        })

        it("force error, swapOutput, long, more than max quote amount = 199", async () => {
            // base asset =
            await amm.mockSetReserve({d: parseEther("800")}, {d: parseEther("125")})
            await expect(
                amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: parseEther("199")})).to.be.revertedWith(
                "More than maximal quote token"
            )
        })

        it("force error, swapOutput, long, far less more max quote amount = 100", async () => {
            // base asset = (1000 * 100 / (100 - 50)) - 1000 = 1000
            await amm.mockSetReserve({d: parseEther("800")}, {d: parseEther("125")})
            await expect(
                amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: parseEther("100")})).to.be.revertedWith(
                "More than maximal quote token"
            )
        })
    })
    describe("restrict price fluctuation", () => {
        beforeEach(async () => {
            await amm.setFluctuationLimitRatio({d: parseEther("0.05")})
            await amm.setOpen(true)
            await moveToNextBlocks()
        })
        it("swapInput, price goes up within the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 24, reserve will be 1024 : 97.66, price is 1024 / 97.66 = 10.49
            const receipt = await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("24")}, {d: 0}, false)
            expect(receipt).to.emit(amm, "SwapInput")
        })

        it("swapInput, price goes down within the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 25, reserve will be 975 : 102.56, price is 975 / 102.56 = 9.51
            const receipt = await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: 0}, false)
            expect(receipt).to.emit(amm, "SwapInput")
        })

        it("swapInput, price goes down, up and then down within the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 25, reserve will be 975 : 102.56, price is 975 / 102.56 = 9.51
            await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("25")}, {d: 0}, false)

            // BUY 49, reserve will be 1024 : 97.66, price is 1024 / 97.66 = 10.49
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("49")}, {d: 0}, false)

            // SELL 49, reserve will be 975 : 102.56, price is 975 / 102.56 = 9.51
            const receipt = await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("49")}, {d: 0}, false)
            expect(receipt).to.emit(amm, "SwapInput")
        })

        it("swapInput, price can go up and over the fluctuation limit once", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 25, reserve will be 1025 : 97.56, price is 1025 / 97.56 = 10.50625
            // but _canOverFluctuationLimit is true so it's ok to skip the check
            const receipt = await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("25")}, {d: 0}, true)
            expect(receipt).to.emit(amm, "SwapInput")
        })

        it("swapOutput, price goes up within the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 2.4 base, reserve will be 1024.6 : 97.6, price is 1024.6 / 97.6 = 10.5
            const receipt = await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("2.4")}, {d: 0})
            expect(receipt).to.emit(amm, "SwapOutput")
        })

        it("swapOutput, price goes down within the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 2.5 base, reserve will be 975.6 : 102.5, price is 975.6 / 102.5 = 9.52
            const receipt = await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("2.5")}, {d: 0})
            expect(receipt).to.emit(amm, "SwapOutput")
        })

        it("force error, swapInput, price goes up but cannot over the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 25, reserve will be 1025 : 97.56, price is 1025 / 97.56 = 10.51
            await expect(
                amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("25")}, {d: 0}, false)).to.be.revertedWith(
                "price is over fluctuation limit"
            )
        })

        it("force error, swapInput, price goes down but cannot over the fluctuation limit", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 26, reserve will be 974 : 102.67, price is 974 / 102.67 = 9.49
            await expect(
                amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("26")}, {d: 0}, false)).to.be.revertedWith(
                "price is over fluctuation limit"
            )
        })

        it("force error, swapInput long can exceed the fluctuation limit once, but the rest will fail during that block", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 25, reserve will be 1025 : 97.56, price is 1025 / 97.56 = 10.50625
            // _canOverFluctuationLimit is true so it's ok to skip the check the first time, while the rest cannot
            const receipt = await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("25")}, {d: 0}, true)
            expect(receipt).to.emit(amm, "SwapInput")
            await expect(
                amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("1")}, {d: 0}, true)).to.be.revertedWith(
                "price is already over fluctuation limit"
            )
        })

        it("force error, swapInput short can exceed the fluctuation limit once, but the rest will fail during that block", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 30, reserve will be 970 : 103.09, price is 975 / 102.56 = 9.40
            // _canOverFluctuationLimit is true so it's ok to skip the check the first time, while the rest cannot
            const receipt = await amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("30")}, {d: 0}, true)
            expect(receipt).to.emit(amm, "SwapInput")
            await expect(
                amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("1")}, {d: 0}, true)).to.be.revertedWith(
                "price is already over fluctuation limit"
            )
        })

        it("force error, swapOutput(close long) can exceed the fluctuation limit once, but the rest txs in that block will fail", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 2.5 base, reserve will be 1025.6 : 97.5, price is 1025.6 / 97.5 = 10.52
            expect(await amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("2.5")}, {d: 0})).to.emit(amm, "SwapOutput")
            await expect(
                amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("0.1")}, {d: 0})).to.be.revertedWith(
                "price is already over fluctuation limit"
            )
        })

        it("force error, swapOutput(close short) can only exceed fluctuation limit once, but the rest txs in that block will fail", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 3 base, reserve will be 970.873 : 103, price is 970.873 / 103 = 9.425
            expect(await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("3")}, {d: 0})).to.emit(amm, "SwapOutput")

            // SELL 3 base again, reserve will be 943.396 : 106, price is 970.873 / 106 = 8.899
            await expect(
                amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("3")}, {d: 0})).to.be.revertedWith(
                "price is already over fluctuation limit"
            )
        })

        it("force error, swapOutput(close short) can only exceed fluctuation limit once, but the rest txs in that block will fail, including the price comes inside the range", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // SELL 3 base, reserve will be 970.873 : 103, price is 970.873 / 103 = 9.425
            expect(await amm.swapOutput(Dir.ADD_TO_AMM, {d: parseEther("3")}, {d: 0})).to.emit(amm, "SwapOutput")

            // BUY 5 base again, reserve will be 1020.4081632653 : 98, price is 10.4123281966
            await expect(
                amm.swapOutput(Dir.REMOVE_FROM_AMM, {d: parseEther("5")}, {d: 0})).to.be.revertedWith(
                "price is already over fluctuation limit"
            )
        })

        it("force error, swap many times and the price is over the fluctuation limit in a single block", async () => {
            // fluctuation is 5%, price is between 9.5 ~ 10.5
            // BUY 10+10+10, reserve will be 1030 : 97.09, price is 1030 / 97.09 = 10.61
            await moveToNextBlocks(1)
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)
            await expect(
                amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)).to.be.revertedWith(
                "price is over fluctuation limit"
            )
        })

        it("force error, compare price fluctuation with previous blocks in a block", async () => {
            // BUY 10, reserve will be 1010 : 99.01, price is 1010 / 99.01 = 10.2
            // fluctuation is 5%, price is between 9.69 ~ 10.71
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)
            await moveToNextBlocks(1)

            // SELL 26, reserve will be 984 : 101.63, price is 984 / 101.63 = 9.68
            const error = "price is over fluctuation limit"
            await expect(amm.swapInput(Dir.REMOVE_FROM_AMM, {d: parseEther("26")}, {d: 0}, false)).to.be.revertedWith(error)

            // BUY 30, reserve will be 1040 : 96.15, price is 1040 / 96.15 = 10.82
            await expect(amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("30")}, {d: 0}, false)).to.be.revertedWith(error)
            // should revert as well if BUY 30 separately
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)
            await expect(amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("20")}, {d: 0}, false)).to.be.revertedWith(error)
        })

        it("force error, the value of fluctuation is the same even when no any tradings for blocks", async () => {
            // BUY 10, reserve will be 1010 : 99.01, price is 1010 / 99.01 = 10.2
            // fluctuation is 5%, price is between 9.69 ~ 10.71
            await amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("10")}, {d: 0}, false)
            await moveToNextBlocks(3)

            // BUY 25, reserve will be 1035 : 96.62, price is 1035 / 96.62 = 10.712
            await expect(
                amm.swapInput(Dir.ADD_TO_AMM, {d: parseEther("25")}, {d: 0}, false)).to.be.revertedWith(
                "price is over fluctuation limit"
            )
        })
    })
})
