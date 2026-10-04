import { cache } from "react";
import { getUserById } from "@/lib/db";
import { HttpError } from "@/lib/http";
import type { Role, User } from "@/lib/types";
import { getSessionUserId } from "./session";

/** The logged-in user for this request, or null. Memoized per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const uid = await getSessionUserId();
  if (!uid) return null;
  return getUserById(uid);
});

/** For route handlers: throws a 401/403 HttpError when not allowed. */
export async function requireUser(role?: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in first.");
  if (role && user.role !== role) {
    throw new HttpError(
      403,
      role === "BUSINESS" ? "Only business accounts can do that." : "Only artist accounts can do that.",
    );
  }
  return user;
}
