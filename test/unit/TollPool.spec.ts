import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { ERC20Fake, MultiTokenMediatorMock, TollPool } from "../../types";
import {
  deployClientBridge,
  deployErc20Fake,
  deployMockAMBBridge,
  deployMockMultiToken,
  deployTollPool,
} from "../helper/contract";
import { toFullDigit } from "../helper/number";

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("tollPoolSpec", () => {
  let admin: Wallet;
  let alice: Wallet;
  let feeTokenPoolDispatcherMock: Wallet;
  let tokenMediator: MultiTokenMediatorMock;
  let tollPool: TollPool;
  let usdt: ERC20Fake;
  let usdc: ERC20Fake;

  beforeEach(async () => {
    const addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];
    feeTokenPoolDispatcherMock = addresses[2];

    usdt = await deployErc20Fake(toFullDigit(2000000));
    usdc = await deployErc20Fake(toFullDigit(2000000));

    tokenMediator = await deployMockMultiToken();
    const ambBridge = await deployMockAMBBridge();
    const clientBridge = await deployClientBridge(
      ambBridge.address,
      tokenMediator.address,
      admin.address
    );

    tollPool = await deployTollPool(admin.address, clientBridge.address);

    await usdt.approve(tollPool.address, toFullDigit(2000000));
    await usdc.approve(tollPool.address, toFullDigit(2000000));
  });

  describe("transferToFeeTokenPoolDispatcher()", () => {
    it("can't add empty token", async () => {
      await expect(tollPool.addFeeToken(EMPTY_ADDRESS)).to.be.revertedWith("invalid input");
    });

    it("should receive all the balance of one token in the tollPool contract", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.addFeeToken(usdt.address);
      await tollPool.addFeeToken(usdc.address);

      await usdt.transfer(tollPool.address, toFullDigit(1000));
      const receipt = await tollPool.connect(admin).transferToFeeTokenPoolDispatcher();
      expect(receipt).to.emit(tollPool, "TokenTransferred");
      expect(await usdt.balanceOf(tokenMediator.address)).to.eq(toFullDigit(1000));
    });

    it("should receive all the balances of tokens in the tollPool contract", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.addFeeToken(usdt.address);
      await tollPool.addFeeToken(usdc.address);

      await usdt.transfer(tollPool.address, toFullDigit(1000));
      await usdc.transfer(tollPool.address, toFullDigit(2000));

      const receipt = await tollPool.connect(admin).transferToFeeTokenPoolDispatcher();
      expect(receipt)
        .to.emit(tollPool, "TokenTransferred")
        .withArgs(usdt.address, toFullDigit(1000));
      // expectEvent.inTransaction(receipt.tx, tollPool, "TokenTransferred", {
      //     token: usdc.address,
      //     amount: toFullDigit(2000),
      // })
      expect(await usdt.balanceOf(tokenMediator.address)).to.eq(toFullDigit(1000));
      expect(await usdc.balanceOf(tokenMediator.address)).to.eq(toFullDigit(2000));
    });

    it("should receive usdt but not usdc, since the balance of usdc is 0", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.addFeeToken(usdt.address);
      await tollPool.addFeeToken(usdc.address);

      await usdt.transfer(tollPool.address, toFullDigit(1000));
      await tollPool.connect(admin).transferToFeeTokenPoolDispatcher();
      expect(await usdt.balanceOf(tokenMediator.address)).to.eq(toFullDigit(1000));
    });

    it("force error, feeTokenPoolDispatcherL1 not yet set", async () => {
      await expect(tollPool.transferToFeeTokenPoolDispatcher()).to.be.revertedWith(
        "feeTokenPoolDispatcherL1 not yet set"
      );
    });

    it("force error, feeTokens not yet set", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await expect(tollPool.transferToFeeTokenPoolDispatcher()).to.be.revertedWith(
        "feeTokens not set yet"
      );
    });

    it("force error, the amount of all registered token is zero", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.addFeeToken(usdt.address);
      await expect(tollPool.transferToFeeTokenPoolDispatcher()).to.be.revertedWith(
        "fee is now zero"
      );
    });
  });

  describe("setFeeTokenPoolDispatcher()", () => {
    it("feeTokenPoolDispatcher should be set", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      expect(await tollPool.feeTokenPoolDispatcherL1()).to.eq(feeTokenPoolDispatcherMock.address);
    });

    it("feeTokenPoolDispatcher should be updated", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.setFeeTokenPoolDispatcher(alice.address);
      expect(await tollPool.feeTokenPoolDispatcherL1()).to.eq(alice.address);
    });

    it("force error, onlyOwner", async () => {
      await expect(
        tollPool.connect(alice).setFeeTokenPoolDispatcher(EMPTY_ADDRESS)
      ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
    });

    it("force error, input is zero address", async () => {
      await expect(tollPool.setFeeTokenPoolDispatcher(EMPTY_ADDRESS)).to.be.revertedWith(
        "invalid input"
      );
    });

    it("force error, feeTokenPoolDispatcher already existed", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await expect(
        tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address)
      ).to.be.revertedWith("input is the same as the current one");
    });
  });

  describe("addFeeToken()", () => {
    it("feeTokens should be set", async () => {
      await tollPool.addFeeToken(usdt.address);
      await tollPool.addFeeToken(usdc.address);
      expect(await tollPool.feeTokens(0)).to.eq(usdt.address);
      expect(await tollPool.feeTokens(1)).to.eq(usdc.address);
      expect(await tollPool.isFeeTokenExisted(usdt.address)).to.eq(true);
      expect(await tollPool.isFeeTokenExisted(usdc.address)).to.eq(true);
    });

    it("force error, onlyOwner", async () => {
      await expect(tollPool.connect(alice).addFeeToken(usdt.address)).to.be.revertedWith(
        "IfnxFiOwnableUpgrade: caller is not the owner"
      );
    });

    it("force error, token is already existed", async () => {
      await tollPool.addFeeToken(usdt.address);
      await expect(tollPool.addFeeToken(usdt.address)).to.be.revertedWith("invalid input");
    });

    it("force error, input is zero address", async () => {
      await expect(tollPool.addFeeToken(EMPTY_ADDRESS)).to.be.revertedWith("invalid input");
    });
  });

  describe("removeFeeToken()", () => {
    it("feeTokens should be removed", async () => {
      await tollPool.addFeeToken(usdt.address);
      await tollPool.removeFeeToken(usdt.address);
      expect(await tollPool.isFeeTokenExisted(usdt.address)).to.eq(false);
      expect(await tollPool.getFeeTokenLength()).to.eq(0);
    });

    it("feeTokens should be removed and can be added again", async () => {
      await tollPool.addFeeToken(usdt.address);
      await tollPool.addFeeToken(usdc.address);

      await tollPool.removeFeeToken(usdt.address);
      await tollPool.addFeeToken(usdt.address);
      expect(await tollPool.feeTokens(0)).to.eq(usdc.address);
      expect(await tollPool.feeTokens(1)).to.eq(usdt.address);
    });

    it("should transfer to feeTokenPoolDispatcher via clientBridge before removeFeeToken", async () => {
      await tollPool.setFeeTokenPoolDispatcher(feeTokenPoolDispatcherMock.address);
      await tollPool.addFeeToken(usdt.address);
      await usdt.transfer(tollPool.address, 1);

      // TODO expect tollPool call clientBridge.erc20Transfer(feeTokenPoolDispatcher)
      // let's use ethers/waffle when writing new unit test. it's hard to write unit test without mock lib
      await tollPool.removeFeeToken(usdt.address);
      expect(await usdt.balanceOf(tollPool.address)).eq(0);
    });

    it("force error, onlyOwner", async () => {
      await tollPool.addFeeToken(usdt.address);
      await expect(tollPool.connect(alice).removeFeeToken(usdt.address)).to.be.revertedWith(
        "IfnxFiOwnableUpgrade: caller is not the owner"
      );
    });

    it("force error, token does not exist", async () => {
      await expect(tollPool.removeFeeToken(usdt.address)).to.be.revertedWith(
        "token does not exist"
      );
    });

    it("force error, input is zero address", async () => {
      await tollPool.addFeeToken(usdt.address);
      await expect(tollPool.removeFeeToken(EMPTY_ADDRESS)).to.be.revertedWith(
        "token does not exist"
      );
    });
  });
});
