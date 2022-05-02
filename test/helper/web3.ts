import { ethers } from "hardhat";

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface MetaTx {
  from: string;
  to: string;
  functionSignature: string;
  nonce: number;
}

export interface SignedResponse {
  signature: string;
  r: string;
  s: string;
  v: number;
}

const EIP712DomainTypes = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const MetaTxTypes = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "functionSignature", type: "bytes" },
];

function getSendFunction() {
  const provider = ethers.provider;
  if (typeof provider === "string") {
    throw new TypeError("web3.currentProvider should not be a string");
  }
  if (provider === null || provider === undefined) {
    throw new TypeError("web3.currentProvider should not be null or undefined");
  }
  if (!provider.send) {
    throw new TypeError("web3.currentProvider.send() does not exist");
  }
  return provider.send;
}

export function changeBlockTime(time: number): Promise<void> {
  const send = getSendFunction();
  return send("evm_increaseTime", [time]);
}

export function signEIP712MetaTx(
  signer: string,
  domain: EIP712Domain,
  metaTx: MetaTx
): Promise<SignedResponse> {
  const dataToSign = {
    types: {
      EIP712Domain: EIP712DomainTypes,
      MetaTransaction: MetaTxTypes,
    },
    domain,
    primaryType: "MetaTransaction",
    message: metaTx,
  };

  return new Promise((resolve, reject) => {
    const send = getSendFunction();
    send("eth_signTypedData_v4", [signer, dataToSign])
      .then((result) => {
        const signature = result.substring(2);
        resolve({
          signature,
          r: "0x" + signature.substring(0, 64),
          s: "0x" + signature.substring(64, 128),
          v: parseInt(signature.substring(128, 130), 16),
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
}
