# Freehand

**Walls need art. Artists need walls.**

Freehand matches emerging artists with local businesses in the Greater Cambridge / Boston area. Artists display their work for free. Businesses get original art for their walls at cost (they cover only the artist's materials) and keep the piece. Freehand never handles money; it only shows the artist's estimated materials cost.

## Live demo

**Production URL:** `https://YOUR-PROJECT.vercel.app` ← replace after deploying (see [Deploy](#deploy)). Submit the **production** URL, not a preview URL.

Health check: `https://YOUR-PROJECT.vercel.app/api/health` should return `{"status":"OK", ...}`.

## Demo credentials / how to try it (2 minutes, no account needed)

The deployed demo runs in **demo mode**: no sign-up, no email, no setup.

1. Open the link. On the home page, click **Try as a business** (step 1 of the tour). You are signed in as *Lena Ortiz (Cardinal Coffee)* and land on **Post a wall**. Fill in the form, add any JPEG/PNG photo, submit.
2. Open **Switch demo user** in the header and pick **Jules Okafor (Artist)**. Go to **Browse walls**, open the wall you just posted, click **Respond to this wall**, add a photo, a description, and a few materials (the total updates live), and send it.
3. Switch back to **Lena Ortiz (Business)**. On **My account**, click **Review responses** for your wall and press **Accept**. The wall becomes *Filled*, other responses are auto-declined, and contact details are revealed to both sides. Switch to Jules to see the artist's view.

You can also log in with *any* email at `/login`: in demo mode the one-time code is shown on screen and pre-filled (no real email is sent). Demo users all use `@example.com` addresses:

| Demo user | Role |
| --- | --- |
| Lena Ortiz (Cardinal Coffee) | Business |
| Sam Whitfield (Bluebird Books) | Business |
| Jules Okafor | Artist |
| Priya Natarajan | Artist |

> Demo data lives in memory on Vercel and resets on cold starts. Connecting Google Sheets (below) makes it persistent.

## Assignment submission blurb (paste-ready)

> **Freehand** — Walls need art. Artists need walls.
> Freehand is a tiny two-sided marketplace that matches emerging artists with local businesses around Cambridge, MA. A business posts a blank wall (photos, size, vibe), artists respond with photos of their work and an itemized materials estimate, and the business accepts one response, which reveals contact details to both parties. No money moves through the platform: the business reimburses only the artist's materials, off-platform, and keeps the finished piece.
> **Live demo:** https://YOUR-PROJECT.vercel.app (click "Try as a business" / "Try as an artist"; nothing to install or sign up for).
> **Tech stack:** Next.js (App Router) + TypeScript + Tailwind CSS on Vercel; Google Sheets as the only database and Google Drive for images, both via a service account (with an in-memory fallback for the zero-config demo); passwordless email-code login with signed httpOnly JWT sessions (jose); zod validation; Vitest tests.
> **AI tools used:** The codebase was generated with Claude Code (Anthropic's Claude Fable 5.1) from a written product spec; I reviewed, tested, and deployed it.

---

## Features (the whole MVP loop)

1. **Log in** with a 6-digit one-time email code (no passwords). First-time users pick a name and a fixed role: artist or business.
2. **Business posts a wall**: title, address, wall description, desired width × height (inches), vibe, 1–3 photos.
3. **Artist responds**: title, description, dimensions, 1–4 photos, and a materials estimate builder with a live total in dollars.
4. **Business accepts or declines**. Accepting marks the proposal *Accepted*, the listing *Filled*, auto-declines the other submitted proposals with a polite templated reason, and reveals contact info (artist sees business name, address, email; business sees artist email). Declining stores an optional reason the artist can see.

Public pages (home, browse, listing detail, about) never require login. Dashboards show a business's walls with response counts, or an artist's responses with status badges.

## Tech stack

- **Next.js 16 (App Router), TypeScript, Tailwind CSS 4**, deployable to Vercel
- **Database: Google Sheets** via the Sheets API with a service account (`googleapis`)
- **Images: Google Drive folder**, same service account, served through a private proxy route
- **Auth:** passwordless 6-digit codes (hashed with HMAC, 10-minute expiry, 5 attempts) + signed httpOnly JWT session cookie (`jose`). No session table.
- **Email:** stub only. `lib/email.ts` → `sendEmail(to, subject, body)` logs to the server console. Swap in Resend etc. there.
- **Validation:** zod on every route handler
- **Tests:** Vitest (core logic only)

## Run it locally (zero configuration)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Google credentials the app starts in **local + demo mode**: data is kept in `.data/db.json` (and images in `.data/images/`) so it survives restarts, seed data is loaded on first run, and the console prints which mode is active:

```
[freehand] storage: local JSON file in ./.data (no Google credentials found) | demo mode: ON | AUTH_SECRET: using insecure default ...
```

Delete the `.data` folder to reset to seed data.

Other scripts:

```bash
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run setup-sheets # create tabs + header rows in your Google Sheet
```

## Modes

| | Google credentials set | Google credentials missing |
| --- | --- | --- |
| Rows | Google Sheet | In-memory, persisted to `.data/db.json` locally; memory-only on Vercel (resets on cold start) |
| Images | Google Drive folder (max 8 MB each) | In-memory / `.data/images/` (max 2 MB each) |
| `DEMO_MODE` default | `false` | `true` |

`DEMO_MODE=true` turns on: codes shown on screen, one-click demo users + "Switch demo user" menu, demo banner, and automatic seed data when the Users tab is empty. You can set `DEMO_MODE=true` together with Google credentials to run a persistent public demo.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email (`...@...iam.gserviceaccount.com`) |
| `GOOGLE_PRIVATE_KEY` | Private key from the service account JSON. Paste the whole `"-----BEGIN PRIVATE KEY-----\n...\n"` string on one line; escaped `\n` are handled. |
| `GOOGLE_SHEET_ID` | The id in the spreadsheet URL `https://docs.google.com/spreadsheets/d/<ID>/edit` |
| `GOOGLE_DRIVE_FOLDER_ID` | The id in the folder URL `https://drive.google.com/drive/folders/<ID>` |
| `AUTH_SECRET` | Long random string for signing sessions and hashing codes. **Set this in production.** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DEMO_MODE` | `true` / `false` (see Modes) |

### Google setup, step by step

1. Go to https://console.cloud.google.com and create a project (e.g. `freehand`).
2. **APIs & Services → Library**: enable **Google Sheets API** and **Google Drive API**.
3. **APIs & Services → Credentials → Create credentials → Service account.** Give it a name; no roles needed. Open it, go to **Keys → Add key → Create new key → JSON**, download the file.
4. From the JSON file copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` → `GOOGLE_PRIVATE_KEY`.
5. Create a new **Google Sheet** (any name). Click **Share** and add the service account email as **Editor**. Copy the sheet id from the URL → `GOOGLE_SHEET_ID`.
6. Create a **Google Drive folder** for images. **Share** it with the service account email as **Editor**. Copy the folder id from the URL → `GOOGLE_DRIVE_FOLDER_ID`.
7. Put these four values plus `AUTH_SECRET` in `.env.local`, then run `npm run setup-sheets` to create the `Users`, `LoginCodes`, `Listings`, `Proposals` tabs with header rows. (The app also does this automatically on first request via `ensureSheets()`.)
8. `npm run dev` and confirm the console says `storage: Google Sheets + Drive`.

> If Drive uploads fail with a storage-quota error, your Google Workspace may not allow service accounts to own files. Use a Shared Drive (shared with the service account) as the folder, or enable domain-wide delegation. Personal Google accounts work as-is.

### Sheet structure

| Tab | Columns |
| --- | --- |
| Users | id, email, name, role (BUSINESS \| ARTIST), createdAt |
| LoginCodes | id, email, codeHash, expiresAt, used, attempts |
| Listings | id, businessUserId, businessName, address, title, wallDescription, desiredWidthIn, desiredHeightIn, vibeDescription, imageFileIds, status (OPEN \| FILLED \| CLOSED), createdAt |
| Proposals | id, listingId, artistUserId, artistName, title, description, widthIn, heightIn, imageFileIds, materialsJson, materialsTotalCents, status (SUBMITTED \| ACCEPTED \| DECLINED), declineReason, createdAt |

Money is stored as integer cents. `imageFileIds` is comma-separated. All sheet access goes through `lib/sheets.ts` (typed `getAll`, `getById`, `append`, `updateRow`, `transaction`) with a 15-second read cache invalidated on writes and an in-process write lock. The backend behind it (`lib/storage/`) can be swapped for a real database later.

## Deploy

### Click-deploy to Vercel

1. Push this folder to a GitHub repository:
   ```bash
   git add -A && git commit -m "Freehand MVP"
   git remote add origin https://github.com/YOU/freehand.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, **Import** the repository, keep the defaults (framework: Next.js), and click **Deploy**. No environment variables are required for the demo.
3. (Optional) Add the Google variables and `AUTH_SECRET` under **Project → Settings → Environment Variables** for persistent data, then redeploy. Paste `GOOGLE_PRIVATE_KEY` exactly as it appears in the JSON (with `\n`).
4. **Turn off Deployment Protection** so outsiders can open the site without a Vercel login: **Project → Settings → Deployment Protection → Vercel Authentication → Disabled** (or restrict it to *Only Preview Deployments*).
5. Open `https://YOUR-PROJECT.vercel.app/api/health`. If it returns `{"status":"OK"}`, you are live. Put that production URL at the top of this README and submit **the production URL** (not a `*-git-*.vercel.app` preview URL).

Notes: on Vercel without Google credentials, data lives in the memory of each serverless instance and resets on cold starts or new deployments; the demo banner says so. Set `AUTH_SECRET` in production so sessions survive redeploys and cannot be forged.

## Security and demo safety

- Only `BUSINESS` users can create listings; only `ARTIST` users can create proposals; only a listing's owner can accept/decline. Enforced server-side on every mutation.
- Emails live only in the Users tab and are revealed only on accepted proposals, to the two parties. Public pages and API responses never include emails, codes, or code hashes.
- Login codes are stored as HMAC-SHA256 hashes, expire in 10 minutes, allow 5 attempts, and are single-use. Code requests are rate-limited per email and per IP.
- Images are validated by MIME type, magic bytes, and size; Drive files are never public. The proxy route `/api/images/[fileId]` only serves ids referenced by a listing or proposal and sets caching headers.
- All user text is normalized, stripped of control characters, and capped in length (zod); React escapes it on render.
- Writes are rate-limited per IP, and demo caps limit listings/proposals per user per day and overall.

## Testing

```bash
npm test
```

Vitest covers: one-time code create/verify/expire/attempt-limit, materials total calculation, authorization helpers, accept logic (including auto-decline of other proposals) and decline logic, plus text sanitization and rate limiting.

## Project layout

```
app/                 pages + route handlers (App Router)
  api/auth/*         request-code, verify, complete-profile, demo-login, logout
  api/listings       POST create listing
  api/proposals      POST create proposal, [id]/accept, [id]/decline
  api/upload         POST image upload
  api/images/[id]    image proxy
  api/health         health check
components/          UI components (forms are client components)
lib/
  sheets.ts          the only module touching row storage (cache + lock + codecs)
  storage/           backends: google.ts (Sheets + Drive), memory.ts (local/in-memory)
  db.ts              domain functions (users, listings, proposals, accept/decline, contact reveal)
  auth/              codes.ts (pure code logic), session.ts (jose JWT cookies), current-user.ts
  accept.ts          pure accept/decline rules
  authz.ts           authorization helpers
  schemas.ts         zod schemas + text limits
  seed.ts            demo seed data
  email.ts           sendEmail stub
public/demo/         seed SVG images (no external downloads)
scripts/setup-sheets.ts
tests/
```

## Assumptions

Decisions made where the spec was open:

- **Project location:** the working directory was a home folder, so the app was created in a `freehand/` subdirectory.
- **LoginCodes columns:** added `id` (needed to update a row) and `attempts` (needed for the 5-attempt limit) to the specified columns.
- **Seed data:** 3 open listings plus one *Filled* listing so the Accepted/auto-declined states are visible on first load. Seed images are static SVGs in `public/demo/` with ids prefixed `demo-`.
- **Business name** is stored per listing (as specified) and pre-filled from the user's name on the form; a user's role is fixed at sign-up and their name is taken then.
- **Contact reveal** appears on the review page (business side) and on the artist's dashboard (artist side); nowhere else.
- **Image limits:** 8 MB with Drive, 2 MB in local/in-memory mode. Previews before submission use local object URLs because the proxy only serves referenced ids. Uploaded-but-never-attached images are simply never served.
- **Demo caps:** 10 listings and 20 proposals per user per day; 300 listings and 600 proposals total; 30 writes per IP per hour; 5 code requests per email and 15 per IP per 15 minutes.
- **Materials:** quantities may be fractional, unit costs are entered in dollars and stored as integer cents, totals are rounded per line.
- **Sessions** last 30 days. Without `AUTH_SECRET` a clearly-logged insecure default is used so the zero-config demo works.
- **Demo mode with Google credentials** seeds the sheet only if the Users tab is empty.
- **Rate limiting and caching are per server instance** (fine for an MVP on Vercel).
- **No middleware:** auth is checked in pages and route handlers; public pages are server-rendered on demand (`force-dynamic`) so data is always fresh.

## Next steps

- Real email provider (Resend/Postmark) behind `sendEmail`, with magic links
- Payments / escrow for materials reimbursement (or at least a "mark as reimbursed" flag)
- In-app messaging between matched parties
- Editing and withdrawing proposals; editing/closing listings
- Notifications (email/push) on new responses and decisions
- Move from Google Sheets to a real database (Postgres) behind the same `lib/sheets.ts` interface
- Admin moderation (report/remove listings, ban users)
- Geo search and filtering by neighborhood, size, or budget
- Image optimization/thumbnails and a CDN in front of the proxy
