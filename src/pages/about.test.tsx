import { render, screen } from "@testing-library/react";
import { AboutPage } from "./about.tsx";

describe("AboutPage", () => {
  it("renders the app title", () => {
    expect.hasAssertions();
    render(<AboutPage />);
    expect(screen.getByTestId("page-title")).toBeInTheDocument();
  });

  it("renders the score formula", () => {
    expect.hasAssertions();
    render(<AboutPage />);
    expect(screen.getByTestId("score-formula")).toBeInTheDocument();
  });
});
