import { fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { CheckboxField } from "./checkbox-field.tsx";
import { JsonTextarea } from "./json-textarea.tsx";
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

describe("JsonTextarea", () => {
  it("renders without error by default", () => {
    expect.hasAssertions();
    render(<JsonTextarea name="geo-allocation" value="{}" onChange={() => undefined} />);
    expect(screen.getByTestId("json-textarea-geo-allocation")).toBeInTheDocument();
    expect(screen.queryByTestId("json-textarea-geo-allocation-error")).not.toBeInTheDocument();
  });

  it("renders error message and error class when error prop is set", () => {
    expect.hasAssertions();
    render(<JsonTextarea name="geo-allocation" value="bad" onChange={() => undefined} error="Invalid JSON" />);
    expect(screen.getByTestId("json-textarea-geo-allocation-error")).toHaveTextContent("Invalid JSON");
    expect(screen.getByTestId("json-textarea-geo-allocation")).toHaveClass("textarea-error");
  });

  it("calls onChange with textarea value", () => {
    expect.hasAssertions();
    const onChange = vi.fn<(value: string) => void>();
    render(<JsonTextarea name="geo-allocation" value="{}" onChange={onChange} />);
    const textarea = screen.getByTestId("json-textarea-geo-allocation");
    invariant(textarea, "Expected textarea to be in the document");
    fireEvent.change(textarea, { target: { value: '{"US":0.5}' } });
    expect(onChange).toHaveBeenCalledWith('{"US":0.5}');
  });
});
