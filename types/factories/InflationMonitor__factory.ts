/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  InflationMonitor,
  InflationMonitorInterface,
} from "../InflationMonitor";

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
    name: "MINT_THRESHOLD_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "d",
            type: "uint256",
          },
        ],
        internalType: "struct Decimal.decimal",
        name: "_amount",
        type: "tuple",
      },
    ],
    name: "appendMintedTokenHistory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
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
    inputs: [
      {
        internalType: "contract IMinter",
        name: "_minter",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isOverMintThreshold",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mintedAmountDuringMintThresholdPeriod",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "d",
            type: "uint256",
          },
        ],
        internalType: "struct Decimal.decimal",
        name: "",
        type: "tuple",
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
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "d",
            type: "uint256",
          },
        ],
        internalType: "struct Decimal.decimal",
        name: "_shutdownThreshold",
        type: "tuple",
      },
    ],
    name: "setShutdownThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "shutdownThreshold",
    outputs: [
      {
        internalType: "uint256",
        name: "d",
        type: "uint256",
      },
    ],
    stateMutability: "view",
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
  "0x608060405234801561001057600080fd5b506113e2806100206000396000f3fe608060405234801561001057600080fd5b50600436106100d45760003560e01c8063715018a611610081578063bc5920ba1161005b578063bc5920ba14610181578063c4d66de814610189578063cb821fbd1461019c576100d4565b8063715018a61461015e5780638da5cb5b14610166578063af5ff5ba1461016e576100d4565b80633fe204d9116100b25780633fe204d91461011f57806356eb0393146101345780636c8381f814610149576100d4565b806313af4035146100d9578063213c4c7b146100ee5780632f4d6fa614610101575b600080fd5b6100ec6100e7366004610f4b565b6101a4565b005b6100ec6100fc366004610f83565b610286565b610109610383565b604051610116919061135e565b60405180910390f35b610127610389565b604051610116919061101f565b61013c610492565b6040516101169190611354565b61015161061e565b604051610116919061100b565b6100ec61062d565b6101516106ac565b6100ec61017c366004610f9a565b6106bb565b6100ec6106f6565b6100ec610197366004610f4b565b6107b9565b61010961087e565b6101ac610885565b6065546001600160a01b039081169116146101e25760405162461bcd60e51b81526004016101d9906112c1565b60405180910390fd5b6001600160a01b0381166102085760405162461bcd60e51b81526004016101d9906111c5565b6065546001600160a01b03828116911614156102365760405162461bcd60e51b81526004016101d99061130e565b6066546001600160a01b03828116911614156102645760405162461bcd60e51b81526004016101d9906110b5565b606680546001600160a01b0319166001600160a01b0392909216919091179055565b610100546001600160a01b031661029b610885565b6001600160a01b0316146102c15760405162461bcd60e51b81526004016101d99061105d565b6102c9610f38565b60fe54806102e7576102e036849003840184610f9a565b9150610338565b6103356102f936859003850185610f9a565b60fe600184038154811061030957fe5b60009182526020918290206040805193840190526001600290920201015481529063ffffffff61088916565b91505b60fe604051806040016040528061034d6108b7565b81526020908101949094528154600181810184556000938452928590208251600290920201908155930151519201919091555050565b60ff5481565b604080516020810190915260ff5481526000906103a5906108bb565b6103b15750600061048f565b6103b9610f38565b610100546040805163eb7c8c2560e01b8152905161043d926001600160a01b03169163eb7c8c25916004808301926020929190829003018186803b15801561040057600080fd5b505afa158015610414573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104389190610f67565b6108bf565b9050610447610f38565b61044f610492565b604080516020810190915260ff54815290915060009061048590610479848663ffffffff61094116565b9063ffffffff61096416565b60000b1215925050505b90565b61049a610f38565b60fe54806104b2576104aa610995565b91505061048f565b60006104ed60fe60018403815481106104c757fe5b9060005260206000209060020201600001546104e16108b7565b9063ffffffff6109b016565b905062093a8081111561050b57610502610995565b9250505061048f565b610513610f38565b60001983015b801561061657610527610f38565b61059460fe600184038154811061053a57fe5b600091825260209182902060408051938401905260016002909202010154815260fe80548590811061056857fe5b60009182526020918290206040805193840190526001600290920201015481529063ffffffff6109f916565b90506105a6838263ffffffff61088916565b92506105f760fe60018403815481106105bb57fe5b90600052602060002090600202016000015460fe84815481106105da57fe5b60009182526020909120600290910201549063ffffffff6109b016565b8401935062093a8084111561060c5750610616565b5060001901610519565b509250505090565b6066546001600160a01b031690565b610635610885565b6065546001600160a01b039081169116146106625760405162461bcd60e51b81526004016101d9906112c1565b6065546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3606580546001600160a01b0319169055565b6065546001600160a01b031690565b6106c3610885565b6065546001600160a01b039081169116146106f05760405162461bcd60e51b81526004016101d9906112c1565b5160ff55565b6066546001600160a01b031661071e5760405162461bcd60e51b81526004016101d990611264565b610726610885565b6066546001600160a01b039081169116146107535760405162461bcd60e51b81526004016101d9906110fc565b6066546065546040516001600160a01b0392831692909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a360668054606580546001600160a01b03199081166001600160a01b03841617909155169055565b600054610100900460ff16806107d257506107d2610a1c565b806107e0575060005460ff16155b6107fc5760405162461bcd60e51b81526004016101d990611207565b600054610100900460ff16158015610827576000805460ff1961ff0019909116610100171660011790555b61082f610a22565b61010080546001600160a01b0319166001600160a01b038416179055610864600a610858610ab5565b9063ffffffff610ad916565b5160ff55801561087a576000805461ff00191690555b5050565b62093a8081565b3390565b610891610f38565b610899610f38565b825184516108ac9163ffffffff610afb16565b815290505b92915050565b4290565b5190565b6108c7610f38565b6108b182836001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b15801561090457600080fd5b505afa158015610918573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061093c9190610fd7565b610b20565b610949610f38565b610951610f38565b825184516108ac9163ffffffff610bb216565b805182516000911015610979575060016108b1565b81518351101561098c57506000196108b1565b50600092915050565b61099d610f38565b5060408051602081019091526000815290565b60006109f283836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250610bc0565b9392505050565b610a01610f38565b610a09610f38565b825184516108ac9163ffffffff6109b016565b303b1590565b600054610100900460ff1680610a3b5750610a3b610a1c565b80610a49575060005460ff16155b610a655760405162461bcd60e51b81526004016101d990611207565b600054610100900460ff16158015610a90576000805460ff1961ff0019909116610100171660011790555b610a98610bec565b610aa0610c6d565b8015610ab2576000805461ff00191690555b50565b610abd610f38565b6040518060200160405280610ad26012610d47565b9052905090565b610ae1610f38565b610ae9610f38565b83516108ac908463ffffffff610d5016565b6000828201838110156109f25760405162461bcd60e51b81526004016101d99061107e565b610b28610f38565b6000610b3384610d92565b905060128110610b7857604080516020810190915280610b6d610b5d84601263ffffffff6109b016565b8690600a0a63ffffffff610d5016565b8152509150506108b1565b604080516020810190915280610ba8610b9860128563ffffffff6109b016565b8690600a0a63ffffffff610e9416565b9052949350505050565b60006109f283836012610ece565b60008184841115610be45760405162461bcd60e51b81526004016101d9919061102a565b505050900390565b600054610100900460ff1680610c055750610c05610a1c565b80610c13575060005460ff16155b610c2f5760405162461bcd60e51b81526004016101d990611207565b600054610100900460ff16158015610aa0576000805460ff1961ff0019909116610100171660011790558015610ab2576000805461ff001916905550565b600054610100900460ff1680610c865750610c86610a1c565b80610c94575060005460ff16155b610cb05760405162461bcd60e51b81526004016101d990611207565b600054610100900460ff16158015610cdb576000805460ff1961ff0019909116610100171660011790555b6000610ce5610885565b606580546001600160a01b0319166001600160a01b038316908117909155604051919250906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a3508015610ab2576000805461ff001916905550565b60ff16600a0a90565b60006109f283836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250610f01565b6001600160a01b038116600090815260cb6020526040812054806108b15760408051600481526024810182526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1663313ce56760e01b17905290516000916060916001600160a01b03871691610e0991610fef565b600060405180830381855afa9150503d8060008114610e44576040519150601f19603f3d011682016040523d82523d6000602084013e610e49565b606091505b5091509150818015610e5b5750805115155b610e775760405162461bcd60e51b81526004016101d990611143565b80806020019051810190610e8b9190610fd7565b95945050505050565b600082610ea3575060006108b1565b82820282848281610eb057fe5b04146109f25760405162461bcd60e51b81526004016101d990611184565b6000610ef983610eed610ee085610d47565b879063ffffffff610e9416565b9063ffffffff610d5016565b949350505050565b60008183610f225760405162461bcd60e51b81526004016101d9919061102a565b506000838581610f2e57fe5b0495945050505050565b6040518060200160405280600081525090565b600060208284031215610f5c578081fd5b81356109f281611397565b600060208284031215610f78578081fd5b81516109f281611397565b600060208284031215610f94578081fd5b50919050565b600060208284031215610fab578081fd5b6040516020810181811067ffffffffffffffff82111715610fca578283fd5b6040529135825250919050565b600060208284031215610fe8578081fd5b5051919050565b60008251611001818460208701611367565b9190910192915050565b6001600160a01b0391909116815260200190565b901515815260200190565b6000602082528251806020840152611049816040850160208701611367565b601f01601f19169190910160400192915050565b60208082526007908201526610b6b4b73a32b960c91b604082015260600190565b6020808252601b908201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604082015260600190565b60208082526027908201527f5065727046694f776e61626c65557067726164653a2073616d652061732063616040820152666e64696461746560c81b606082015260800190565b60208082526027908201527f5065727046694f776e61626c65557067726164653a206e6f7420746865206e656040820152663b9037bbb732b960c91b606082015260800190565b60208082526021908201527f446563696d616c45524332303a2067657420646563696d616c73206661696c656040820152601960fa1b606082015260800190565b60208082526021908201527f536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f6040820152607760f81b606082015260800190565b60208082526022908201527f5065727046694f776e61626c65557067726164653a207a65726f206164647265604082015261737360f01b606082015260800190565b6020808252602e908201527f436f6e747261637420696e7374616e63652068617320616c726561647920626560408201527f656e20696e697469616c697a6564000000000000000000000000000000000000606082015260800190565b6020808252602f908201527f5065727046694f776e61626c65557067726164653a2063616e6469646174652060408201527f6973207a65726f20616464726573730000000000000000000000000000000000606082015260800190565b6020808252602d908201527f5065727046694f776e61626c65557067726164653a2063616c6c65722069732060408201526c3737ba103a34329037bbb732b960991b606082015260800190565b60208082526026908201527f5065727046694f776e61626c65557067726164653a2073616d65206173206f726040820152651a59da5b985b60d21b606082015260800190565b9051815260200190565b90815260200190565b60005b8381101561138257818101518382015260200161136a565b83811115611391576000848401525b50505050565b6001600160a01b0381168114610ab257600080fdfea264697066735822122078a8f6c6fa577a229e9ba2f2102621b08c5fcb8a4cfa71ae6889b6df3fed109364736f6c63430006090033";

export class InflationMonitor__factory extends ContractFactory {
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
  ): Promise<InflationMonitor> {
    return super.deploy(overrides || {}) as Promise<InflationMonitor>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): InflationMonitor {
    return super.attach(address) as InflationMonitor;
  }
  connect(signer: Signer): InflationMonitor__factory {
    return super.connect(signer) as InflationMonitor__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): InflationMonitorInterface {
    return new utils.Interface(_abi) as InflationMonitorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): InflationMonitor {
    return new Contract(address, _abi, signerOrProvider) as InflationMonitor;
  }
}