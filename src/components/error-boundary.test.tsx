import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary.tsx";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("test explosion");
  return <div>Safe content</div>;
}

describe("ErrorBoundary - normal rendering", () => {
  it("renders children when no error", () => {
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
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/test explosion/)).toBeInTheDocument();
  });

  it("Retry button renders when onReset provided and calls it on click", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    const onReset = vi.fn<() => void>();
    render(
      <ErrorBoundary onReset={onReset}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    const btn = screen.getByRole("button", { name: /retry/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("Retry button absent when no onReset provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      /* suppress React error logs in test */
    });
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });
});
