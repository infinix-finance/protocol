import BNJS from "bignumber.js";
import BN from "bn.js";
import { BigNumber } from "ethers";

export const DEFAULT_TOKEN_DECIMALS = 18;
export const ONE_DAY = 60 * 60 * 24;

export type MixedDecimal = number | BigNumber | string;

export interface Decimal {
  d: MixedDecimal;
}

// noinspection JSMethodCanBeStatic
export function toFullDigit(val: number | string, decimals = DEFAULT_TOKEN_DECIMALS): BigNumber {
  const tokenDigit = new BNJS("10").exponentiatedBy(decimals);
  const bigNumber = new BNJS(val).multipliedBy(tokenDigit).toFixed(0);
  return BigNumber.from(new BN(bigNumber).toString());
}

export function toFullDigitStr(val: number | string): string {
  return toFullDigit(val).toString();
}

export function toDecimal(val: number | string, decimals = DEFAULT_TOKEN_DECIMALS): Decimal {
  return { d: toFullDigit(val, decimals).toString() };
}

export function fromDecimal(val: Decimal, decimals = DEFAULT_TOKEN_DECIMALS): BN {
  return new BN(val.d.toString())
    .mul(new BN(10).pow(new BN(decimals)))
    .div(new BN(10).pow(new BN(DEFAULT_TOKEN_DECIMALS)));
}
