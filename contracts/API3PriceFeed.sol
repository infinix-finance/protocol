//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.9.0;

import "@api3/airnode-protocol-v1/contracts/dapis/DapiReader.sol";
import "prb-math/contracts/PRBMathUD60x18.sol";

import "./interface/IPriceFeed.sol";

contract API3PriceFeed is IPriceFeed, DapiReader {
    using PRBMathUD60x18 for uint256;

    event OwnershipTransferred(address oldOwner, address newOwner);
    event StalePriceThresholdChanged(uint256 oldThreshold, uint256 newThreshold);

    uint256 private constant SCALE = 10**12;

    /// @notice Time duration beyond which the feed will be considered stale
    uint256 public stalePriceThreshold;

    /// @notice Address of contract's owner
    address public owner;

    constructor(address _dapiServer) DapiReader(_dapiServer) {
        owner = msg.sender;
        stalePriceThreshold = 24 hours;
    }

    /// @dev returns log(price) of an asset
    /// @param _dapiName dapi Name i.e AVAX/USD
    function getPrice(bytes32 _dapiName) external view override returns (uint256) {
        (int224 value, uint32 timestamp) = IDapiServer(dapiServer).readDataFeedWithDapiName(
            _dapiName
        );
        require(timestamp >= block.timestamp - stalePriceThreshold, "stale price feed");

        uint256 scaledVal;
        unchecked {
            scaledVal = uint256(int256(value)) * SCALE;
        }
        return scaledVal.log2();
    }

    /// @notice Transfer ownership of the contract
    /// @param _owner new owner address
    function transferOwnership(address _owner) external {
        require(msg.sender == owner, "caller is not the owner");
        emit OwnershipTransferred(owner, _owner);
        owner = _owner;
    }

    /// @notice Change the stalePriceThreshold
    /// @param _stalePriceThreshold new value for stalePriceThreshold
    function setStalePriceThreshold(uint256 _stalePriceThreshold) external {
        require(msg.sender == owner, "caller is not the owner");

        emit StalePriceThresholdChanged(stalePriceThreshold, _stalePriceThreshold);
        stalePriceThreshold = _stalePriceThreshold;
    }
}
