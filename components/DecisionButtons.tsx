"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import { ErrorBox } from "./ui";

export function DecisionButtons({ proposalId, artistName }: { proposalId: string; artistName: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "declining">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!confirm(`Accept ${artistName}’s proposal? This fills the wall and declines the other responses.`)) return;
    setBusy(true);
    setError(null);
    try {
      await postJson(`/api/proposals/${proposalId}/accept`, {});
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function decline(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postJson(`/api/proposals/${proposalId}/decline`, { reason });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "declining") {
    return (
      <form onSubmit={decline} className="flex flex-col gap-2">
        <label htmlFor={`reason-${proposalId}`} className="label">
          Reason (optional, shown to the artist)
        </label>
        <textarea
          id={`reason-${proposalId}`}
          rows={2}
          maxLength={400}
          className="input"
          placeholder="e.g. Looking for something with more color."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <ErrorBox message={error} />
        <div className="flex gap-2">
          <button type="submit" className="btn-secondary text-rose-ink" disabled={busy}>
            {busy ? "Declining…" : "Confirm decline"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setMode("idle")} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ErrorBox message={error} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-sage" onClick={accept} disabled={busy}>
          {busy ? "Working…" : "Accept"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setMode("declining")} disabled={busy}>
          Decline
        </button>
      </div>
    </div>
  );
}
