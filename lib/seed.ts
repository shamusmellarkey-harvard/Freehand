import { AUTO_DECLINE_REASON } from "@/lib/accept";
import { materialsTotalCents } from "@/lib/materials";
import type { Listing, MaterialItem, Proposal, User } from "@/lib/types";

/**
 * Demo seed data. Every email is an @example.com address, images are static
 * SVGs in public/demo/, and ids are fixed so the one-click demo buttons work.
 */

export const DEMO_BUSINESS_ID = "u_demo_biz1";
export const DEMO_ARTIST_ID = "u_demo_art1";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const SEED_USERS: User[] = [
  { id: DEMO_BUSINESS_ID, email: "lena@example.com", name: "Lena Ortiz (Cardinal Coffee)", role: "BUSINESS", createdAt: daysAgo(30) },
  { id: "u_demo_biz2", email: "sam@example.com", name: "Sam Whitfield (Bluebird Books)", role: "BUSINESS", createdAt: daysAgo(28) },
  { id: DEMO_ARTIST_ID, email: "jules@example.com", name: "Jules Okafor", role: "ARTIST", createdAt: daysAgo(25) },
  { id: "u_demo_art2", email: "priya@example.com", name: "Priya Natarajan", role: "ARTIST", createdAt: daysAgo(20) },
];

export const SEED_LISTINGS: Listing[] = [
  {
    id: "l_demo_1",
    businessUserId: DEMO_BUSINESS_ID,
    businessName: "Cardinal Coffee",
    address: "1352 Cambridge St, Cambridge, MA 02139",
    title: "Big blank wall behind the espresso bar",
    wallDescription:
      "The wall behind our bar is painted warm white and gets great afternoon light. Customers face it while they wait for drinks, so it is the first thing everyone sees. Plaster, no outlets, hangs on two French cleats.",
    desiredWidthIn: 60,
    desiredHeightIn: 40,
    vibeDescription: "Warm, a little playful. Earth tones with one bold color. Something that makes people smile at 7am.",
    imageFileIds: ["demo-wall-1"],
    status: "OPEN",
    createdAt: daysAgo(9),
  },
  {
    id: "l_demo_2",
    businessUserId: "u_demo_biz2",
    businessName: "Bluebird Books",
    address: "1920 Massachusetts Ave, Cambridge, MA 02140",
    title: "Children's corner reading nook",
    wallDescription:
      "A cozy corner where we host story time on Saturdays. Low wall above a bench, drywall, soft indirect lighting. Kids will be sitting right under it.",
    desiredWidthIn: 48,
    desiredHeightIn: 30,
    vibeDescription: "Whimsical, gentle, lots of little details for kids to find. Think illustrated maps or animals reading.",
    imageFileIds: ["demo-wall-2"],
    status: "OPEN",
    createdAt: daysAgo(6),
  },
  {
    id: "l_demo_3",
    businessUserId: DEMO_BUSINESS_ID,
    businessName: "Cardinal Coffee",
    address: "1352 Cambridge St, Cambridge, MA 02139",
    title: "Narrow hallway to the restrooms",
    wallDescription:
      "A long, narrow hallway everyone walks through. Currently just beige paint. Two existing hooks spaced 36 inches apart. Low foot traffic damage risk, but the space is tall and skinny.",
    desiredWidthIn: 24,
    desiredHeightIn: 48,
    vibeDescription: "Moody and calm. Deep blues or greens, maybe something botanical. Vertical composition.",
    imageFileIds: ["demo-wall-3"],
    status: "OPEN",
    createdAt: daysAgo(2),
  },
  {
    id: "l_demo_4",
    businessUserId: "u_demo_biz2",
    businessName: "Bluebird Books",
    address: "1920 Massachusetts Ave, Cambridge, MA 02140",
    title: "Entry alcove by the front door",
    wallDescription: "The first wall you see when you walk in. Brick, with a picture rail already installed.",
    desiredWidthIn: 36,
    desiredHeightIn: 36,
    vibeDescription: "Bookish and bright. A welcome to the shop.",
    imageFileIds: ["demo-wall-4"],
    status: "FILLED",
    createdAt: daysAgo(20),
  },
];

