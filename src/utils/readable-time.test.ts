import { nbMsInDay, nbMsInHour, nbMsInMinute, nbMsInMonth, nbMsInSecond, nbMsInYear } from "shuutils";
import { messages as en } from "../locales/en.ts";
import { messages as fr } from "../locales/fr.ts";
import { readableTime } from "./readable-time";
import { createTranslate } from "./translations.ts";

const translate = createTranslate(en);
const translateFr = createTranslate(fr);

describe("readableTime", () => {
  it("formats milliseconds from a numeric input", () => {
    expect.hasAssertions();
    expect(readableTime(500, translate)).toBe("500 milliseconds");
  });

  it("formats a single millisecond (singular)", () => {
    expect.hasAssertions();
    expect(readableTime(1, translate)).toBe("1 millisecond");
  });

  it("formats seconds", () => {
    expect.hasAssertions();
    expect(readableTime(5 * nbMsInSecond, translate)).toBe("5 seconds");
  });

  it("formats a single second (singular)", () => {
    expect.hasAssertions();
    expect(readableTime(nbMsInSecond, translate)).toBe("1 second");
  });

  it("formats minutes", () => {
    expect.hasAssertions();
    expect(readableTime(3 * nbMsInMinute, translate)).toBe("3 minutes");
  });

  it("formats hours", () => {
    expect.hasAssertions();
    expect(readableTime(2 * nbMsInHour, translate)).toBe("2 hours");
  });

  it("formats days", () => {
    expect.hasAssertions();
    expect(readableTime(4 * nbMsInDay, translate)).toBe("4 days");
  });

  it("formats months", () => {
    expect.hasAssertions();
    expect(readableTime(2 * nbMsInMonth, translate)).toBe("2 months");
  });

  it("formats years", () => {
    expect.hasAssertions();
    expect(readableTime(3 * nbMsInYear, translate)).toBe("3 years");
  });

  it("formats a Date input relative to now", () => {
    expect.hasAssertions();
    const past = new Date(Date.now() - 5 * nbMsInMinute);
    expect(readableTime(past, translate)).toBe("5 minutes");
  });

  it("formats short version for sub-day units when isLong is false", () => {
    expect.hasAssertions();
    expect(readableTime(500, translate, false)).toBe("500ms");
    expect(readableTime(5 * nbMsInSecond, translate, false)).toBe("5s");
    expect(readableTime(3 * nbMsInMinute, translate, false)).toBe("3min");
    expect(readableTime(2 * nbMsInHour, translate, false)).toBe("2h");
  });

  it("formats short version for day and above units when isLong is false", () => {
    expect.hasAssertions();
    expect(readableTime(3 * nbMsInDay, translate, false)).toBe("3d");
    expect(readableTime(2 * nbMsInMonth, translate, false)).toBe("2mon");
    expect(readableTime(3 * nbMsInYear, translate, false)).toBe("3y");
  });

  it("formats days in French", () => {
    expect.hasAssertions();
    expect(readableTime(4 * nbMsInDay, translateFr)).toBe("4 jours");
  });

  it("formats a single day in French (singular)", () => {
    expect.hasAssertions();
    expect(readableTime(nbMsInDay, translateFr)).toBe("1 jour");
  });

  it("formats short days in French", () => {
    expect.hasAssertions();
    expect(readableTime(3 * nbMsInDay, translateFr, false)).toBe("3j");
  });
});
