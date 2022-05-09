import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { MetaTxGateway, MetaTxRecipientMock } from "../../types";
import { deployMetaTxGateway } from "../helper/contract";
import { EIP712Domain, signEIP712MetaTx } from "../helper/web3";

describe("MetaTxGateway Unit Test", () => {
  let domain: EIP712Domain;

  let admin: Wallet;
  let alice: Wallet;
  let relayer: Wallet;

  let l1ChainId: number;

  let metaTxGateway: MetaTxGateway;
  let metaTxRecipientMock: MetaTxRecipientMock;

  beforeEach(async () => {
    const accounts = await waffle.provider.getWallets();
    admin = accounts[0];
    alice = accounts[1];
    relayer = accounts[2];

    l1ChainId = 1234;

    metaTxGateway = await deployMetaTxGateway("Test", "1", l1ChainId);
    const MetaTxRecipientMockFactory = await ethers.getContractFactory("MetaTxRecipientMock");
    metaTxRecipientMock = (await MetaTxRecipientMockFactory.deploy(
      metaTxGateway.address
    )) as MetaTxRecipientMock;

    await metaTxGateway.addToWhitelists(metaTxRecipientMock.address);

    domain = {
      name: "Test",
      version: "1",
      chainId: l1ChainId,
      verifyingContract: metaTxGateway.address,
    };
  });

  it("processMetaTxSignedL1", async () => {
    expect(await metaTxRecipientMock.pokedBy()).to.eq("0x0000000000000000000000000000000000000000");

    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(alice.address, domain, metaTx);

    await metaTxGateway
      .connect(relayer)
      .executeMetaTransaction(
        metaTx.from,
        metaTx.to,
        metaTx.functionSignature,
        signedResponse.r,
        signedResponse.s,
        signedResponse.v
      );

    expect(await metaTxRecipientMock.pokedBy()).to.eq(alice.address);
  });

  it("processMetaTxSignedL2", async () => {
    expect(await metaTxRecipientMock.pokedBy()).to.eq("0x0000000000000000000000000000000000000000");

    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(
      alice.address,
      {
        ...domain,
        chainId: 31337, // default hardhat evm chain ID
      },
      metaTx
    );

    await metaTxGateway
      .connect(relayer)
      .executeMetaTransaction(
        metaTx.from,
        metaTx.to,
        metaTx.functionSignature,
        signedResponse.r,
        signedResponse.s,
        signedResponse.v
      );

    expect(await metaTxRecipientMock.pokedBy()).to.eq(alice.address);
  });

  it("rejectMetaTxNotWhitelisted", async () => {
    const metaTx = {
      from: alice.address,
      to: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", // arbitrary address not in whitelist
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(alice.address, domain, metaTx);

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("!whitelisted");
  });

  it("rejectNonOwnerWhitelisting", async () => {
    await expect(
      metaTxGateway.connect(alice).addToWhitelists("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef")
    ).to.be.revertedWith("IfnxFiOwnableUpgrade: caller is not the owner");
  });

  it("rejectMetaTxWrongDomain", async () => {
    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(
      alice.address,
      {
        ...domain,
        version: "2", // wrong domain version
      },
      metaTx
    );

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("Signer and signature do not match");
  });

  it("rejectMetaTxNonceTooHigh", async () => {
    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: 1, // nonce should be 0 instead of 1
    };
    const signedResponse = await signEIP712MetaTx(alice.address, domain, metaTx);

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("Signer and signature do not match");
  });

  it("rejectMetaTxNonceTooLow", async () => {
    // make a successful meta tx first
    const metaTx1 = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse1 = await signEIP712MetaTx(alice.address, domain, metaTx1);
    await metaTxGateway
      .connect(relayer)
      .executeMetaTransaction(
        metaTx1.from,
        metaTx1.to,
        metaTx1.functionSignature,
        signedResponse1.r,
        signedResponse1.s,
        signedResponse1.v
      );
    expect(await metaTxGateway.getNonce(alice.address)).to.eq(ethers.BigNumber.from(1));

    // make the second meta tx
    const metaTx2 = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: 0, // nonce should be 1 instead of 0
    };
    const signedResponse2 = await signEIP712MetaTx(alice.address, domain, metaTx2);
    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx2.from,
          metaTx2.to,
          metaTx2.functionSignature,
          signedResponse2.r,
          signedResponse2.s,
          signedResponse2.v
        )
    ).to.be.revertedWith("Signer and signature do not match");
  });

  it("rejectMetaTxSignedByOthers", async () => {
    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(
      relayer.address, // sign the meta tx with other account
      {
        name: "Test",
        version: "1",
        chainId: l1ChainId,
        verifyingContract: metaTxGateway.address,
      },
      metaTx
    );

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("Signer and signature do not match");
  });

  it("rejectMetaTxZeroAddressAttack", async () => {
    const metaTx = {
      from: "0x0000000000000000000000000000000000000000",
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: 0,
    };
    const invalidSignature =
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefde";
    const signedResponse = {
      invalidSignature,
      r: "0x" + invalidSignature.substring(0, 64),
      s: "0x" + invalidSignature.substring(64, 128),
      v: parseInt(invalidSignature.substring(128, 130), 16),
    };

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("invalid signature");
  });

  it("rejectMetaTxWithSpecificErrorMessage", async () => {
    await expect(metaTxRecipientMock.error()).to.be.revertedWith("MetaTxRecipientMock: Error");

    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("error()"),
      nonce: +(await metaTxGateway.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(
      alice.address,
      {
        ...domain,
        chainId: 31337, // default hardhat evm chain ID
      },
      metaTx
    );

    await expect(
      metaTxGateway
        .connect(relayer)
        .executeMetaTransaction(
          metaTx.from,
          metaTx.to,
          metaTx.functionSignature,
          signedResponse.r,
          signedResponse.s,
          signedResponse.v
        )
    ).to.be.revertedWith("MetaTxRecipientMock: Error");
  });

  it("fallbackMsgSenderIfNonTrustedForwarder", async () => {
    expect(await metaTxRecipientMock.pokedBy()).to.eq("0x0000000000000000000000000000000000000000");

    // create another forwarder which is not trusted by metaTxRecipient
    const nonTrustedForwarder = await deployMetaTxGateway("Test", "1", l1ChainId);
    expect(await metaTxRecipientMock.isTrustedForwarder(nonTrustedForwarder.address)).to.be.false;
    await nonTrustedForwarder.addToWhitelists(metaTxRecipientMock.address);

    const metaTx = {
      from: alice.address,
      to: metaTxRecipientMock.address,
      functionSignature: metaTxRecipientMock.interface.getSighash("poke()"),
      nonce: +(await nonTrustedForwarder.getNonce(alice.address)),
    };
    const signedResponse = await signEIP712MetaTx(
      alice.address,
      {
        ...domain,
        verifyingContract: nonTrustedForwarder.address, // use the non-trusted forwarder
      },
      metaTx
    );

    // send meta tx through the non-trusted forwarder
    await nonTrustedForwarder
      .connect(relayer)
      .executeMetaTransaction(
        metaTx.from,
        metaTx.to,
        metaTx.functionSignature,
        signedResponse.r,
        signedResponse.s,
        signedResponse.v
      );

    // _msgSender() should fallback to msg.sender, which is the non-trusted forwarder
    expect(await metaTxRecipientMock.pokedBy()).to.eq(nonTrustedForwarder.address);
  });
});
