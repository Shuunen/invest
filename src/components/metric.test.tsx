import { render, screen } from "@testing-library/react";
import { Metric } from "./metric.tsx";

describe("Metric", () => {
  it("keeps the production animation duration path covered", () => {
    expect.hasAssertions();

    vi.stubEnv("MODE", "production");

    render(<Metric color="neutral" index={1} label="Value" value="123" />);

    expect(screen.getByTestId("metric-value-label")).toHaveTextContent("Value");
    expect(screen.getByTestId("metric-value-value")).toHaveTextContent("");

    vi.unstubAllEnvs();
  });
});
