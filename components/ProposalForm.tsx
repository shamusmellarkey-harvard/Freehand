"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import { ImageUploader } from "./ImageUploader";
import { MaterialsBuilder, newRow, rowsToItems, type MaterialRow } from "./MaterialsBuilder";
import { ErrorBox } from "./ui";

export function ProposalForm({
  listingId,
  defaultWidth,
  defaultHeight,
  maxImageBytes,
}: {
  listingId: string;
  defaultWidth: number;
  defaultHeight: number;
  maxImageBytes: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    widthIn: String(defaultWidth),
    heightIn: String(defaultHeight),
  });
  const [rows, setRows] = useState<MaterialRow[]>([newRow()]);
  const [imageFileIds, setImageFileIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (imageFileIds.length === 0) {
      setError("Add at least one photo of your work (wait for uploads to finish).");
      return;
    }
    const materials = rowsToItems(rows).filter((m) => m.name);
    if (materials.length === 0) {
      setError("Add at least one material with a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/proposals", { listingId, ...form, imageFileIds, materials });
      router.push("/account?responded=1");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="title" className="label">
          Title of the piece
        </label>
        <input id="title" required minLength={2} maxLength={80} className="input" value={form.title} onChange={set("title")} />
      </div>
      <div>
        <label htmlFor="description" className="label">
          Describe what you would make
        </label>
        <textarea
          id="description"
          required
          minLength={10}
          maxLength={1200}
          rows={4}
          className="input"
          placeholder="Medium, colors, concept, how it hangs."
          value={form.description}
          onChange={set("description")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="widthIn" className="label">
            Width (inches)
          </label>
          <input id="widthIn" type="number" required min={1} max={600} inputMode="numeric" className="input" value={form.widthIn} onChange={set("widthIn")} />
        </div>
        <div>
          <label htmlFor="heightIn" className="label">
            Height (inches)
          </label>
          <input id="heightIn" type="number" required min={1} max={600} inputMode="numeric" className="input" value={form.heightIn} onChange={set("heightIn")} />
        </div>
      </div>

      <ImageUploader
        max={4}
        maxBytes={maxImageBytes}
        label="Photos of your work (1 to 4)"
        hint="Sketches, past work, or a mockup."
        onChange={setImageFileIds}
      />

      <MaterialsBuilder rows={rows} onChange={setRows} />

      <ErrorBox message={error} />
      <button type="submit" className="btn-primary self-start" disabled={busy}>
        {busy ? "Sending…" : "Send my response"}
      </button>
    </form>
  );
}
