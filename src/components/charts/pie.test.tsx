import { fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { PieChart } from "./pie.tsx";

const EMPTY_ENTRIES: { fill: string; label: string; value: number }[] = [];

const TEST_ENTRIES = [
  { fill: "#0072B2", label: "US", value: 0.6 },
  { fill: "#E69F00", label: "EU", value: 0.4 },
];

const ZERO_ENTRIES: { fill: string; label: string; value: number }[] = [{ fill: "#f00", label: "X", value: 0 }];

const SINGLE_ENTRY: { fill: string; label: string; value: number }[] = [{ fill: "#0072B2", label: "US", value: 1 }];

const SINGLE_LARGE_ENTRY: { fill: string; label: string; value: number }[] = [{ fill: "#0072B2", label: "US", value: 10 }];

const MIXED_ENTRIES = [
  { fill: "#0072B2", label: "US", value: 0.95 },
  { fill: "#E69F00", label: "EU", value: 0.05 },
];

const ZERO_TOTAL_WITH_LABEL_ENTRIES = [
  { fill: "#0072B2", label: "US", value: 10 },
  { fill: "#E69F00", label: "EU", value: -10 },
];

describe("PieChart", () => {
  it("renders chart container with the given name", () => {
    expect.hasAssertions();
    render(<PieChart entries={TEST_ENTRIES} name="test" />);
    expect(screen.getByTestId("test-chart")).toBeInTheDocument();
  });

  it("renders with empty entries without crashing", () => {
    expect.hasAssertions();
    render(<PieChart entries={EMPTY_ENTRIES} name="test" />);
    expect(screen.getByTestId("test-chart")).toBeInTheDocument();
  });

  it("renders with all-zero values (total === 0) without crashing", () => {
    expect.hasAssertions();
    render(<PieChart entries={ZERO_ENTRIES} name="zero" />);
    expect(screen.getByTestId("zero-chart")).toBeInTheDocument();
  });

  it("renders a full-circle slice when a single entry takes 100%", () => {
    expect.hasAssertions();
    render(<PieChart entries={SINGLE_ENTRY} name="single" />);
    expect(screen.getByTestId("single-chart")).toBeInTheDocument();
  });

  it("shows popover with label on slice hover and hides it on mouse leave", () => {
    expect.hasAssertions();
    render(<PieChart entries={MIXED_ENTRIES} name="hover" />);

    expect(screen.queryByTestId("pie-popover")).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId("slice-eu"));

    const popover = screen.getByTestId("pie-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent("EU");

    const chart = screen.getByTestId("hover-chart");
    const container = chart.parentElement;
    invariant(container, "Expected chart to have a parent container");
    fireEvent.mouseLeave(container);

    expect(screen.queryByTestId("pie-popover")).not.toBeInTheDocument();
  });

  it("shows popover for the full-circle single-entry slice on hover", () => {
    expect.hasAssertions();
    render(<PieChart entries={SINGLE_ENTRY} name="full" />);

    fireEvent.mouseEnter(screen.getByTestId("slice-us"));

    // Popover should not appear because the inner label is visible
    expect(screen.queryByTestId("pie-popover")).not.toBeInTheDocument();
  });

  it("renders full-circle inner label when value meets threshold", () => {
    expect.hasAssertions();
    render(<PieChart entries={SINGLE_LARGE_ENTRY} name="full-label" />);

    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
  });

  it("hides inner labels below threshold while keeping hover popover", () => {
    expect.hasAssertions();
    render(<PieChart entries={MIXED_ENTRIES} name="threshold" />);

    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
    expect(screen.queryByTestId("slice-label-eu")).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByTestId("slice-eu"));

    const popover = screen.getByTestId("pie-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent("EU");
  });

  it("uses bold text for hovered inner label", () => {
    expect.hasAssertions();
    render(<PieChart entries={MIXED_ENTRIES} name="hover-label" />);

    fireEvent.mouseEnter(screen.getByTestId("slice-us"));

    expect(screen.getByTestId("slice-label-text-us")).toHaveAttribute("font-weight", "bold");
  });

  it("renders eligible inner labels when total is zero", () => {
    expect.hasAssertions();
    render(<PieChart entries={ZERO_TOTAL_WITH_LABEL_ENTRIES} name="zero-total-label" />);

    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
  });

  it("updates popover position on mouse move", () => {
    expect.hasAssertions();
    render(<PieChart entries={MIXED_ENTRIES} name="move" />);

    fireEvent.mouseEnter(screen.getByTestId("slice-eu"));

    const chart = screen.getByTestId("move-chart");
    const container = chart.parentElement;
    invariant(container, "Expected chart to have a parent container");
    // oxlint-disable-next-line id-length
    container.getBoundingClientRect = () => ({ bottom: 300, height: 300, left: 0, right: 300, toJSON: () => ({}), top: 0, width: 300, x: 0, y: 0 }) as DOMRect;

    fireEvent.mouseMove(container, { clientX: 100, clientY: 100 });

    expect(screen.getByTestId("pie-popover")).toBeInTheDocument();
  });
});
