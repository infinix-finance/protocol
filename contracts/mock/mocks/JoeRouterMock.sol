// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

contract JoeRouterMock {
    constructor() public {}

    uint256 private spotPrice = 1;

    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        for (uint256 i; i < path.length; i++) {
            amounts[i] = spotPrice;
        }
    }

    function mockSetSpotPrice(uint256 price) public {
        spotPrice = price;
    }
}
