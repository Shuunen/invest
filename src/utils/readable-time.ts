import { nbMsInDay, nbMsInHour, nbMsInMinute, nbMsInMonth, nbMsInSecond, nbMsInYear } from "shuutils";
import type { Translate } from "./translations.ts";

function countParam(value: number) {
  return { count: Math.floor(value) };
}

/**
 * Make a date readable for us, poor humans
 * @param input a date or a number of milliseconds
 * @param translate the translation function from useTranslation
 * @param isLong true to return a long version like "3 days" instead of "3d"
 * @returns "1 minute", "4 months" or "1min", "4mon"
 * @example readableTime(3 * nbMsInDay, translate) // "3 days"
 * @example readableTime(3 * nbMsInDay, translate, false) // "3d"
 */
export function readableTime(input: number | Readonly<Date>, translate: Translate, isLong = true) {
  const ms = typeof input === "number" ? input : Date.now() - input.getTime();
  if (ms < nbMsInSecond) return isLong ? translate("time-millisecond", countParam(ms)) : translate("time-millisecond-short", countParam(ms));
  if (ms < nbMsInMinute) return isLong ? translate("time-second", countParam(ms / nbMsInSecond)) : translate("time-second-short", countParam(ms / nbMsInSecond));
  if (ms < nbMsInHour) return isLong ? translate("time-minute", countParam(ms / nbMsInMinute)) : translate("time-minute-short", countParam(ms / nbMsInMinute));
  if (ms < nbMsInDay) return isLong ? translate("time-hour", countParam(ms / nbMsInHour)) : translate("time-hour-short", countParam(ms / nbMsInHour));
  if (ms < nbMsInMonth) return isLong ? translate("time-day", countParam(ms / nbMsInDay)) : translate("time-day-short", countParam(ms / nbMsInDay));
  if (ms < nbMsInYear) return isLong ? translate("time-month", countParam(ms / nbMsInMonth)) : translate("time-month-short", countParam(ms / nbMsInMonth));
  return isLong ? translate("time-year", countParam(ms / nbMsInYear)) : translate("time-year-short", countParam(ms / nbMsInYear));
}
