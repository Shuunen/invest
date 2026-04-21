import { render, screen } from "@testing-library/react";
import { AboutPage } from "./about-page.tsx";

describe("AboutPage", () => {
  it("renders the app title", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the score formula", () => {
    render(<AboutPage />);
    expect(screen.getByText(/score = perf3y/i)).toBeInTheDocument();
  });
});
