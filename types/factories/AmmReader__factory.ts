/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AmmReader, AmmReaderInterface } from "../AmmReader";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_amm",
        type: "address",
      },
    ],
    name: "getAmmStates",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "quoteAssetReserve",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "baseAssetReserve",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "tradeLimitRatio",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fundingPeriod",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "quoteAssetSymbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "baseAssetSymbol",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "priceFeedKey",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "priceFeed",
            type: "address",
          },
        ],
        internalType: "struct AmmReader.AmmStates",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610890806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063e7f9871e14610030575b600080fd5b61004361003e3660046105f4565b610059565b6040516100509190610760565b60405180910390f35b61006161056b565b600082905060006060826001600160a01b031663fdf262b76040518163ffffffff1660e01b815260040160206040518083038186803b1580156100a357600080fd5b505afa1580156100b7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100db919061062f565b60408051600481526024810182526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff166395d89b4160e01b17905290516001600160a01b0392909216916101319190610744565b600060405180830381855afa9150503d806000811461016c576040519150601f19603f3d011682016040523d82523d6000602084013e610171565b606091505b509150915061017e6105bc565b6101866105bc565b846001600160a01b03166359bf5d396040518163ffffffff1660e01b8152600401604080518083038186803b1580156101be57600080fd5b505afa1580156101d2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101f691906106d7565b915091506000856001600160a01b03166358a4c3dc6040518163ffffffff1660e01b815260040160206040518083038186803b15801561023557600080fd5b505afa158015610249573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061026d9190610617565b905060405180610100016040528061028485610452565b815260200161029284610452565b8152602001876001600160a01b0316638f40d9326040518163ffffffff1660e01b815260040160206040518083038186803b1580156102d057600080fd5b505afa1580156102e4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103089190610617565b8152602001876001600160a01b03166374d7c62b6040518163ffffffff1660e01b815260040160206040518083038186803b15801561034657600080fd5b505afa15801561035a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061037e9190610617565b81526020018661039d57604051806020016040528060008152506103b1565b858060200190518101906103b1919061064b565b81526020016103bf83610456565b8152602001828152602001876001600160a01b031663741bef1a6040518163ffffffff1660e01b815260040160206040518083038186803b15801561040357600080fd5b505afa158015610417573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061043b919061062f565b6001600160a01b0316905298975050505050505050565b5190565b606060005b60208160ff161080156104895750828160ff166020811061047857fe5b1a60f81b6001600160f81b03191615155b156104965760010161045b565b60608160ff1667ffffffffffffffff811180156104b257600080fd5b506040519080825280601f01601f1916602001820160405280156104dd576020820181803683370190505b50905060005b60208110801561050b57508481602081106104fa57fe5b1a60f81b6001600160f81b03191615155b156105635784816020811061051c57fe5b1a60f81b82828151811061052c57fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053506001016104e3565b509392505050565b6040518061010001604052806000815260200160008152602001600081526020016000815260200160608152602001606081526020016000801916815260200160006001600160a01b031681525090565b6040518060200160405280600081525090565b6000602082840312156105e0578081fd5b6105ea60206107eb565b9151825250919050565b600060208284031215610605578081fd5b813561061081610842565b9392505050565b600060208284031215610628578081fd5b5051919050565b600060208284031215610640578081fd5b815161061081610842565b60006020828403121561065c578081fd5b815167ffffffffffffffff80821115610673578283fd5b81840185601f820112610684578384fd5b8051925081831115610694578384fd5b6106a7601f8401601f19166020016107eb565b91508282528560208483010111156106bd578384fd5b6106ce836020840160208401610812565b50949350505050565b600080604083850312156106e9578081fd5b6106f384846105cf565b915061070284602085016105cf565b90509250929050565b6001600160a01b03169052565b60008151808452610730816020860160208601610812565b601f01601f19169290920160200192915050565b60008251610756818460208701610812565b9190910192915050565b6000602082528251602083015260208301516040830152604083015160608301526060830151608083015260808301516101008060a08501526107a7610120850183610718565b60a0860151858203601f190160c087015292506107c48184610718565b60c087015160e087015260e087015193506107e18387018561070b565b9695505050505050565b60405181810167ffffffffffffffff8111828210171561080a57600080fd5b604052919050565b60005b8381101561082d578181015183820152602001610815565b8381111561083c576000848401525b50505050565b6001600160a01b038116811461085757600080fd5b5056fea26469706673582212202e79bb5d1b63ea8b0abd59c4c8fe1f15bdbba478fe5dbfeb466490c16bfe231264736f6c63430006090033";

export class AmmReader__factory extends ContractFactory {
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
  ): Promise<AmmReader> {
    return super.deploy(overrides || {}) as Promise<AmmReader>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): AmmReader {
    return super.attach(address) as AmmReader;
  }
  connect(signer: Signer): AmmReader__factory {
    return super.connect(signer) as AmmReader__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AmmReaderInterface {
    return new utils.Interface(_abi) as AmmReaderInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AmmReader {
    return new Contract(address, _abi, signerOrProvider) as AmmReader;
  }
}