import { fireEvent, render, screen } from "@testing-library/react";
import type { DiffRow } from "./form-diff.ts";
import { SaveModal } from "./save-modal.tsx";

const noDiffRows: DiffRow[] = [];
const noopReset: DiffRow["reset"] = currentForm => currentForm;

describe("SaveModal", () => {
  it("shows no-changes notice when diffRows is empty", () => {
    expect.hasAssertions();
    const onClose = vi.fn<() => void>();
    const onConfirm = vi.fn<() => void>();
    const onReset = vi.fn<() => void>();
    render(<SaveModal diffRows={noDiffRows} onClose={onClose} onConfirm={onConfirm} onReset={onReset} />);

    expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-save-no-changes")).toBeInTheDocument();
  });

  it("shows after-column trend indicators for numeric rows", () => {
    expect.hasAssertions();
    const onClose = vi.fn<() => void>();
    const onConfirm = vi.fn<() => void>();
    const onReset = vi.fn<() => void>();
    const diffRows: DiffRow[] = [
      { after: "0.4", before: "0.2", field: "Fees (%)", reset: noopReset },
      { after: "No", before: "Yes", field: "Accumulating", reset: noopReset },
    ];

    render(<SaveModal diffRows={diffRows} onClose={onClose} onConfirm={onConfirm} onReset={onReset} />);

    expect(screen.getByTestId("after-trend-fees")).toBeInTheDocument();
    expect(screen.queryByTestId("after-trend-accumulating")).not.toBeInTheDocument();
  });

  it("does not render a trend indicator when a numeric value is malformed", () => {
    expect.hasAssertions();
    const onClose = vi.fn<() => void>();
    const onConfirm = vi.fn<() => void>();
    const onReset = vi.fn<() => void>();
    const diffRows: DiffRow[] = [{ after: "2", before: "1.2.3", field: "Price (EUR)", reset: noopReset }];

    render(<SaveModal diffRows={diffRows} onClose={onClose} onConfirm={onConfirm} onReset={onReset} />);

    expect(screen.queryByTestId("after-trend-price-eur")).not.toBeInTheDocument();
  });

  it("calls row reset callback when a row reset button is clicked", () => {
    expect.hasAssertions();
    const onClose = vi.fn<() => void>();
    const onConfirm = vi.fn<() => void>();
    const onReset = vi.fn<() => void>();
    const onResetRow = vi.fn<(row: DiffRow) => void>();
    const diffRows: DiffRow[] = [{ after: "Updated ETF", before: "Test ETF", field: "Name", reset: noopReset }];

    render(<SaveModal diffRows={diffRows} onClose={onClose} onConfirm={onConfirm} onReset={onReset} onResetRow={onResetRow} />);

    fireEvent.click(screen.getByTestId("reset-row-name"));

    expect(onResetRow).toHaveBeenCalledWith(diffRows[0]);
  });
});
