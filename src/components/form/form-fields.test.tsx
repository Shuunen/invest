import { fireEvent, render, screen } from "@testing-library/react";
import { CheckboxField } from "./checkbox-field.tsx";
import { NumberField } from "./number-field.tsx";

describe("NumberField", () => {
  it("renders suffix when provided", () => {
    expect.hasAssertions();
    render(<NumberField label="Fee" name="fees" value="0.2" suffix="%" onChange={() => undefined} />);
    expect(screen.getByTestId("fees-suffix")).toBeInTheDocument();
  });

  it("does not render suffix when omitted", () => {
    expect.hasAssertions();
    render(<NumberField label="Fee" name="fees" value="0.2" onChange={() => undefined} />);
    expect(screen.queryByTestId("fees-suffix")).not.toBeInTheDocument();
  });

  it("applies horizontal layout classes when isHorizontal is true", () => {
    expect.hasAssertions();
    render(<NumberField label="Fee" name="fees" value="0.2" isHorizontal onChange={() => undefined} />);
    expect(screen.getByTestId("fees").closest(".form-control")).toHaveClass("flex");
  });

  it("does not apply horizontal layout classes by default", () => {
    expect.hasAssertions();
    render(<NumberField label="Fee" name="fees" value="0.2" onChange={() => undefined} />);
    expect(screen.getByTestId("fees").closest(".form-control")).not.toHaveClass("flex");
  });
});

describe("CheckboxField", () => {
  it("renders label and checked state", () => {
    expect.hasAssertions();
    render(<CheckboxField label="Accumulating" name="isAccumulating" value onChange={() => undefined} />);
    expect(screen.getByTestId("is-accumulating")).toBeChecked();
  });

  it("calls onChange with toggled value when clicked", () => {
    expect.hasAssertions();
    const onChange = vi.fn<(value: boolean) => void>();
    render(<CheckboxField label="Accumulating" name="isAccumulating" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("is-accumulating"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
