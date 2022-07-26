// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IfnxFiOwnableUpgrade} from "./utils/IfnxFiOwnableUpgrade.sol";
import {IRewardRecipient} from "./interface/IRewardRecipient.sol";
import {Decimal} from "./utils/Decimal.sol";

abstract contract RewardsDistributionRecipient is IfnxFiOwnableUpgrade, IRewardRecipient {
    //**********************************************************//
    //    The below state variables can not change the order    //
    //**********************************************************//
    address public rewardsDistribution;
    //**********************************************************//
    //    The above state variables can not change the order    //
    //**********************************************************//

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ add state variables below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//

    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ add state variables above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//
    uint256[50] private __gap;

    //
    // FUNCTIONS
    //

    function notifyRewardAmount(Decimal.decimal calldata _amount) external virtual override;

    function setRewardsDistribution(address _rewardsDistribution) external onlyOwner {
        rewardsDistribution = _rewardsDistribution;
    }

    modifier onlyRewardsDistribution() {
        require(rewardsDistribution == _msgSender(), "only rewardsDistribution");
        _;
    }
}
