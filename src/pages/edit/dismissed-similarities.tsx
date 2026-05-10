import { invariant } from "es-toolkit";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Asset } from "../../schemas/index.ts";
import { UnDismissConfirmModal, type UnDismissConfirmState } from "./un-dismiss-confirm-modal.tsx";

type Props = {
  asset: Asset;
  allAssets: Asset[];
  onUnDismiss?: (isin: string, matchedIsin: string) => void;
};

export function DismissedSimilaritiesSection({ asset, allAssets, onUnDismiss }: Props) {
  const [confirm, setConfirm] = useState<UnDismissConfirmState>(undefined);

  if (asset.dismissedSimilarities.length === 0) return undefined;

  function handleConfirm() {
    /* v8 ignore next -- confirm modal cannot trigger confirm while state is undefined */
    if (!confirm) return;
    invariant(onUnDismiss, "onUnDismiss callback is required to un-dismiss similarities");
    onUnDismiss(confirm.isin, confirm.matchedIsin);
    setConfirm(undefined);
  }

  return (
    <>
      <div data-testid="dismissed-similarities-card" className="card">
        <div className="card-body">
          <h2 className="card-title">Dismissed similarities</h2>
          <ul className="list-inside list-disc">
            {asset.dismissedSimilarities.map(matchedIsin => {
              const matched = allAssets.find(ast => ast.isin === matchedIsin);
              const matchedName = matched?.name ?? matchedIsin;
              return (
                <li key={matchedIsin} data-testid={`dismissed-similarity-${matchedIsin.toLowerCase()}`} className="ml-1 text-sm">
                  {matchedName}
                  {onUnDismiss && (
                    <button
                      type="button"
                      data-testid={`un-dismiss-similarity-${matchedIsin.toLowerCase()}`}
                      className="btn text-error btn-ghost btn-xs"
                      aria-label={`Remove dismissed similarity with ${matchedName}`}
                      onClick={() => setConfirm({ isin: asset.isin, matchedIsin, matchedName })}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <UnDismissConfirmModal confirm={confirm} onClose={() => setConfirm(undefined)} onConfirm={handleConfirm} />
    </>
  );
}
