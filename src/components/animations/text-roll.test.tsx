import { render, screen } from "@testing-library/react";
import { TextRoll } from "./text-roll.tsx";

describe("TextRoll", () => {
  it("renders text and custom classes with default delay mode", () => {
    expect.hasAssertions();
    render(
      <span data-testid="text-roll-default" className="text-success">
        <TextRoll>AB</TextRoll>
      </span>,
    );

    const roll = screen.getByTestId("text-roll-default");
    expect(roll).toHaveClass("text-success");
    expect(roll).toHaveTextContent("ABAB");
  });

  it("renders centered mode to exercise centered delay branch", () => {
    expect.hasAssertions();
    render(
      <span data-testid="text-roll-centered">
        <TextRoll center>XYZ</TextRoll>
      </span>,
    );

    expect(screen.getByTestId("text-roll-centered")).toHaveTextContent("XYZXYZ");
  });
});
