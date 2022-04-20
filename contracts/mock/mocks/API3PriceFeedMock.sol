// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

contract API3PriceFeedMock {
    uint256 price;

    constructor(uint256 _price) public {
        price = _price;
    }

    function getPrice(bytes32) public view returns (uint256) {
        return price;
    }

    function setPrice(uint256 _price) public {
        price = _price;
    }

    event PriceFeedDataSet(bytes32 key, uint256 price, uint256 timestamp, uint256 roundId);
}
