export type Role = "BUSINESS" | "ARTIST";
export type ListingStatus = "OPEN" | "FILLED" | "CLOSED";
export type ProposalStatus = "SUBMITTED" | "ACCEPTED" | "DECLINED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/** Public view of a user: never includes email. */
export interface PublicUser {
  id: string;
  name: string;
  role: Role;
}

export interface LoginCode {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  used: boolean;
  attempts: number;
}

export interface Listing {
  id: string;
  businessUserId: string;
  businessName: string;
  address: string;
  title: string;
  wallDescription: string;
  desiredWidthIn: number;
  desiredHeightIn: number;
  vibeDescription: string;
  imageFileIds: string[];
  status: ListingStatus;
  createdAt: string;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unitCostCents: number;
}

export interface Proposal {
  id: string;
  listingId: string;
  artistUserId: string;
  artistName: string;
  title: string;
  description: string;
  widthIn: number;
  heightIn: number;
  imageFileIds: string[];
  materials: MaterialItem[];
  materialsTotalCents: number;
  status: ProposalStatus;
  declineReason: string;
  createdAt: string;
}

/** Contact details revealed only on accepted proposals, to the two parties. */
export interface ContactInfo {
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  artistName?: string;
  artistEmail?: string;
}

export const TAB_NAMES = ["Users", "LoginCodes", "Listings", "Proposals"] as const;
export type TabName = (typeof TAB_NAMES)[number];

/** Header rows, in column order, for every tab. */
export const TAB_HEADERS: Record<TabName, readonly string[]> = {
  Users: ["id", "email", "name", "role", "createdAt"],
  LoginCodes: ["id", "email", "codeHash", "expiresAt", "used", "attempts"],
  Listings: [
    "id",
    "businessUserId",
    "businessName",
    "address",
    "title",
    "wallDescription",
    "desiredWidthIn",
    "desiredHeightIn",
    "vibeDescription",
    "imageFileIds",
    "status",
    "createdAt",
  ],
  Proposals: [
    "id",
    "listingId",
    "artistUserId",
    "artistName",
    "title",
    "description",
    "widthIn",
    "heightIn",
    "imageFileIds",
    "materialsJson",
    "materialsTotalCents",
    "status",
    "declineReason",
    "createdAt",
  ],
};

/** A raw row as stored in a sheet: every cell is a string. */
export type RawRow = Record<string, string>;
