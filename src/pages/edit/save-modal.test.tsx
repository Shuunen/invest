import { render, screen } from "@testing-library/react";
import type { DiffRow } from "./form-diff.ts";
import { SaveModal } from "./save-modal.tsx";

const NO_DIFF_ROWS: DiffRow[] = [];

describe("SaveModal", () => {
  it("shows no-changes notice when diffRows is empty", () => {
    expect.hasAssertions();
    const onClose = vi.fn<() => void>();
    const onConfirm = vi.fn<() => void>();
    const onReset = vi.fn<() => void>();
    render(<SaveModal diffRows={NO_DIFF_ROWS} onClose={onClose} onConfirm={onConfirm} onReset={onReset} />);

    expect(screen.getByTestId("confirm-save-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-save-no-changes")).toBeInTheDocument();
  });
});
