import { render, screen } from "@testing-library/react";
import { TranslationProvider } from "../../utils/translations-provider.tsx";
import { FormActions } from "./actions.tsx";

describe("FormActions", () => {
  it("renders default confirm text when confirmText is not provided", () => {
    expect.hasAssertions();
    render(<FormActions onCancel={vi.fn<() => void>()} />, { wrapper: TranslationProvider });
    expect(screen.getByTestId("form-confirm-button")).toHaveTextContent("Confirm");
  });

  it("renders custom confirmText when provided", () => {
    expect.hasAssertions();
    render(<FormActions onCancel={vi.fn<() => void>()} confirmText="Save" />, { wrapper: TranslationProvider });
    expect(screen.getByTestId("form-confirm-button")).toHaveTextContent("Save");
  });

  it("renders reset button only when onReset is provided", () => {
    expect.hasAssertions();
    render(<FormActions onCancel={vi.fn<() => void>()} onReset={vi.fn<() => void>()} />, { wrapper: TranslationProvider });
    expect(screen.getByTestId("form-reset-button")).toHaveTextContent("Reset");
  });

  it("does not render reset button when onReset is not provided", () => {
    expect.hasAssertions();
    render(<FormActions onCancel={vi.fn<() => void>()} />, { wrapper: TranslationProvider });
    expect(screen.queryByTestId("form-reset-button")).not.toBeInTheDocument();
  });
});
