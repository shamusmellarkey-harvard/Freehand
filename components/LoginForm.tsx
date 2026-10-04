"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/client";
import type { Role } from "@/lib/types";
import { ErrorBox, Notice } from "./ui";

type Step = "email" | "code" | "profile";

export function LoginForm({ demoMode, next }: { demoMode: boolean; next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ demoCode?: string }>("/api/auth/request-code", { email });
      if (res.demoCode) {
        setDemoCode(res.demoCode);
        setCode(res.demoCode);
      }
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ status: "ok" | "new" }>("/api/auth/verify", { email, code });
      if (res.status === "ok") {
        router.push(next);
        router.refresh();
      } else {
        setStep("profile");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function completeProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Choose whether you are an artist or a business.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/auth/complete-profile", { name, role });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="hint">No password. We send a 6-digit code that expires in 10 minutes.</p>
        </div>
        <ErrorBox message={error} />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Send me a code"}
        </button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          We sent a code to <span className="font-medium text-ink">{email}</span>.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => setStep("email")}>
            Change
          </button>
        </p>
        {demoMode && demoCode && (
          <Notice>
            <span className="font-medium">Demo mode:</span> your code is{" "}
            <span className="font-mono text-base font-semibold tracking-widest">{demoCode}</span>. It has been filled in
            for you (no email is actually sent).
          </Notice>
        )}
        <div>
          <label htmlFor="code" className="label">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            className="input font-mono text-lg tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        <ErrorBox message={error} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Log in"}
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={requestCode}>
            Send a new code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={completeProfile} className="flex flex-col gap-4">
      <Notice tone="success">Email verified. Tell us a little about you to finish creating your account.</Notice>
      <div>
        <label htmlFor="name" className="label">
          Your name (or business name)
        </label>
        <input
          id="name"
          required
          minLength={2}
          maxLength={60}
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <fieldset>
        <legend className="label">I am…</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleOption value="ARTIST" current={role} onChange={setRole} title="an artist" body="I want to show my work on local walls." />
          <RoleOption value="BUSINESS" current={role} onChange={setRole} title="a business" body="I have a wall that needs art." />
        </div>
        <p className="hint">Your role cannot be changed later.</p>
      </fieldset>
      <ErrorBox message={error} />
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Creating account…" : "Finish"}
      </button>
    </form>
  );
}

function RoleOption({
  value,
  current,
  onChange,
  title,
  body,
}: {
  value: Role;
  current: Role | "";
  onChange: (r: Role) => void;
  title: string;
  body: string;
}) {
  const selected = current === value;
  return (
    <label
      className={`card cursor-pointer p-4 transition ${selected ? "border-terracotta ring-2 ring-terracotta/20" : "hover:border-ink/30"}`}
    >
      <input type="radio" name="role" value={value} checked={selected} onChange={() => onChange(value)} className="sr-only" />
      <span className="block font-medium">I’m {title}</span>
      <span className="block text-sm text-muted">{body}</span>
    </label>
  );
}
