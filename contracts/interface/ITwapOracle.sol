// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;

interface ITwapOracle {
    function update() external;

    function getTwapPrice() external view returns (uint256);
}
