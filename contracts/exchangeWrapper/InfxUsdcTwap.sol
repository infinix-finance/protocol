// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.9;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./UniswapLib.sol";

contract InfxUsdcTwap {
    using FixedPoint for *;
    using SafeMath for uint256;

    event WindowUpdated(
        uint256 oldTimestamp,
        uint256 oldPrice,
        uint256 newTimeStamp,
        uint256 newPrice
    );

    struct Observation {
        uint256 timestamp;
        uint256 acc;
    }

    IUniswapV2Pair public pair;
    uint256 public period;
    bool public isReversed;

    Observation public oldObservation;
    Observation public newObservation;

    constructor(
        address _pair,
        uint256 _period,
        bool _isReversed
    ) public {
        require(_pair != address(0), "invalid pair");
        require(_period != 0, "invalid period");

        pair = IUniswapV2Pair(_pair);
        period = _period;
        isReversed = _isReversed;
        uint256 cumulativePrice = currentCumulativePrice();
        oldObservation.timestamp = block.timestamp;
        newObservation.timestamp = block.timestamp;
        oldObservation.acc = cumulativePrice;
        newObservation.acc = cumulativePrice;
    }

    function update() external {
        if (block.timestamp.sub(newObservation.timestamp) >= period) {
            oldObservation.timestamp = newObservation.timestamp;
            oldObservation.acc = newObservation.acc;
            newObservation.timestamp = block.timestamp;
            newObservation.acc = currentCumulativePrice();
            emit WindowUpdated(
                oldObservation.timestamp,
                oldObservation.acc,
                newObservation.timestamp,
                newObservation.acc
            );
        }
    }

    function getTwapPrice() external view returns (uint256) {
        uint256 timeElapsed = block.timestamp.sub(oldObservation.timestamp);
        FixedPoint.uq112x112 memory priceAverage = FixedPoint.uq112x112(
            uint224((currentCumulativePrice() - oldObservation.acc) / timeElapsed)
        );
        return priceAverage.decode112with18();
    }

    function currentCumulativePrice() internal view returns (uint256) {
        (uint256 cumulativePrice0, uint256 cumulativePrice1, ) = UniswapV2OracleLibrary
            .currentCumulativePrices(address(pair));
        return (isReversed ? cumulativePrice1 : cumulativePrice0);
    }
}
