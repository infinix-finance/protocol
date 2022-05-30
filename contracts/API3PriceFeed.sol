//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0 <0.9.0;

import "./API3/IRrpBeaconServer.sol";
import "./API3/ISelfServeRrpBeaconServerWhitelister.sol";
import "./interface/IPriceFeed.sol";
import "prb-math/contracts/PRBMathUD60x18.sol";

contract API3PriceFeed is IPriceFeed {
    using PRBMathUD60x18 for uint256;

    /// @notice mapping of price feed key -> beacon id
    mapping(bytes32 => bytes32) public priceFeedMap;

    mapping(bytes32 => bool) public priceFeedWhitelisted;

    uint256 SCALE = 10**12;

    IRrpBeaconServer RrpBeaconServer;
    ISelfServeRrpBeaconServerWhitelister ssR;

    event BeaconWhitelisted(bytes32 _priceFeedKey, bytes32 _beaconId);

    constructor(address _whitelister) {
        requireNonEmptyAddress(_whitelister);
        ssR = ISelfServeRrpBeaconServerWhitelister(_whitelister);
        RrpBeaconServer = IRrpBeaconServer(ssR.rrpBeaconServer());
    }

    /// @dev returns log(price) of an asset
    /// @param _priceFeedKey price feed identifier/symbol of asset i.e ETH/USD
    function getPrice(bytes32 _priceFeedKey) external view override returns (uint256) {
        require(priceFeedWhitelisted[_priceFeedKey], "PRICE_FEED: NOT WHITELISTED");

        bytes32 beaconId = priceFeedMap[_priceFeedKey];
        (int224 value, ) = RrpBeaconServer.readBeacon(beaconId);
        uint256 scaledVal;
        unchecked {
            scaledVal = uint256(int256(value)) * SCALE;
        }
        return scaledVal.log2();
    }

    /// @dev sets _beaconId to _priceFeedKey
    /// @param _priceFeedKey price feed identifier/symbol of asset i.e ETH/USD
    /// @param _beaconId beacon id
    function setBeacon(bytes32 _priceFeedKey, bytes32 _beaconId) external {
        require(_beaconId != bytes32(0));

        if (!isPriceFeedWhitelisted(_priceFeedKey)) {
            ssR.whitelistReader(_beaconId, address(this));
            priceFeedWhitelisted[_priceFeedKey] = true;
        }
        priceFeedMap[_priceFeedKey] = _beaconId;

        emit BeaconWhitelisted(_priceFeedKey, _beaconId);
    }

    /// @dev returns bool to indicate if price feed key is whitelisted or not
    function isPriceFeedWhitelisted(bytes32 _priceFeedKey) public view returns (bool) {
        return priceFeedWhitelisted[_priceFeedKey];
    }

    /// @dev returns beacon id
    function getBeacon(bytes32 _priceFeedKey) public view returns (bytes32) {
        return priceFeedMap[_priceFeedKey];
    }

    function requireNonEmptyAddress(address _addr) internal pure {
        require(_addr != address(0), "empty address");
    }
}
