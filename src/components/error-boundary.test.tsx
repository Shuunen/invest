import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary.tsx";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("test explosion");
  return <div>Safe content</div>;
}

describe("ErrorBoundary - normal rendering", () => {
  it("renders children when no error", () => {
    expect.hasAssertions();
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
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
    expect(screen.getByTestId("error-alert")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
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
    expect(btn).toBeInTheDocument();
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
