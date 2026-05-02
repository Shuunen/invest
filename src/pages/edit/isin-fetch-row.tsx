import { RefreshCw } from "lucide-react";
import { TextField } from "../../components/form/text-field.tsx";
import { ISIN_REGEX } from "../../schemas/index.ts";

type Props = {
  fetchError: string | undefined;
  isin: string;
  isinError?: string;
  isFetching: boolean;
  onFetch: () => void;
  onIsinChange?: (value: string) => void;
  readOnly?: boolean;
};

export function IsinFetchRow({ fetchError, isin, isinError, isFetching, onFetch, onIsinChange, readOnly }: Props) {
  return (
    <div className="mt-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField label="ISIN" name="isin" value={isin} onChange={onIsinChange ?? (() => undefined)} readOnly={readOnly} placeholder={readOnly ? undefined : "e.g. IE00B4L5Y983"} />
        </div>
        <button type="button" data-testid="fetch-etf-button" className="btn btn-outline btn-sm" disabled={(!readOnly && !ISIN_REGEX.test(isin)) || isFetching} onClick={onFetch}>
          {isFetching ? <span className="loading loading-xs loading-spinner" data-testid="fetch-spinner" /> : <RefreshCw size={14} />}
          Fetch
        </button>
      </div>
      {isinError && (
        <p className="mt-1 text-xs text-error" data-testid="isin-error">
          {isinError}
        </p>
      )}
      {fetchError !== undefined && (
        <p className="mt-1 text-xs text-error" data-testid="fetch-error">
          {fetchError}
        </p>
      )}
    </div>
  );
}
