import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary.tsx";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("test explosion");
  return <div data-testid="safe-content">Safe content</div>;
}

describe("ErrorBoundary - normal rendering", () => {
  it("renders children when no error", () => {
    expect.hasAssertions();
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("safe-content")).toHaveTextContent("Safe content");
  });
});

describe("ErrorBoundary - error state", () => {
  it("renders error UI when child throws", () => {
    expect.hasAssertions();
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("error-alert")).toHaveTextContent("Something went wrong: test explosion");
    expect(screen.getByTestId("error-message")).toHaveTextContent("Something went wrong: test explosion");
  });

  it("Retry button renders when onReset provided and calls it on click", () => {
    expect.hasAssertions();
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    const onReset = vi.fn<() => void>();
    render(
      <ErrorBoundary onReset={onReset}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    const btn = screen.getByTestId("retry-button");
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("Retry button absent when no onReset provided", () => {
    expect.hasAssertions();
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
  });
});
