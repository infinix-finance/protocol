import { toFullDigit } from "../test/helper/number";

export const SELF_SERVE_RRP_BEACON_WHITELISTER = "0x04De82532FeE662877fdf7357Ef92D95B6bc1DfE"; // BEACON WHITELISTER on Goerli https://docs.api3.org/beacon/v0.1/reference/contract-addresses.html
export const QUOTE_ASSET_RESERVE = 10;
export const BASE_ASSET_RESERVE = 10;
export const TRADE_LIMIT_RATIO = 1;
export const FUNDING_PERIOD = 1;
export const PRICE_FEED_KEY = "0x4554482f55534400000000000000000000000000000000000000000000000000"; //ETH/USD
export const QUOTE_ASSET = "0x07865c6e87b9f70255377e024ace6630c1eaa37f"; // USDC on Goerli
// export const QUOTE_ASSET = "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"; // USDC on Avalanche
export const FLUNCTUATION_LIMIT_RATIO = 1;
export const TOLL_RATIO = 1;
export const SPREAD_RATIO = 1;
export const INIT_MARGIN_RATIO = 0;
export const MAINTENANCE_MARGIN_RATIO = 0;
export const LIQUIDATION_FEE_RATIO = 0;

export const IFNX_TOKEN = "0x5A8b3cea52d8B2bbccf73B195CAe88572617bc67"; // IFNX on Goerli
export const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router02 on Goerli

export const IFNX_INFLATION_RATE = toFullDigit(0.01); // 1%
export const IFNX_MINT_DURATION = 7 * 24 * 60 * 60; // 1 week
export const IFNX_DECAY_RATE = 0;

export const IFNX_VESTING_PERIOD = 0;
