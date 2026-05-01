import { render, screen } from "@testing-library/react";
import { renderSearchFilter } from "./asset-table-header.tsx";

function noop() {
  // intentionally empty — renderFilter callbacks are not under test here
}

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
