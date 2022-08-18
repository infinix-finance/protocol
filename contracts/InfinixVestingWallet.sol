// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";

contract InfinixVestingWallet is VestingWallet {
    constructor(address beneficiaryAddress, uint64 startTimestamp)
        VestingWallet(beneficiaryAddress, startTimestamp, 730 days)
    {}
}
