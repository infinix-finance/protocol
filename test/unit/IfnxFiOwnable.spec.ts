import { expect, use } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { IfnxFiOwnableUpgradeFake } from "../../types";

describe("IfnxFiOwnableUpgrade UT", () => {
  let ifnxFiOwnable: IfnxFiOwnableUpgradeFake;

  let addresses: Wallet[];
  let admin: Wallet;
  let alice: Wallet;

  beforeEach(async () => {
    addresses = await waffle.provider.getWallets();
    admin = addresses[0];
    alice = addresses[1];
    const IfnxFiOwnableUpgradeFakeFactory = await ethers.getContractFactory(
      "IfnxFiOwnableUpgradeFake"
    );
    ifnxFiOwnable = (await IfnxFiOwnableUpgradeFakeFactory.deploy()) as IfnxFiOwnableUpgradeFake;
    await ifnxFiOwnable.initialize();
  });

  it("transfer ownership", async () => {
    await ifnxFiOwnable.setOwner(alice.address);
    const r = await ifnxFiOwnable.connect(alice).updateOwner();
    expect(r).to.emit(ifnxFiOwnable, "OwnershipTransferred").withArgs(admin.address, alice.address);
  });

  it("transfer ownership and set owner to another", async () => {
    await ifnxFiOwnable.setOwner(alice.address);
    const r = await ifnxFiOwnable.connect(alice).updateOwner();
    expect(r).to.emit(ifnxFiOwnable, "OwnershipTransferred");

    // only owner can set owner, now owner is alice
    await ifnxFiOwnable.connect(alice).setOwner(admin.address);
    expect(await ifnxFiOwnable.candidate()).eq(admin.address);
  });

  it("force error, only owner can call setOwner", async () => {
    await expect(ifnxFiOwnable.connect(alice).setOwner(alice.address)).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: caller is not the owner"
    );
  });

  it("force error set current owner", async () => {
    await expect(ifnxFiOwnable.setOwner(admin.address)).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: same as original"
    );
  });

  it("force error, update owner but caller not the new owner", async () => {
    await ifnxFiOwnable.setOwner(alice.address);
    await expect(ifnxFiOwnable.connect(admin).updateOwner()).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: not the new owner"
    );
  });

  it("force error, update owner without set a new owner first", async () => {
    await expect(ifnxFiOwnable.connect(admin).updateOwner()).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: candidate is zero address"
    );
  });

  it("force error, can not update twice", async () => {
    await ifnxFiOwnable.setOwner(alice.address);
    const r = await ifnxFiOwnable.connect(alice).updateOwner();
    expect(r).to.emit(ifnxFiOwnable, "OwnershipTransferred");
    await expect(ifnxFiOwnable.connect(alice).updateOwner()).to.be.revertedWith(
      "IfnxFiOwnableUpgrade: candidate is zero address"
    );
  });
});
