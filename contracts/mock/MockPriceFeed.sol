// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.6.0 <=0.9.0;
import "prb-math/contracts/PRBMathUD60x18.sol";

contract MockPriceFeed {
    using PRBMathUD60x18 for uint256;

    uint256 price;

    function getPrice() public view returns (uint256) {
        return price;
    }

    function setPrice(uint256 _price) public {
        price = _price;
    }
}
