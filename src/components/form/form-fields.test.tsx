import { fireEvent, render, screen } from "@testing-library/react";
import { CheckboxField } from "./checkbox-field.tsx";
import { JsonTextarea } from "./json-textarea.tsx";

describe("CheckboxField", () => {
  it("renders label and checked state", () => {
    expect.hasAssertions();
    render(<CheckboxField label="Accumulating" name="isAccumulating" value onChange={() => undefined} />);
    expect(screen.getByLabelText(/accumulating/i)).toBeChecked();
  });

  it("calls onChange with toggled value when clicked", () => {
    expect.hasAssertions();
    const onChange = vi.fn<(value: boolean) => void>();
    render(<CheckboxField label="Accumulating" name="isAccumulating" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/accumulating/i));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("JsonTextarea", () => {
  it("renders without error by default", () => {
    expect.hasAssertions();
    render(<JsonTextarea label="Geo Allocation" name="geoAllocation" value="{}" onChange={() => undefined} />);
    expect(screen.getByLabelText(/geo allocation/i)).toBeInTheDocument();
    expect(screen.queryByRole("paragraph")).toBeNull();
  });

  it("renders error message and error class when error prop is set", () => {
    expect.hasAssertions();
    render(<JsonTextarea label="Geo Allocation" name="geoAllocation" value="bad" onChange={() => undefined} error="Invalid JSON" />);
    expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
    expect(screen.getByLabelText(/geo allocation/i).className).toContain("textarea-error");
  });

  it("calls onChange with textarea value", () => {
    expect.hasAssertions();
    const onChange = vi.fn<(value: string) => void>();
    render(<JsonTextarea label="Geo Allocation" name="geoAllocation" value="{}" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/geo allocation/i), { target: { value: '{"US":0.5}' } });
    expect(onChange).toHaveBeenCalledWith('{"US":0.5}');
  });
});
