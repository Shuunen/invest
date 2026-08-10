import { render, screen } from "@testing-library/react";
import { messages } from "../locales/en.ts";
import { createTranslate } from "../utils/translations.ts";
import { renderPresetFilters, renderSearchFilter } from "./asset-table-header.tsx";

function noop() {
  // intentionally empty — renderFilter callbacks are not under test here
}

const translate = createTranslate(messages);

describe("renderSearchFilter", () => {
  it("renders search input with placeholder", () => {
    expect.hasAssertions();
    render(renderSearchFilter("", noop));
    expect(screen.getByTestId("input-filter")).toBeInTheDocument();
  });

  it("reflects current filter value", () => {
    expect.hasAssertions();
    render(renderSearchFilter("IWDA", noop));
    const input = screen.getByTestId("input-filter") as HTMLInputElement;
    expect(input.value).toBe("IWDA");
  });
});

describe("renderPresetFilters", () => {
  it("renders inactive preset filter buttons by default", () => {
    expect.hasAssertions();
    render(renderPresetFilters({ onlyPea: false, scoreAbove50: false, setOnlyPea: noop, setScoreAbove50: noop, setWithRr5y: noop, withRr5y: false }, translate));
    expect(screen.getByTestId("filter-only-pea")).not.toHaveClass("btn-active");
    expect(screen.getByTestId("filter-with-rr5y")).not.toHaveClass("btn-active");
    expect(screen.getByTestId("filter-score-above-50")).not.toHaveClass("btn-active");
  });

  it("highlights active preset filter buttons", () => {
    expect.hasAssertions();
    render(renderPresetFilters({ onlyPea: true, scoreAbove50: true, setOnlyPea: noop, setScoreAbove50: noop, setWithRr5y: noop, withRr5y: true }, translate));
    expect(screen.getByTestId("filter-only-pea")).toHaveClass("btn-active");
    expect(screen.getByTestId("filter-with-rr5y")).toHaveClass("btn-active");
    expect(screen.getByTestId("filter-score-above-50")).toHaveClass("btn-active");
  });

  it("toggles onlyPea on click", () => {
    expect.hasAssertions();
    const setOnlyPea = vi.fn<(value: boolean) => void>();
    render(renderPresetFilters({ onlyPea: false, scoreAbove50: false, setOnlyPea, setScoreAbove50: noop, setWithRr5y: noop, withRr5y: false }, translate));
    screen.getByTestId("filter-only-pea").click();
    expect(setOnlyPea).toHaveBeenCalledWith(true);
  });

  it("toggles withRr5y on click", () => {
    expect.hasAssertions();
    const setWithRr5y = vi.fn<(value: boolean) => void>();
    render(renderPresetFilters({ onlyPea: false, scoreAbove50: false, setOnlyPea: noop, setScoreAbove50: noop, setWithRr5y, withRr5y: false }, translate));
    screen.getByTestId("filter-with-rr5y").click();
    expect(setWithRr5y).toHaveBeenCalledWith(true);
  });

  it("toggles scoreAbove50 on click", () => {
    expect.hasAssertions();
    const setScoreAbove50 = vi.fn<(value: boolean) => void>();
    render(renderPresetFilters({ onlyPea: false, scoreAbove50: false, setOnlyPea: noop, setScoreAbove50, setWithRr5y: noop, withRr5y: false }, translate));
    screen.getByTestId("filter-score-above-50").click();
    expect(setScoreAbove50).toHaveBeenCalledWith(true);
  });
});
