import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AcceptError } from "@/lib/accept";
import { ProposalError } from "@/lib/db";
import { firstIssue } from "@/lib/schemas";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Wraps a route handler, converting known errors into clean JSON responses. */
export function handle<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message);
      if (err instanceof ZodError) return jsonError(400, firstIssue(err));
      if (err instanceof AcceptError || err instanceof ProposalError) return jsonError(409, err.message);
      if (err instanceof SyntaxError) return jsonError(400, "Malformed request body");
      console.error("[freehand] unhandled route error:", err);
      return jsonError(500, "Something went wrong on our side. Please try again.");
    }
  };
}

/** Reads a JSON body or form data into a plain object. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  }
  if (type.includes("form")) {
    const fd = await req.formData();
    const obj: Record<string, unknown> = {};
    fd.forEach((v, k) => (obj[k] = typeof v === "string" ? v : undefined));
    return obj;
  }
  return {};
}

export function wantsHtml(req: Request): boolean {
  const type = req.headers.get("content-type") ?? "";
  return !type.includes("application/json");
}

/** Only allow same-site relative redirects. */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
