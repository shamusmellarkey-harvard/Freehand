"use client";

import { useEffect, useRef, useState } from "react";
import { uploadImage } from "@/lib/client";

interface Item {
  localId: string;
  previewUrl: string;
  fileId?: string;
  error?: string;
  uploading: boolean;
}

export function ImageUploader({
  max,
  maxBytes,
  label,
  hint,
  onChange,
}: {
  max: number;
  maxBytes: number;
  label: string;
  hint?: string;
  onChange: (fileIds: string[]) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    onChange(items.filter((i) => i.fileId).map((i) => i.fileId as string));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const snapshot = itemsRef;
    return () => snapshot.current.forEach((i) => URL.revokeObjectURL(i.previewUrl));
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const room = max - items.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (inputRef.current) inputRef.current.value = "";
    for (const file of picked) {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      const tooBig = file.size > maxBytes;
      setItems((prev) => [
        ...prev,
        {
          localId,
          previewUrl,
          uploading: !tooBig,
          error: tooBig ? `Too large (max ${Math.round(maxBytes / (1024 * 1024))} MB)` : undefined,
        },
      ]);
      if (tooBig) continue;
      try {
        const fileId = await uploadImage(file);
        setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, fileId, uploading: false } : i)));
      } catch (err) {
        setItems((prev) =>
          prev.map((i) => (i.localId === localId ? { ...i, uploading: false, error: (err as Error).message } : i)),
        );
      }
    }
  }

  function remove(localId: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  }

  const inputId = `uploader-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const full = items.length >= max;

  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {items.map((item, idx) => (
          <div key={item.localId} className="relative h-28 w-28 overflow-hidden rounded-xl border border-line bg-line/40">
            <img src={item.previewUrl} alt={`Selected image ${idx + 1}`} className="h-full w-full object-cover" />
            {item.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium">Uploading…</div>
            )}
            {item.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-rose-soft/95 p-1 text-center text-[11px] leading-tight text-rose-ink">
                {item.error}
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(item.localId)}
              aria-label={`Remove image ${idx + 1}`}
              className="absolute right-1 top-1 rounded-full bg-ink/80 px-1.5 text-xs text-white hover:bg-ink"
            >
              ✕
            </button>
          </div>
        ))}
        {!full && (
          <label
            htmlFor={inputId}
            className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-ink/30 bg-white text-center text-xs text-muted hover:border-terracotta hover:text-terracotta"
          >
            <span className="text-2xl leading-none">+</span>
            <span>Add photo</span>
          </label>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={full}
      />
      <p className="hint">
        {hint ?? `JPEG, PNG, or WebP, up to ${Math.round(maxBytes / (1024 * 1024))} MB each.`} {items.length}/{max} added.
      </p>
    </div>
  );
}
