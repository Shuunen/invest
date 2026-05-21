import { fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { PieChart } from "./pie.tsx";

const emptyEntries: { fill: string; label: string; value: number }[] = [];

const testEntries = [
  { fill: "#0072B2", label: "US", value: 0.6 },
  { fill: "#E69F00", label: "EU", value: 0.4 },
];

const zeroEntries: { fill: string; label: string; value: number }[] = [{ fill: "#f00", label: "X", value: 0 }];

const singleEntry: { fill: string; label: string; value: number }[] = [{ fill: "#0072B2", label: "US", value: 1 }];

const singleLargeEntry: { fill: string; label: string; value: number }[] = [{ fill: "#0072B2", label: "US", value: 10 }];

const mixedEntries = [
  { fill: "#0072B2", label: "US", value: 0.95 },
  { fill: "#E69F00", label: "EU", value: 0.05 },
];

const zeroTotalWithLabelEntries = [
  { fill: "#0072B2", label: "US", value: 10 },
  { fill: "#E69F00", label: "EU", value: -10 },
];

describe("PieChart", () => {
  it("renders chart container with the given name", () => {
    expect.hasAssertions();
    render(<PieChart entries={testEntries} name="test" />);
    expect(screen.getByTestId("test-chart")).toBeInTheDocument();
  });

  it("renders with empty entries without crashing", () => {
    expect.hasAssertions();
    render(<PieChart entries={emptyEntries} name="test" />);
    expect(screen.getByTestId("test-chart")).toBeInTheDocument();
  });

  it("renders with all-zero values (total === 0) without crashing", () => {
    expect.hasAssertions();
    render(<PieChart entries={zeroEntries} name="zero" />);
    expect(screen.getByTestId("zero-chart")).toBeInTheDocument();
  });

  it("renders a full-circle slice when a single entry takes 100%", () => {
    expect.hasAssertions();
    render(<PieChart entries={singleEntry} name="single" />);
    expect(screen.getByTestId("single-chart")).toBeInTheDocument();
  });

  it("shows popover with label on slice hover and hides it on mouse leave", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="hover" />);
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
    render(<PieChart entries={singleEntry} name="full" />);
    fireEvent.mouseEnter(screen.getByTestId("slice-us"));
    expect(screen.queryByTestId("pie-popover")).toBeInTheDocument();
  });

  it("renders full-circle inner label when value meets threshold", () => {
    expect.hasAssertions();
    render(<PieChart entries={singleLargeEntry} name="full-label" />);
    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
  });

  it("hides inner labels below threshold while keeping hover popover", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="threshold" />);
    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
    expect(screen.queryByTestId("slice-label-eu")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId("slice-eu"));
    const popover = screen.getByTestId("pie-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent("EU");
  });

  it("uses bold text for hovered inner label", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="hover-label" />);
    fireEvent.mouseEnter(screen.getByTestId("slice-us"));
    expect(screen.getByTestId("slice-label-text-us")).toHaveAttribute("font-weight", "bold");
  });

  it("renders eligible inner labels when total is zero", () => {
    expect.hasAssertions();
    render(<PieChart entries={zeroTotalWithLabelEntries} name="zero-total-label" />);
    expect(screen.getByTestId("slice-label-us")).toBeInTheDocument();
  });

  it("updates popover position on mouse move", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="move" />);
    fireEvent.mouseEnter(screen.getByTestId("slice-eu"));
    const chart = screen.getByTestId("move-chart");
    const container = chart.parentElement;
    invariant(container, "Expected chart to have a parent container");
    fireEvent.mouseMove(container, { clientX: 100, clientY: 100 });
    const popover = screen.getByTestId("pie-popover");
    expect(popover).toBeInTheDocument();
    expect(popover.style.left).toBe("114px");
    expect(popover.style.top).toBe("114px");
  });

  it("handles mouse move when popover is not mounted", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="no-popover-yet" />);
    const chart = screen.getByTestId("no-popover-yet-chart");
    const container = chart.parentElement;
    invariant(container, "Expected chart to have a parent container");
    fireEvent.mouseMove(container, { clientX: 24, clientY: 36 });
    expect(screen.queryByTestId("pie-popover")).not.toBeInTheDocument();
  });

  it("clamps popover position to remain inside viewport", () => {
    expect.hasAssertions();
    render(<PieChart entries={mixedEntries} name="clamped" />);
    fireEvent.mouseEnter(screen.getByTestId("slice-us"));
    const chart = screen.getByTestId("clamped-chart");
    const container = chart.parentElement;
    invariant(container, "Expected chart to have a parent container");
    const popover = screen.getByTestId("pie-popover");
    // oxlint-disable-next-line id-length
    popover.getBoundingClientRect = () => ({ bottom: 80, height: 80, left: 0, right: 180, toJSON: () => ({}), top: 0, width: 180, x: 0, y: 0 }) as DOMRect;
    fireEvent.mouseMove(container, { clientX: window.innerWidth - 2, clientY: window.innerHeight - 2 });
    expect(popover.style.left).toBe(`${window.innerWidth - 180 - 14}px`);
    expect(popover.style.top).toBe(`${window.innerHeight - 80 - 14}px`);
  });
});
