"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import { ImageUploader } from "./ImageUploader";
import { ErrorBox } from "./ui";

export function ListingForm({ defaultBusinessName, maxImageBytes }: { defaultBusinessName: string; maxImageBytes: number }) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: defaultBusinessName,
    address: "",
    title: "",
    wallDescription: "",
    desiredWidthIn: "",
    desiredHeightIn: "",
    vibeDescription: "",
  });
  const [imageFileIds, setImageFileIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (imageFileIds.length === 0) {
      setError("Add at least one photo of the wall (wait for uploads to finish).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ id: string }>("/api/listings", { ...form, imageFileIds });
      router.push(`/listings/${res.id}?posted=1`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="businessName" className="label">
            Business name
          </label>
          <input id="businessName" required maxLength={60} className="input" value={form.businessName} onChange={set("businessName")} />
        </div>
        <div>
          <label htmlFor="address" className="label">
            Address
          </label>
          <input
            id="address"
            required
            minLength={5}
            maxLength={160}
            className="input"
            placeholder="Street, city, MA"
            value={form.address}
            onChange={set("address")}
          />
          <p className="hint">Shown publicly so artists know where the wall is.</p>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          required
          minLength={3}
          maxLength={80}
          className="input"
          placeholder="e.g. Big blank wall behind the counter"
          value={form.title}
          onChange={set("title")}
        />
      </div>

      <div>
        <label htmlFor="wallDescription" className="label">
          Describe the wall
        </label>
        <textarea
          id="wallDescription"
          required
          minLength={10}
          maxLength={1200}
          rows={4}
          className="input"
          placeholder="Where is it, what is it made of, how is the light, how will the piece hang?"
          value={form.wallDescription}
          onChange={set("wallDescription")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="desiredWidthIn" className="label">
            Desired width (inches)
          </label>
          <input
            id="desiredWidthIn"
            type="number"
            required
            min={1}
            max={600}
            inputMode="numeric"
            className="input"
            value={form.desiredWidthIn}
            onChange={set("desiredWidthIn")}
          />
        </div>
        <div>
          <label htmlFor="desiredHeightIn" className="label">
            Desired height (inches)
          </label>
          <input
            id="desiredHeightIn"
            type="number"
            required
            min={1}
            max={600}
            inputMode="numeric"
            className="input"
            value={form.desiredHeightIn}
            onChange={set("desiredHeightIn")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="vibeDescription" className="label">
          What vibe are you going for?
        </label>
        <textarea
          id="vibeDescription"
          required
          minLength={3}
          maxLength={1200}
          rows={3}
          className="input"
          placeholder="Colors, mood, subjects you love (or want to avoid)."
          value={form.vibeDescription}
          onChange={set("vibeDescription")}
        />
      </div>

      <ImageUploader max={3} maxBytes={maxImageBytes} label="Wall photos (1 to 3)" onChange={setImageFileIds} />

      <ErrorBox message={error} />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Posting…" : "Post this wall"}
        </button>
      </div>
    </form>
  );
}
