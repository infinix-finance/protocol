// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "../API3/IRrpBeaconServer.sol";

contract RrpBeaconServerFake is IRrpBeaconServer {
    int224 public value;
    uint32 public timestamp;

    constructor() public {}

    function extendWhitelistExpiration(
        bytes32 beaconId,
        address reader,
        uint64 expirationTimestamp
    ) external override {}

    function setWhitelistExpiration(
        bytes32 beaconId,
        address reader,
        uint64 expirationTimestamp
    ) external override {}

    function setIndefiniteWhitelistStatus(
        bytes32 beaconId,
        address reader,
        bool status
    ) external override {}

    function revokeIndefiniteWhitelistStatus(
        bytes32 beaconId,
        address reader,
        address setter
    ) external override {}

    function setUpdatePermissionStatus(address updateRequester, bool status) external override {}

    function requestBeaconUpdate(
        bytes32 beaconId,
        address requester,
        address designatedWallet,
        bytes calldata parameters
    ) external override {}

    function fulfill(bytes32 requestId, bytes calldata data) external override {}

    function readBeacon(bytes32 beaconId) external view override returns (int224, uint32) {
        return (value, timestamp);
    }

    function readerCanReadBeacon(bytes32 beaconId, address reader)
        external
        view
        override
        returns (bool)
    {
        return true;
    }

    function beaconIdToReaderToWhitelistStatus(bytes32 beaconId, address reader)
        external
        view
        override
        returns (uint64 expirationTimestamp, uint192 indefiniteWhitelistCount)
    {}

    function beaconIdToReaderToSetterToIndefiniteWhitelistStatus(
        bytes32 beaconId,
        address reader,
        address setter
    ) external view override returns (bool indefiniteWhitelistStatus) {}

    function sponsorToUpdateRequesterToPermissionStatus(address sponsor, address updateRequester)
        external
        view
        override
        returns (bool permissionStatus)
    {}

    function deriveBeaconId(bytes32 templateId, bytes calldata parameters)
        external
        pure
        override
        returns (bytes32 beaconId)
    {}

    function mockSetValueAndTimestamp(int224 _value, uint32 _timestamp) external {
        value = _value;
        timestamp = _timestamp;
    }
}
