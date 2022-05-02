const ethers = require('ethers');

async function main() {

    const newWallet = await ethers.Wallet.createRandom();

    const secret = {
        account: newWallet.address,
        mnemonic: newWallet.mnemonic.phrase
    };

    console.log(secret);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });