import { columnVisibilityFeature, createSortedRowModel, metaHelper, rowSortingFeature, sortFn_alphanumeric, sortFn_basic, sortFn_datetime, sortFn_text, tableFeatures, type ColumnDef, type Table } from "@tanstack/react-table";
import type { Asset } from "../schemas/asset.ts";

export type AssetTableMeta = {
  isEditing?: boolean;
  noteMap?: Map<string, string>;
  onAmountChange?: (isin: string, amount: number) => void;
  onNoteChange?: (isin: string, note: string) => void;
  onPriceChange?: (isin: string, price: number) => void;
  onTargetAmountChange?: (isin: string, targetAmount: number) => void;
  onToggleSelect?: (isin: string) => void;
  selectedIsins?: Set<string>;
  amountMap?: Map<string, number>;
  amountUpdatedAtMap?: Map<string, string>;
  totalValue?: number;
  targetAmountMap?: Map<string, number>;
  targetAmountUpdatedAtMap?: Map<string, string>;
  targetTotalValue?: number;
};

type AssetColumnMeta = {
  center?: boolean;
  title?: string;
};

export const assetTableFeatures = tableFeatures({
  columnMeta: metaHelper<AssetColumnMeta>(),
  columnVisibilityFeature,
  rowSortingFeature,
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  sortedRowModel: createSortedRowModel(),
  tableMeta: metaHelper<AssetTableMeta>(),
});

export type AssetTableFeatures = typeof assetTableFeatures;

export type AssetColumnDef = ColumnDef<AssetTableFeatures, Asset>;

export type AssetTableInstance = Table<AssetTableFeatures, Asset>;
