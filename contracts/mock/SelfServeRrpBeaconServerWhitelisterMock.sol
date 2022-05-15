// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "../API3/ISelfServeRrpBeaconServerWhitelister.sol";

contract SelfServeRrpBeaconServerWhitelisterMock is ISelfServeRrpBeaconServerWhitelister {
    address public server;
    mapping(bytes32 => mapping(address => bool)) public whitelisted;

    constructor() public {}

    function setBeaconIdToExpirationTimestamp(bytes32 _beaconId, uint64 _expirationTimestamp)
        external
        override
    {}

    function setBeaconIdToIndefiniteWhitelistStatus(
        bytes32 _beaconId,
        bool _indefiniteWhitelistStatus
    ) external override {}

    function whitelistReader(bytes32 _beaconId, address _reader) external override {
        whitelisted[_beaconId][_reader] = true;
    }

    function beaconIdToExpirationTimestamp(bytes32 _beaconId)
        external
        view
        override
        returns (uint64)
    {
        return 0;
    }

    function beaconIdToIndefiniteWhitelistStatus(bytes32 _beaconId)
        external
        view
        override
        returns (bool)
    {
        return true;
    }

    function rrpBeaconServer() external view override returns (address) {
        return server;
    }

    function mockSetRrpBeaconServer(address _server) external {
        server = _server;
    }
}
