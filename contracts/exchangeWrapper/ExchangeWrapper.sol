// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IfnxFiOwnableUpgrade} from "../utils/IfnxFiOwnableUpgrade.sol";
import {IERC20} from "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import {IJoeRouter02} from "./traderjoe/IJoeRouter02.sol";
import {IExchangeWrapper, Decimal} from "../interface/IExchangeWrapper.sol";
import {ITwapOracle} from "../interface/ITwapOracle.sol";
import {DecimalERC20} from "../utils/DecimalERC20.sol";
import {Decimal, SafeMath} from "../utils/Decimal.sol";

// USDC/USDT decimal 6
contract ExchangeWrapper is IfnxFiOwnableUpgrade, IExchangeWrapper, DecimalERC20 {
    using Decimal for Decimal.decimal;
    using SafeMath for *;

    // default max price slippage is 20% of spot price. 12e17 = (1 + 20%) e18
    uint256 private constant DEFAULT_MAX_PRICE_SLIPPAGE = 12e17;

    // default trade range for input/output tokens is 10%. 0.1e18 = 10% * e18
    uint256 private constant DEFAULT_TRADE_RANGE = 0.1e18;

    //
    // EVENTS
    //
    event TwapOracleUpdated(address baseToken, address quoteToken, address twapOracle);
    event ExchangeSwap(uint256 ifnxTokenAmount, uint256 usdtAmount);
    // for debug purpose in the future
    event TraderJoeSwap(uint256 inAmount, uint256 out);

    //**********************************************************//
    //    The below state variables can not change the order    //
    //**********************************************************//
    IJoeRouter02 public joeRouter;
    IERC20 private ifnxToken;
    mapping(bytes32 => ITwapOracle) public twapOracles;
    //**********************************************************//
    //    The above state variables can not change the order    //
    //**********************************************************//

    //◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤ add state variables below ◥◤◥◤◥◤◥◤◥◤◥◤◥◤◥◤//

    //◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣ add state variables above ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣//
    uint256[50] private __gap;

    //
    // FUNCTIONS
    //
    function initialize(address _joeRouter, address _ifnxToken) external initializer {
        __Ownable_init();

        ifnxToken = IERC20(_ifnxToken);
        setJoeRouter(_joeRouter);
    }

    function setTwapOracle(
        address baseToken,
        address quoteToken,
        ITwapOracle twapOracle
    ) external onlyOwner {
        require(baseToken != quoteToken, "invalid tokens");
        // sanity checks
        IERC20(baseToken).totalSupply();
        IERC20(quoteToken).totalSupply();

        twapOracles[keccak256(abi.encodePacked(baseToken, quoteToken))] = twapOracle;
        emit TwapOracleUpdated(baseToken, quoteToken, address(twapOracle));
    }

    function swapInput(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal calldata _inputTokenSold,
        Decimal.decimal calldata _minOutputTokenBought,
        Decimal.decimal calldata _maxPrice
    ) external override returns (Decimal.decimal memory) {
        return
            implSwapInput(
                _inputToken,
                _outputToken,
                _inputTokenSold,
                _minOutputTokenBought,
                _maxPrice
            );
    }

    function swapOutput(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal calldata _outputTokenBought,
        Decimal.decimal calldata _maxInputTokeSold,
        Decimal.decimal calldata _maxPrice
    ) external override returns (Decimal.decimal memory) {
        return
            implSwapOutput(
                _inputToken,
                _outputToken,
                _outputTokenBought,
                _maxInputTokeSold,
                _maxPrice
            );
    }

    function getInputPrice(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal calldata _inputTokenSold
    ) external view override returns (Decimal.decimal memory) {
        Decimal.decimal memory spotPrice = implGetSpotPrice(_inputToken, _outputToken);
        return _inputTokenSold.mulD(spotPrice);
    }

    function getOutputPrice(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal calldata _outputTokenBought
    ) external view override returns (Decimal.decimal memory) {
        Decimal.decimal memory spotPrice = implGetSpotPrice(_inputToken, _outputToken);
        return _outputTokenBought.divD(spotPrice);
    }

    function getSpotPrice(IERC20 _inputToken, IERC20 _outputToken)
        external
        view
        override
        returns (Decimal.decimal memory)
    {
        return implGetSpotPrice(_inputToken, _outputToken);
    }

    function approve(
        IERC20 _token,
        address _to,
        Decimal.decimal memory _amount
    ) public onlyOwner {
        _approve(_token, _to, _amount);
    }

    function setJoeRouter(address _joeRouter) public onlyOwner {
        joeRouter = IJoeRouter02(_joeRouter);
    }

    //
    // INTERNALS
    //

    function implSwapInput(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal memory _inputTokenSold,
        Decimal.decimal memory _minOutputTokenBought,
        Decimal.decimal memory _maxPrice
    ) internal returns (Decimal.decimal memory outTokenAmount) {
        address sender = _msgSender();

        //___0. transfer input token to exchangeWrapper
        _transferFrom(_inputToken, sender, address(this), _inputTokenSold);

        //___1. swap
        outTokenAmount = traderJoeSwapIn(
            _inputToken,
            _outputToken,
            _inputTokenSold,
            _minOutputTokenBought,
            _maxPrice
        );

        //___2. transfer back to sender
        _transfer(_outputToken, sender, outTokenAmount);
    }

    function implSwapOutput(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal memory _outputTokenBought,
        Decimal.decimal memory _maxInputTokenSold,
        Decimal.decimal memory _maxPrice
    ) internal returns (Decimal.decimal memory) {
        address sender = _msgSender();

        //___1. calc how much input tokens needed by given outTokenBought,
        Decimal.decimal memory expectedTokenInAmount = calcTraderJoeInGivenOut(
            address(_inputToken),
            address(_outputToken),
            _outputTokenBought
        );
        require(
            _maxInputTokenSold.cmp(expectedTokenInAmount) >= 0,
            "max input amount less than expected"
        );

        //___2 transfer input tokens to exchangeWrapper
        _transferFrom(_inputToken, sender, address(this), expectedTokenInAmount);

        //___3. swap
        Decimal.decimal memory requiredInAmount = traderJoeSwapOut(
            _inputToken,
            _outputToken,
            _outputTokenBought,
            expectedTokenInAmount,
            _maxPrice
        );

        emit ExchangeSwap(requiredInAmount.toUint(), _outputTokenBought.toUint());

        //___4. transfer back to sender
        _transfer(_outputToken, sender, _outputTokenBought);

        return requiredInAmount;
    }

    function traderJoeSwapIn(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal memory _inputTokenSold,
        Decimal.decimal memory _minOutputTokenBought,
        Decimal.decimal memory _maxPrice
    ) internal returns (Decimal.decimal memory) {
        address[] memory swapPath = new address[](2);
        swapPath[0] = address(_inputToken);
        swapPath[1] = address(_outputToken);

        // if max price is 0, set to (DEFAULT_MAX_PRICE_SLIPPAGE x spot price)
        if (_maxPrice.toUint() == 0) {
            uint256 spotPrice = getTraderJoeSpotPrice(swapPath);
            _maxPrice = Decimal.decimal(spotPrice).mulD(
                Decimal.decimal(DEFAULT_MAX_PRICE_SLIPPAGE)
            );
        }

        // if min output tokens are 0, set to (DEFAULT_MIN_OUTPUT x (input tokens x twap price))
        if (_minOutputTokenBought.toUint() == 0) {
            ITwapOracle twapOracle = twapOracles[
                keccak256(abi.encodePacked(address(_inputToken), address(_outputToken)))
            ];
            twapOracle.update();
            // price is in _outputToken decimal precision
            uint256 rawPrice = twapOracle.getTwapPrice();
            require(rawPrice != 0, "invalid twap price");

            Decimal.decimal memory priceMantissa = _toDecimal(_outputToken, rawPrice);
            Decimal.decimal memory tradeRange = Decimal.one().subD(
                Decimal.decimal(DEFAULT_TRADE_RANGE)
            );

            _minOutputTokenBought = tradeRange.mulD(_inputTokenSold).mulD(priceMantissa);
        }

        _approve(IERC20(_inputToken), address(joeRouter), _inputTokenSold);

        uint256 tokenSold = _toUint(_inputToken, _inputTokenSold);

        // swap

        // Max price check before swap
        uint256 spotPriceBefore = getTraderJoeSpotPrice(swapPath);
        require(spotPriceBefore <= _maxPrice.toUint(), "ERR_BAD_LIMIT_PRICE");

        uint256[] memory outputAmounts = joeRouter.swapExactTokensForTokens(
            tokenSold,
            _toUint(_outputToken, _minOutputTokenBought),
            swapPath,
            address(this),
            block.timestamp
        );
        uint256 outAmountInSelfDecimals = outputAmounts[1];

        // Max price check after swap
        uint256 spotPriceAfter = getTraderJoeSpotPrice(swapPath);
        require(spotPriceAfter <= _maxPrice.toUint(), "ERR_BAD_LIMIT_PRICE");

        require(outAmountInSelfDecimals > 0, "Balancer exchange error");
        emit TraderJoeSwap(tokenSold, outAmountInSelfDecimals);

        return _toDecimal(_outputToken, outAmountInSelfDecimals);
    }

    function traderJoeSwapOut(
        IERC20 _inputToken,
        IERC20 _outputToken,
        Decimal.decimal memory _outputTokenBought,
        Decimal.decimal memory _maxInputTokenSold,
        Decimal.decimal memory _maxPrice
    ) internal returns (Decimal.decimal memory tokenAmountIn) {
        address[] memory swapPath = new address[](2);
        swapPath[0] = address(_inputToken);
        swapPath[1] = address(_outputToken);

        // if max price is 0, set to (DEFAULT_MAX_PRICE_SLIPPAGE x spot price)
        if (_maxPrice.toUint() == 0) {
            uint256 spotPrice = getTraderJoeSpotPrice(swapPath);
            _maxPrice = Decimal.decimal(spotPrice).mulD(
                Decimal.decimal(DEFAULT_MAX_PRICE_SLIPPAGE)
            );
        }

        // if max input tokens are 0, set to (trade range x (input tokens x twap price))
        if (_maxInputTokenSold.toUint() == 0) {
            ITwapOracle twapOracle = twapOracles[
                keccak256(abi.encodePacked(address(_inputToken), address(_outputToken)))
            ];
            twapOracle.update();
            // price is in _outputToken decimal precision
            uint256 rawPrice = twapOracle.getTwapPrice();
            require(rawPrice != 0, "invalid twap price");

            Decimal.decimal memory priceMantissa = _toDecimal(_outputToken, rawPrice);
            Decimal.decimal memory tradeRange = Decimal.one().addD(
                Decimal.decimal(DEFAULT_TRADE_RANGE)
            );

            _maxInputTokenSold = tradeRange.mulD(_outputTokenBought).divD(priceMantissa);
        }

        _approve(IERC20(_inputToken), address(joeRouter), _maxInputTokenSold);

        // swap
        uint256 tokenBought = _toUint(_outputToken, _outputTokenBought);
        uint256 maxTokenSold = _toUint(_inputToken, _maxInputTokenSold);

        // Max price check before swap
        uint256 spotPriceBefore = getTraderJoeSpotPrice(swapPath);
        require(spotPriceBefore <= _maxPrice.toUint(), "ERR_BAD_LIMIT_PRICE");

        uint256[] memory inputAmounts = joeRouter.swapTokensForExactTokens(
            tokenBought,
            maxTokenSold,
            swapPath,
            address(this),
            block.timestamp
        );
        uint256 inAmountInSelfDecimals = inputAmounts[1];

        // Max price check after swap
        uint256 spotPriceAfter = getTraderJoeSpotPrice(swapPath);
        require(spotPriceAfter <= _maxPrice.toUint(), "ERR_BAD_LIMIT_PRICE");

        require(inAmountInSelfDecimals > 0, "Balancer exchange error");
        emit TraderJoeSwap(inAmountInSelfDecimals, tokenBought);

        return _toDecimal(_inputToken, inAmountInSelfDecimals);
    }

    function getTraderJoeSpotPrice(address[] memory path)
        internal
        view
        returns (uint256 spotPrice)
    {
        uint256[] memory amounts = joeRouter.getAmountsOut(1, path);
        spotPrice = amounts[1];
    }

    function calcTraderJoeInGivenOut(
        address _inToken,
        address _outToken,
        Decimal.decimal memory _givenOutAmount
    ) internal view returns (Decimal.decimal memory) {
        address[] memory swapPath = new address[](2);
        swapPath[0] = _inToken;
        swapPath[1] = _outToken;

        uint256 givenOut = _toUint(IERC20(_outToken), _givenOutAmount);

        uint256[] memory amounts = joeRouter.getAmountsIn(givenOut, swapPath);

        uint256 expectedTokenInAmount = amounts[1];
        return _toDecimal(IERC20(_inToken), expectedTokenInAmount);
    }

    function implGetSpotPrice(IERC20 _inputToken, IERC20 _outputToken)
        internal
        view
        returns (Decimal.decimal memory)
    {
        if (_inputToken == _outputToken) return Decimal.one();
        address[] memory swapPath = new address[](2);
        swapPath[0] = address(_inputToken);
        swapPath[1] = address(_outputToken);

        uint256 spotPrice = getTraderJoeSpotPrice(swapPath);

        // // the amount returned from getSpotPrice includes decimals difference between tokens.
        // // for example, input/output token pair, USDC(8 decimals)/PERP(18 decimals) and 2 USDC buy 1 PERP,
        // // it returns 0.5e-10*e18, in the other direction(PERP/USDC), it returns 2e10*e18
        Decimal.decimal memory price = Decimal.decimal(spotPrice);

        uint256 decimalsOfInput = _getTokenDecimals(address(_inputToken));
        uint256 decimalsOfOutput = _getTokenDecimals(address(_outputToken));
        if (decimalsOfInput < decimalsOfOutput) {
            price = _toDecimal(_inputToken, price.toUint());
        } else if (decimalsOfInput > decimalsOfOutput) {
            price = Decimal.decimal(_toUint(_outputToken, price));
        }

        return price;
    }
}
