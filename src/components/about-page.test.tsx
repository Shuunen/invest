import { render, screen } from "@testing-library/react";
import { AboutPage } from "./about-page.tsx";

describe("AboutPage", () => {
  it("renders the app title", () => {
    expect.hasAssertions();
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the score formula", () => {
    expect.hasAssertions();
    render(<AboutPage />);
    expect(screen.getByText(/score = perf3y/i)).toBeInTheDocument();
  });
});
