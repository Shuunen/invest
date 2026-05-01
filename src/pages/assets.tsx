import { useState } from "react";
import { AssetTable } from "../components/asset-table.tsx";
import { ErrorBoundary } from "../components/error-boundary.tsx";

export function IndexPage() {
  const [errorKey, setErrorKey] = useState(0);
  /* v8 ignore next -- requires a child component to throw during render to trigger; not unit-testable without mocking AssetTable */
  const handleReset = () => setErrorKey(prevKey => prevKey + 1);
  return (
    <ErrorBoundary key={errorKey} onReset={handleReset}>
      <AssetTable />
    </ErrorBoundary>
  );
}
