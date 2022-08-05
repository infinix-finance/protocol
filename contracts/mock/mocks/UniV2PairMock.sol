// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

import {IUniswapV2Pair} from "../../exchangeWrapper/UniswapLib.sol";

contract UniV2PairMock is IUniswapV2Pair {
    uint112 public reserve0;
    uint112 public reserve1;
    uint32 public blockTimestampLast;

    uint256 public override price0CumulativeLast;
    uint256 public override price1CumulativeLast;

    function getReserves()
        external
        view
        override
        returns (
            uint112,
            uint112,
            uint32
        )
    {
        return (reserve0, reserve1, blockTimestampLast);
    }

    function setReserves(uint112 _reserve0, uint112 _reserve1) external {
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += uint256(_reserve1 / _reserve0) * timeElapsed;
            price1CumulativeLast += uint256(_reserve0 / _reserve1) * timeElapsed;
        }
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = blockTimestamp;
    }

    function getBlockNumberAndTs() external view returns (uint256 blockNumber, uint256 timestamp) {
        return (block.number, block.timestamp);
    }
}
