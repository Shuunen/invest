import { RefreshCw } from "lucide-react";
import { TextField } from "../../components/form/text-field.tsx";
import { useTranslation } from "../../utils/translations.ts";

type Props = {
  fetchError: string | undefined;
  isin: string;
  isinError?: string;
  isFetching: boolean;
  onFetch: () => void;
  onIsinChange: (value: string) => void;
};

export function IsinFetchRow({ fetchError, isin, isinError, isFetching, onFetch, onIsinChange }: Props) {
  const { translate } = useTranslation();
  return (
    <div className="mt-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField label="ISIN" name="isin" value={isin} onChange={onIsinChange} placeholder="e.g. IE00B4L5Y983" />
        </div>
        <button type="button" data-testid="fetch-etf-button" className="btn btn-outline btn-sm" disabled={isin.trim() === "" || isFetching} onClick={onFetch}>
          {isFetching ? <span className="loading loading-xs loading-spinner" data-testid="fetch-spinner" /> : <RefreshCw size={14} />}
          {translate("action-fetch")}
        </button>
      </div>
      {isinError && (
        <p className="field-error" data-testid="isin-error">
          {isinError}
        </p>
      )}
      {fetchError && (
        <p className="field-error" data-testid="fetch-error">
          {fetchError}
        </p>
      )}
    </div>
  );
}
