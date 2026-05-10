import { render, screen } from "@testing-library/react";
import type { Allocation } from "../../schemas/index.ts";
import { AllocationChart } from "./allocation.tsx";

const emptyAllocation: Allocation = {};
const simpleAllocation: Allocation = { us: 0.6, europe: 0.4 };

describe("AllocationChart", () => {
  it("renders the card container with the given name testid", () => {
    expect.hasAssertions();
    render(<AllocationChart data={simpleAllocation} title="Sectors" name="sectors" />);
    expect(screen.getByTestId("sectors-card")).toBeInTheDocument();
  });

  it("shows empty state when allocation has no positive values", () => {
    expect.hasAssertions();
    render(<AllocationChart data={emptyAllocation} title="Geo" name="geo" />);
    expect(screen.getByTestId("geo-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("geo-chart")).not.toBeInTheDocument();
  });

  it("renders the pie chart when allocation has data", () => {
    expect.hasAssertions();
    render(<AllocationChart data={simpleAllocation} title="Geo" name="geo" />);
    expect(screen.queryByTestId("geo-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("geo-chart")).toBeInTheDocument();
  });

  it("renders title text", () => {
    expect.hasAssertions();
    render(<AllocationChart data={simpleAllocation} title="My Title" name="test" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("applies card class when card prop is true", () => {
    expect.hasAssertions();
    render(<AllocationChart data={simpleAllocation} title="Geo" name="geo" card />);
    const cardEl = screen.getByTestId("geo-card");
    expect(cardEl.className).toContain("card");
  });

  it("does not apply card class when card prop is false (default)", () => {
    expect.hasAssertions();
    render(<AllocationChart data={simpleAllocation} title="Geo" name="geo" />);
    const cardEl = screen.getByTestId("geo-card");
    expect(cardEl.className).not.toContain("card-body");
  });
});
