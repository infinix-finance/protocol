// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

contract API3PriceFeedMock {
    uint256 price;
    uint256 twapPrice;
    uint256 timestamp;

    constructor(uint256 _price) public {
        price = _price;
        twapPrice = _price;
    }

    function getPrice(bytes32) public view returns (uint256) {
        if (timestamp != 0) {
            require(timestamp >= block.timestamp - 24 hours, "stale price feed");
        }
        return price;
    }

    function setPrice(uint256 _price) public {
        price = _price;
    }

    function getTwapPrice(bytes32, uint256) public view returns (uint256) {
        return twapPrice;
    }

    function setTwapPrice(uint256 _price) public {
        twapPrice = _price;
    }

    function setTimestamp(uint256 _timestamp) public {
        timestamp = _timestamp;
    }

    function getEvmTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    event PriceFeedDataSet(bytes32 key, uint256 price, uint256 timestamp, uint256 roundId);
}
