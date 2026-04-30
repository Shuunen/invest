import { render, screen } from "@testing-library/react";
import { renderSearchFilter } from "./asset-table-header.tsx";

function noop() {
  // intentionally empty — renderFilter callbacks are not under test here
}

describe("renderSearchFilter", () => {
  it("renders search input with placeholder", () => {
    expect.hasAssertions();
    render(renderSearchFilter("", noop));
    expect(screen.getByPlaceholderText("Search ISIN, name, tickers…")).toBeInTheDocument();
  });

  it("reflects current filter value", () => {
    expect.hasAssertions();
    render(renderSearchFilter("IWDA", noop));
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.value).toBe("IWDA");
  });
});
