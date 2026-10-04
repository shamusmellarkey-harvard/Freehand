import { z } from "zod";
import { cleanLine, cleanText, normalizeEmail } from "@/lib/sanitize";

/** Shared zod schemas for every route handler. Text is sanitized and capped. */

export const LIMITS = {
  name: 60,
  email: 254,
  title: 80,
  address: 160,
  longText: 1200,
  reason: 400,
  materialName: 60,
  maxMaterials: 25,
  maxDimensionIn: 600,
} as const;

const line = (max: number, min = 1) =>
  z.preprocess((v) => cleanLine(v, max), z.string().min(min, "Required").max(max));
const paragraph = (max: number, min = 1) =>
  z.preprocess((v) => cleanText(v, max), z.string().min(min, "Required").max(max));

export const emailSchema = z.preprocess(
  (v) => normalizeEmail(v),
  z.string().email("Enter a valid email address").max(LIMITS.email),
);

export const requestCodeSchema = z.object({ email: emailSchema });

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z.preprocess((v) => cleanLine(v, 12).replace(/\s+/g, ""), z.string().regex(/^\d{6}$/, "Enter the 6-digit code")),
});

export const completeProfileSchema = z.object({
  name: line(LIMITS.name, 2),
  role: z.enum(["BUSINESS", "ARTIST"]),
});

export const demoLoginSchema = z.object({ userId: line(40) });

const dimension = z.coerce
  .number()
  .int("Whole inches only")
  .min(1, "Must be at least 1 inch")
  .max(LIMITS.maxDimensionIn, `Must be ${LIMITS.maxDimensionIn} inches or less`);

const fileId = z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/, "Invalid image id");

export const createListingSchema = z.object({
  businessName: line(LIMITS.name),
  address: line(LIMITS.address, 5),
  title: line(LIMITS.title, 3),
  wallDescription: paragraph(LIMITS.longText, 10),
  desiredWidthIn: dimension,
  desiredHeightIn: dimension,
  vibeDescription: paragraph(LIMITS.longText, 3),
  imageFileIds: z.array(fileId).min(1, "Add at least one photo of the wall").max(3, "Up to 3 photos"),
});

export const materialItemSchema = z.object({
  name: line(LIMITS.materialName),
  quantity: z.coerce.number().positive("Quantity must be positive").max(10_000),
  unitCostCents: z.coerce.number().int().min(0).max(10_000_000),
});

export const createProposalSchema = z.object({
  listingId: line(40),
  title: line(LIMITS.title, 2),
  description: paragraph(LIMITS.longText, 10),
  widthIn: dimension,
  heightIn: dimension,
  imageFileIds: z.array(fileId).min(1, "Add at least one photo of your work").max(4, "Up to 4 photos"),
  materials: z.array(materialItemSchema).min(1, "Add at least one material").max(LIMITS.maxMaterials),
});

export const decideProposalSchema = z.object({
  reason: z.preprocess((v) => cleanText(v ?? "", LIMITS.reason), z.string().max(LIMITS.reason)).optional(),
});

/** Flatten zod issues to a single readable message. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.length ? `${String(issue.path[issue.path.length - 1])}: ` : "";
  return `${path}${issue.message}`;
}
