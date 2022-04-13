import { BigNumber } from "ethers";
import BN from "bignumber.js";

export const DEFAULT_TOKEN_DECIMALS = 18;
export const ONE_DAY = 60 * 60 * 24;

export type MixedDecimal = number | BigNumber | string;

export interface Decimal {
  d: MixedDecimal;
}

// noinspection JSMethodCanBeStatic
export function toFullDigit(val: number | string, decimals = DEFAULT_TOKEN_DECIMALS): BigNumber {
  const tokenDigit = new BN("10").exponentiatedBy(decimals);
  const bigNumber = new BN(val).multipliedBy(tokenDigit).toFixed(0);
  return BigNumber.from(bigNumber);
}

export function toFullDigitStr(val: number | string): string {
  return toFullDigit(val).toString();
}

export function toDecimal(val: number | string): Decimal {
  return { d: toFullDigit(val).toString() };
}

export function fromDecimal(val: Decimal, decimals = DEFAULT_TOKEN_DECIMALS): BigNumber {
  return BigNumber.from(val.d)
    .mul(BigNumber.from(10).pow(BigNumber.from(decimals)))
    .div(BigNumber.from(10).pow(BigNumber.from(DEFAULT_TOKEN_DECIMALS)));
}
