const maxValueForDecimals = 10;

const emptyValue = "—";

export const maxDecimals = 2;

export function formatNumber(val: number | undefined): string {
  if (val === undefined) return emptyValue;
  if (Math.abs(val) === 0) return "0";
  if (Math.abs(val) < maxValueForDecimals) return val.toFixed(maxDecimals);
  return Math.round(val).toString();
}

export function formatPrice(val: number | undefined): string {
  return val === undefined ? emptyValue : `${formatNumber(val)} €`;
}

export function formatPercent(val: number | undefined): string {
  return val === undefined ? emptyValue : `${formatNumber(val)} %`;
}
