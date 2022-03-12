/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  PerpFiOwnableUpgrade,
  PerpFiOwnableUpgradeInterface,
} from "../PerpFiOwnableUpgrade";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "candidate",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "updateOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506104fe806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c806313af40351461005c5780636c8381f814610084578063715018a6146100a85780638da5cb5b146100b0578063bc5920ba146100b8575b600080fd5b6100826004803603602081101561007257600080fd5b50356001600160a01b03166100c0565b005b61008c610215565b604080516001600160a01b039092168252519081900360200190f35b610082610224565b61008c6102c2565b6100826102d1565b6100c86103d2565b6065546001600160a01b039081169116146101145760405162461bcd60e51b815260040180806020018281038252602d815260200180610476602d913960400191505060405180910390fd5b6001600160a01b0381166101595760405162461bcd60e51b81526004018080602001828103825260228152602001806104256022913960400191505060405180910390fd5b6065546001600160a01b03828116911614156101a65760405162461bcd60e51b81526004018080602001828103825260268152602001806104a36026913960400191505060405180910390fd5b6066546001600160a01b03828116911614156101f35760405162461bcd60e51b81526004018080602001828103825260278152602001806103d76027913960400191505060405180910390fd5b606680546001600160a01b0319166001600160a01b0392909216919091179055565b6066546001600160a01b031690565b61022c6103d2565b6065546001600160a01b039081169116146102785760405162461bcd60e51b815260040180806020018281038252602d815260200180610476602d913960400191505060405180910390fd5b6065546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3606580546001600160a01b0319169055565b6065546001600160a01b031690565b6066546001600160a01b03166103185760405162461bcd60e51b815260040180806020018281038252602f815260200180610447602f913960400191505060405180910390fd5b6103206103d2565b6066546001600160a01b0390811691161461036c5760405162461bcd60e51b81526004018080602001828103825260278152602001806103fe6027913960400191505060405180910390fd5b6066546065546040516001600160a01b0392831692909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a360668054606580546001600160a01b03199081166001600160a01b03841617909155169055565b339056fe5065727046694f776e61626c65557067726164653a2073616d652061732063616e6469646174655065727046694f776e61626c65557067726164653a206e6f7420746865206e6577206f776e65725065727046694f776e61626c65557067726164653a207a65726f20616464726573735065727046694f776e61626c65557067726164653a2063616e646964617465206973207a65726f20616464726573735065727046694f776e61626c65557067726164653a2063616c6c6572206973206e6f7420746865206f776e65725065727046694f776e61626c65557067726164653a2073616d65206173206f726967696e616ca26469706673582212202fe4ec43d81beac980756e39ff08fe1a134a03ebc0b20759e6e97c4913910fa064736f6c63430006090033";

export class PerpFiOwnableUpgrade__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<PerpFiOwnableUpgrade> {
    return super.deploy(overrides || {}) as Promise<PerpFiOwnableUpgrade>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): PerpFiOwnableUpgrade {
    return super.attach(address) as PerpFiOwnableUpgrade;
  }
  connect(signer: Signer): PerpFiOwnableUpgrade__factory {
    return super.connect(signer) as PerpFiOwnableUpgrade__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PerpFiOwnableUpgradeInterface {
    return new utils.Interface(_abi) as PerpFiOwnableUpgradeInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PerpFiOwnableUpgrade {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as PerpFiOwnableUpgrade;
  }
}