const m = (name: string, quantity: number, unitCostCents: number): MaterialItem => ({ name, quantity, unitCostCents });

function proposal(p: Omit<Proposal, "materialsTotalCents">): Proposal {
  return { ...p, materialsTotalCents: materialsTotalCents(p.materials) };
}

export const SEED_PROPOSALS: Proposal[] = [
  proposal({
    id: "p_demo_1",
    listingId: "l_demo_1",
    artistUserId: DEMO_ARTIST_ID,
    artistName: "Jules Okafor",
    title: "Morning Rounds",
    description:
      "A large abstract piece built from overlapping circles in terracotta, ochre, and cream, with one bright coral arc cutting across. Acrylic on stretched canvas, gallery wrapped so no frame is needed.",
    widthIn: 60,
    heightIn: 40,
    imageFileIds: ["demo-art-1", "demo-art-2"],
    materials: [m("60x40 stretched canvas", 1, 8900), m("Acrylic paint (heavy body), 8oz", 6, 1450), m("Gesso, quart", 1, 1800), m("Varnish", 1, 1600)],
    status: "SUBMITTED",
    declineReason: "",
    createdAt: daysAgo(5),
  }),
  proposal({
    id: "p_demo_2",
    listingId: "l_demo_1",
    artistUserId: "u_demo_art2",
    artistName: "Priya Natarajan",
    title: "Steam",
    description: "A loose ink and wash piece of rising steam shapes, framed in natural oak.",
    widthIn: 56,
    heightIn: 38,
    imageFileIds: ["demo-art-3"],
    materials: [m("Watercolor paper roll", 1, 4200), m("Sumi ink", 2, 1200), m("Oak frame", 1, 12500)],
    status: "DECLINED",
    declineReason: "Lovely work, but we are hoping for more color behind the bar. Thank you for responding!",
    createdAt: daysAgo(4),
  }),
  proposal({
    id: "p_demo_3",
    listingId: "l_demo_2",
    artistUserId: "u_demo_art2",
    artistName: "Priya Natarajan",
    title: "The Reading Forest",
    description:
      "A gouache illustration of forest animals each reading a tiny book, with hidden details (a snail with glasses, a fox asleep on a dictionary). Mounted on birch panel.",
    widthIn: 48,
    heightIn: 30,
    imageFileIds: ["demo-art-4"],
    materials: [m("Birch panel 48x30", 1, 6500), m("Gouache set", 1, 5400), m("Brushes", 4, 650), m("Sealant", 1, 1400)],
    status: "SUBMITTED",
    declineReason: "",
    createdAt: daysAgo(3),
  }),
  proposal({
    id: "p_demo_4",
    listingId: "l_demo_4",
    artistUserId: DEMO_ARTIST_ID,
    artistName: "Jules Okafor",
    title: "Open Book",
    description: "Bold geometric pages fanning outward in sunny yellows and blues. Acrylic on panel.",
    widthIn: 36,
    heightIn: 36,
    imageFileIds: ["demo-art-5"],
    materials: [m("36x36 wood panel", 1, 5200), m("Acrylic paint, 8oz", 5, 1450), m("Hanging hardware", 1, 900)],
    status: "ACCEPTED",
    declineReason: "",
    createdAt: daysAgo(15),
  }),
  proposal({
    id: "p_demo_5",
    listingId: "l_demo_4",
    artistUserId: "u_demo_art2",
    artistName: "Priya Natarajan",
    title: "Shelf Life",
    description: "A quiet still life of stacked books in muted tones.",
    widthIn: 36,
    heightIn: 36,
    imageFileIds: ["demo-art-3"],
    materials: [m("Canvas 36x36", 1, 4800), m("Oil paint set", 1, 7800)],
    status: "DECLINED",
    declineReason: AUTO_DECLINE_REASON,
    createdAt: daysAgo(14),
  }),
];

/** All image ids referenced by seed data, so the proxy treats them as referenced. */
export const SEED_IMAGE_IDS = new Set([
  ...SEED_LISTINGS.flatMap((l) => l.imageFileIds),
  ...SEED_PROPOSALS.flatMap((p) => p.imageFileIds),
]);
