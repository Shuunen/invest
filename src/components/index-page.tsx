import { useState } from "react";
import { ErrorBoundary } from "./error-boundary.tsx";
import { IsinTable } from "./isin-table.tsx";

export function IndexPage() {
  const [errorKey, setErrorKey] = useState(0);
  /* v8 ignore next -- requires a child component to throw during render to trigger; not unit-testable without mocking IsinTable */
  const handleReset = () => setErrorKey(prevKey => prevKey + 1);
  return (
    <ErrorBoundary key={errorKey} onReset={handleReset}>
      <IsinTable />
    </ErrorBoundary>
  );
}
