"use client";

import { dollarsToCents, formatCents, lineTotalCents, materialsTotalCents } from "@/lib/materials";
import type { MaterialItem } from "@/lib/types";

export interface MaterialRow {
  key: string;
  name: string;
  quantity: string;
  unitCostDollars: string;
}

export function rowsToItems(rows: MaterialRow[]): MaterialItem[] {
  return rows.map((r) => ({
    name: r.name.trim(),
    quantity: Number(r.quantity) || 0,
    unitCostCents: dollarsToCents(r.unitCostDollars),
  }));
}

export function newRow(): MaterialRow {
  return { key: Math.random().toString(36).slice(2), name: "", quantity: "1", unitCostDollars: "" };
}

export function MaterialsBuilder({ rows, onChange }: { rows: MaterialRow[]; onChange: (rows: MaterialRow[]) => void }) {
  const items = rowsToItems(rows);
  const total = materialsTotalCents(items);

  function update(key: string, patch: Partial<MaterialRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <fieldset className="card p-4">
      <legend className="px-1 text-sm font-medium">Materials estimate</legend>
      <p className="mb-3 text-xs text-muted">
        List what you need to make the piece. The business reimburses only these materials, off-platform. Freehand never
        handles money.
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <div key={row.key} className="grid grid-cols-[1fr_4.5rem_6rem_auto] items-end gap-2 sm:grid-cols-[1fr_5rem_7rem_6rem_auto]">
            <div>
              <label htmlFor={`m-name-${row.key}`} className="label text-xs">
                Item
              </label>
              <input
                id={`m-name-${row.key}`}
                className="input py-1.5 text-sm"
                placeholder="e.g. 24x36 canvas"
                maxLength={60}
                value={row.name}
                onChange={(e) => update(row.key, { name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`m-qty-${row.key}`} className="label text-xs">
                Qty
              </label>
              <input
                id={`m-qty-${row.key}`}
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                className="input py-1.5 text-sm"
                value={row.quantity}
                onChange={(e) => update(row.key, { quantity: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`m-cost-${row.key}`} className="label text-xs">
                Unit cost ($)
              </label>
              <input
                id={`m-cost-${row.key}`}
                inputMode="decimal"
                className="input py-1.5 text-sm"
                placeholder="0.00"
                value={row.unitCostDollars}
                onChange={(e) => update(row.key, { unitCostDollars: e.target.value })}
              />
            </div>
            <div className="hidden text-right text-sm sm:block">
              <span className="label text-xs">Line</span>
              <span className="block py-1.5 tabular-nums">{formatCents(lineTotalCents(items[idx]))}</span>
            </div>
            <button
              type="button"
              onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
              disabled={rows.length === 1}
              aria-label={`Remove material row ${idx + 1}`}
              className="btn-ghost h-9 w-9 px-0 text-muted"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={() => onChange([...rows, newRow()])} disabled={rows.length >= 25}>
          + Add material
        </button>
        <p className="text-sm">
          <span className="text-muted">Estimated total:</span>{" "}
          <span className="font-display text-xl font-semibold tabular-nums" aria-live="polite">
            {formatCents(total)}
          </span>
        </p>
      </div>
    </fieldset>
  );
}
