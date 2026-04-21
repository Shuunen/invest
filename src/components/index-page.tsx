import { useState } from "react";
import { ErrorBoundary } from "./error-boundary.tsx";
import { IsinTable } from "./isin-table.tsx";

export function IndexPage() {
  const [errorKey, setErrorKey] = useState(0);
  return (
    <ErrorBoundary key={errorKey} onReset={() => setErrorKey(prevKey => prevKey + 1)}>
      <IsinTable />
    </ErrorBoundary>
  );
}
