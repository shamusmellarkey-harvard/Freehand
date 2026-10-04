"use client";

/** Small fetch helper for client components. Throws Error(message) on failure. */
export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body: fd });
  } catch {
    throw new Error("Upload failed. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; fileId?: string };
  if (!res.ok || !data.fileId) throw new Error(data.error || "Upload failed");
  return data.fileId;
}
