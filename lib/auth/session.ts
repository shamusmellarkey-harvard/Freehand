import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  AUTH_SECRET,
  PENDING_COOKIE,
  PENDING_TTL_SECONDS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/config";

const key = new TextEncoder().encode(AUTH_SECRET);

async function sign(payload: Record<string, string>, ttlSeconds: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key);
}

async function verify(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Signed, httpOnly session cookie. No session table: the JWT is the session. */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = await sign({ uid: userId }, SESSION_TTL_SECONDS);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_TTL_SECONDS });
  jar.delete(PENDING_COOKIE);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PENDING_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verify(token);
  const uid = payload?.uid;
  return typeof uid === "string" ? uid : null;
}

/** Short-lived cookie for a verified email that has not created a profile yet. */
export async function setPendingCookie(email: string): Promise<void> {
  const token = await sign({ email, kind: "pending" }, PENDING_TTL_SECONDS);
  const jar = await cookies();
  jar.set(PENDING_COOKIE, token, { ...cookieBase, maxAge: PENDING_TTL_SECONDS });
}

export async function getPendingEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  const payload = await verify(token);
  if (payload?.kind !== "pending") return null;
  const email = payload.email;
  return typeof email === "string" ? email : null;
}
