// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import { IERC20 } from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import { IfnxFiOwnableUpgrade } from "./utils/IfnxFiOwnableUpgrade.sol";
import { Decimal } from "./utils/Decimal.sol";
import { SupplySchedule } from "./SupplySchedule.sol";
import { RewardsDistribution } from "./RewardsDistribution.sol";
import { IInflationMonitor } from "./interface/IInflationMonitor.sol";
import { IIfnxToken } from "./interface/IIfnxToken.sol";
import { IMinter } from "./interface/IMinter.sol";

contract Minter is IMinter, IfnxFiOwnableUpgrade {
    using Decimal for Decimal.decimal;

    //
    // EVENT
    //
    event IfnxMinted(uint256 amount);

    //**********************************************************//
    //    Can not change the order of below state variables     //
    //**********************************************************//

    address private ifnxToken;
    SupplySchedule public supplySchedule;
    RewardsDistribution public rewardsDistribution;
    IInflationMonitor public inflationMonitor;
    address public insuranceFund;

    //**********************************************************//
    //    Can not change the order of above state variables     //
    //**********************************************************//

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ add state variables below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//

    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ add state variables above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//
    uint256[50] private __gap;

    //
    // FUNCTIONS
    //

    /**
     * @notice pre-minted tokens will transfer to the contract creator
     * (contract creator will be admin, minter and pauser),
     * but mint() will transfer to the minter (because only minter can mint)
     * @notice openzeppelin doesn't support struct input
     * https://github.com/OpenZeppelin/openzeppelin-sdk/issues/1523
     */
    function initialize(address _ifnxToken) public initializer {
        __Ownable_init();

        ifnxToken = _ifnxToken;
    }

    //*************** ERC20 functions ***************//
    //
    // PUBLIC functions
    //

    // mintReward is open to everyone (keeper) as long as it meets the condition
    function mintReward() external override {
        uint256 mintableSupply = supplySchedule.mintableSupply().toUint();
        require(mintableSupply > 0, "no supply is mintable");

        IIfnxToken(ifnxToken).mint(address(rewardsDistribution), mintableSupply);
        rewardsDistribution.distributeRewards(IERC20(ifnxToken), Decimal.decimal(mintableSupply));

        // record minting event before mutation to token supply
        supplySchedule.recordMintEvent();

        emit IfnxMinted(mintableSupply);
    }

    // mint for covering unexpected loss, only insurance fund
    function mintForLoss(Decimal.decimal memory _amount) public override {
        require(insuranceFund == _msgSender(), "only insuranceFund");
        require(address(inflationMonitor) != address(0), "inflationMonitor not fount");

        // minter role checking is inside `mint`
        // mint to insuranceFund
        IIfnxToken(ifnxToken).mint(insuranceFund, _amount.toUint());
        inflationMonitor.appendMintedTokenHistory(_amount);

        emit IfnxMinted(_amount.toUint());
    }

    function setInsuranceFund(address _insuranceFund) external onlyOwner {
        insuranceFund = _insuranceFund;
    }

    function setRewardsDistribution(RewardsDistribution _rewardsDistribution) external onlyOwner {
        rewardsDistribution = _rewardsDistribution;
    }

    function setSupplySchedule(SupplySchedule _supplySchedule) external onlyOwner {
        supplySchedule = _supplySchedule;
    }

    function setInflationMonitor(IInflationMonitor _inflationMonitor) external onlyOwner {
        inflationMonitor = _inflationMonitor;
    }

    function getIfnxToken() external view override returns (IERC20) {
        return IERC20(ifnxToken);
    }
}
