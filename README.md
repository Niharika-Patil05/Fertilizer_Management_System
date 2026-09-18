# 🌿 Fertilizer Management System

**Mini Project — Annasaheb Dange College of Engineering & Technology, Ashta**
Department of Artificial Intelligence and Data Science

**Team:** Reshma Navnath Gavali · Megha Satish Kamble · Niharika Mahadev Patil
**Guide:** Prof. Akshay Mane | **Sponsor:** Shriram Krushi Kendra, Solapur

A MERN application for a fertilizer/agri‑input shop: products, inventory & expiry
alerts, billing with auto invoice numbers, customer credit/reliability tracking and a
dashboard. It is delivered to the sponsor as a **local Docker deployment** that the
developer can update remotely without ever touching the sponsor's data.

---

# 📦 Deployment overview

```
Sponsor's Windows PC  ──  Docker Desktop
│
├── frontend   (nginx: serves the built React app + proxies /api → backend)   :8080 on the PC
├── backend    (Node/Express API + automatic DB migrations)                    internal only
└── mongo      (MongoDB 7)                                                     internal only
        └── named volume  fms_mongo_data   ←  ALL sponsor data lives here
```

* **Application code and database data are completely separate.** Updates replace the
  `frontend`/`backend` containers. They never delete the `fms_mongo_data` volume.
* The sponsor gets a single **`FertilizerShopSetup.exe`** (built from
  [`installer/FertilizerShop.iss`](installer/FertilizerShop.iss) with Inno Setup). They
  run it once, click through the wizard, and get a **"Fertilizer Shop" icon** on their
  Desktop and Start Menu. They never see Docker, a terminal, or type a URL.
* Updates are shipped as versioned Docker images on GitHub Container Registry (GHCR).
  Every time the sponsor opens the Desktop icon, it quietly checks GitHub for a newer
  version and updates itself first (backing up the database, rolling back automatically
  if anything fails) — see [Auto-update](#auto-update-how-it-works) below. Daily use only
  needs internet for that quick check; the app itself works offline.

---

## Developer Setup (running the app while coding)

Requirements: Node.js 20+, a local MongoDB (or the Docker `mongo` container), Git.

```bash
# backend
cd backend
npm install
copy ..\.env.example .env          # (Windows)   /   cp ../.env.example .env
# edit .env: set MONGO_URI=mongodb://localhost:27017/fertilizer_mgmt
npm run migrate                    # creates the admin user on an empty DB
npm run dev                        # http://localhost:5000

# frontend (second terminal)
cd frontend
npm install
npm start                          # http://localhost:3000  (CRA proxy → :5000)
```

First run on an empty database shows a **"Create Your Account"** screen — pick any
email/password there, no pre-set credentials.

`npm run seed` still exists for a quick demo dataset, but it is **destructive** (wipes all
collections) and now refuses to run unless you explicitly pass `ALLOW_SEED=true`:

```bash
ALLOW_SEED=true npm run seed       # local development only – never on sponsor data
```

### Run the whole stack locally with Docker

```bash
docker compose build
docker compose up -d               # builds images and starts everything
# open http://localhost:8080
docker compose down                # stop (data volume is kept)
```

---

## Production / Sponsor Setup

**One time:**

1. Send the sponsor **`FertilizerShopSetup.exe`** (see
   [Building the installer](#building-the-installer-developer) below for how you make
   this file). One file — no zip, no folder to extract.
2. Connect the PC to the **internet** (needed only for this first install).
3. They double‑click it and click through the wizard (Next → Install → Finish). Behind
   the scenes it:
   * Copies the app files to `C:\Program Files\Fertilizer Shop\`.
   * Creates a **"Fertilizer Shop" icon** on the Desktop and in the Start Menu.
   * On Finish, runs the first-time setup: installs Docker Desktop automatically if it
     isn't already installed (this is the one interruption that needs a click on a
     Windows permission popup, and — rarely — a single PC restart; if that happens, it
     says so and the sponsor just opens "Fertilizer Shop" again to pick up where it left
     off), then downloads and starts the app, and opens it in the browser.
4. Since this is a brand-new database, they'll see **"Create Your Account"** — their own
   name, shop name, email and password. That becomes the one admin login for the shop.
   There is no default password to remember or change.

After this the PC can be used offline. From now on the sponsor never sees a terminal,
Docker, or a URL to type — they just **click the "Fertilizer Shop" icon**, which checks
for updates, starts everything quietly in the background, and opens the app in the
browser once it's ready.

> ⚠️ **Never delete the `.env` file** and **never run `docker compose down -v`**. Both
> are the only ways to lose data. Everything else — including uninstalling and
> reinstalling the app itself — is safe; see [Data Safety](#data-safety).

### Auto-update, how it works

Every time the sponsor opens the Desktop icon, `scripts\_launch_hidden.vbs` runs
`scripts\update.bat --quiet` first, hidden, before starting the app:

1. Reads the currently installed version from `.env` (`APP_VERSION`).
2. Fetches [`release.json`](release.json) from the `main` branch on GitHub (raw file,
   no auth needed) and compares `.version`.
3. If it's newer: **backs up the database** (`scripts\backup.bat quiet`) — if the
   backup fails, the update is aborted and nothing changes. Otherwise it pulls the new
   images, applies them (`docker compose up -d`, which runs migrations automatically),
   and health-checks. If any of that fails, it **rolls back** `.env` to the old version
   and restarts the previous containers — the same safe, tested logic as running
   `scripts\update.bat` by hand, just non-interactive (no `pause`s) and silent about
   anything that isn't an actual failure.
4. Whether or not an update ran, `scripts\_start_silent.bat` then makes sure the app is
   actually up, and the browser opens.

This means **you never need to send the sponsor a new `Setup.exe` for a routine
update** — publishing a new version (see [Releasing a New Version](#releasing-a-new-version-developer))
is enough; it reaches every install the next time they open the icon. A new
`Setup.exe` is only needed for a brand-new PC that doesn't have the app yet.

<details>
<summary><strong>Advanced: what the installer and the Desktop icon actually run</strong> (for the developer, not the sponsor)</summary>

* `installer/FertilizerShop.iss` — Inno Setup source for `FertilizerShopSetup.exe`.
  Installs `docker-compose.yml`, `.env.example`, `app.ico`, `README.md` and `scripts\`
  into `{autopf}\Fertilizer Shop`, creates the Desktop + Start Menu shortcuts (pointing
  at `scripts\_launch_hidden.vbs`, icon `app.ico`), and on Finish runs
  `scripts\_first_run.bat`.
* `scripts\_first_run.bat` — installs Docker Desktop if missing
  (`Docker Desktop Installer.exe install --quiet --accept-license`), waits for the
  engine, then calls `scripts\_start_silent.bat` and opens the browser. Shows a normal
  visible console window (via Inno's `shellexec`) since this one-time step can take
  several minutes and the sponsor should see it's working.
* `scripts\_start_silent.bat` — the same first-run/start logic as `scripts\start.bat`,
  minus the banner and the closing `pause`, so it can be called with no user
  interaction. Exit code 0 = healthy; non‑zero = something failed.
* `scripts\update.bat --quiet` — the same logic as running `scripts\update.bat` by
  hand, minus every `pause`; a Docker/setup problem in quiet mode backs off silently
  (exit 0) rather than failing loudly, since reporting problems is `_start_silent.bat`'s
  job, not the update check's.
* `scripts\_launch_hidden.vbs` — what the Desktop/Start Menu icon runs every time.
  Runs `update.bat --quiet` then `_start_silent.bat`, both in a **hidden** window
  (`WshShell.Run(..., 0, True)`), then opens `http://localhost:8080`. Shows a
  plain-language message box only if `_start_silent.bat` didn't come up healthy.
* The old `scripts\start.bat` / `stop.bat` / `logs.bat` etc. still exist and still work
  from a normal command prompt — useful for you, not meant for the sponsor.

These `.bat`/`.vbs` scripts, and the `.iss` installer source, were written and reviewed
but **could not be executed or compiled in the authoring environment** (no Windows
machine, no Inno Setup available) — build and test the whole flow (install → first run
→ close and reopen the icon → simulate an update by bumping `release.json`) on a real
Windows PC before handing it to the sponsor.
</details>

### Building the installer (developer)

1. Install Inno Setup (free): <https://jrsoftware.org/isdl.php>
2. Open `installer/FertilizerShop.iss` in the Inno Setup Compiler (or right-click it →
   **Compile**).
3. Find `FertilizerShopSetup.exe` in `installer/dist/`. Send that one file to the
   sponsor (it's not committed to git — build it fresh for each new install).
4. Bump `#define MyAppVersion` in the `.iss` to match `VERSION`/`release.json` on each
   release, so Add/Remove Programs shows the right number (this label is cosmetic —
   the actual running app version is controlled by the auto-updater, independently).

---

## Starting the System

**Sponsor's everyday use:** double‑click the **"Fertilizer Shop" icon on the Desktop**.
No terminal window, no typing — it starts the app quietly and opens the browser once
it's ready.

**Developer / troubleshooting:** double‑click **`scripts\start.bat`** for the original
visible-progress version (safe to run every time the computer is switched on). It
starts the containers, waits until the app is healthy, and prints the address.

## Stopping the System

Double‑click **`scripts\stop.bat`**. Containers stop; the database volume and all data
stay on disk. Use `scripts\start.bat` to start again.

`scripts\restart.bat` restarts without stopping first. `scripts\logs.bat` shows live logs.

---

## Backup

Double‑click **`scripts\backup.bat`** (do this regularly, and always before an update —
`update.bat` does it automatically).

It creates `backups\fms-YYYYMMDD-HHMMSS\` containing:

| File | What it is |
|---|---|
| `dump.archive.gz` | Compressed copy of the whole MongoDB database (read‑only export – the live DB is never modified) |
| `env.backup` | Copy of `.env` (security key + settings – needed for a full restore) |
| `meta.txt` | Timestamp, app version, file size |

Backups live in the `backups\` folder **on the PC, outside every container**, and are
git‑ignored. Copy the `backups\` folder to an external drive periodically.

---

## Updating

The developer publishes a new version; the sponsor runs one script.

Double‑click **`scripts\update.bat`** (PC must be online).

It performs, in order:

1. Check Docker is running and the app is configured.
2. **Create a database backup** (aborts the update if the backup fails).
3. Read the latest published version from GitHub (`release.json`).
4. Download the new `frontend` / `backend` images.
5. Update `APP_VERSION` in `.env`.
6. Start the new containers – the backend **runs database migrations automatically**
   before it accepts traffic.
7. Health‑check `http://localhost:8080/api/health` until it reports the new version.
8. Print `UPDATE SUCCESS 1.0.0 -> 1.1.0`.

To update to a specific version instead of the latest: `scripts\update.bat 1.1.0`.

**If an update fails at any step**, `update.bat` automatically:

* leaves the MongoDB volume untouched,
* keeps the pre‑update backup,
* rolls the `APP_VERSION` back and restarts the previous containers,
* prints `UPDATE FAILED — rolled back to <old>, backup preserved at backups\...`.

---

## Rollback

If a new version runs but misbehaves:

```
scripts\rollback.bat 1.0.0
```

This re‑runs the previous application version. **It does not change the database.**

If the new version had also changed data and you need the old data back, additionally
restore the backup that `update.bat` made just before the update:

```
scripts\restore.bat backups\fms-YYYYMMDD-HHMMSS
```

`restore.bat` asks you to type `RESTORE` to confirm, then reloads the collections
contained in that backup (disaster recovery only).

---

## Data Safety

**Where sponsor data lives**
All data created in the app is stored by MongoDB in a **Docker named volume called
`fms_mongo_data`**. A named volume is independent of the containers – it is a separate
area managed by Docker on the PC's disk.

**Why application updates don't delete it**

* The scripts only ever `pull`, `up -d`, `stop`, `restart` and recreate the
  `frontend`/`backend` containers.
* None of them pass `-v` / `--volumes`, and none of them touch the `mongo` service's
  volume. The `docker-compose.yml` gives the volume a fixed name so a project rename
  can't orphan it either.
* Container images contain **only application code**, never data.
* Verified to survive: `stop`/`start`, `restart`, `docker compose down` + `up`,
  container recreation, image/version change, full container power‑cycle. (See
  *Testing performed* in the project report.)

**The only ways to lose data** (never do these):

* `docker compose down -v`  – deletes the volume.
* Deleting the `.env` file – rotates the security key (everyone is logged out; not data
  loss, but disruptive). Keep it backed up.
* `docker volume rm fms_mongo_data`.

**Where backups are stored**
`backups\fms-YYYYMMDD-HHMMSS\` inside this folder, on the PC. Not in Git. Copy them to
external storage regularly.

**How to restore a backup**
`scripts\restore.bat backups\fms-YYYYMMDD-HHMMSS` (with the app running).

---

## Releasing a New Version (developer)

1. Make code changes on a branch, merge to `main`.
2. If the release needs a data/schema change, add a migration file
   `backend/migrations/NNN-description.js` exporting `async up(mongoose)`. Make it
   **idempotent** and **non‑destructive** (never drop/overwrite production collections).
   Migrations are tracked in the `_migrations` collection and run automatically on the
   sponsor's PC during `update.bat`, *after* the automatic backup.
3. Bump the version in **both** `VERSION` and `release.json` (semantic versioning
   `MAJOR.MINOR.PATCH`).
4. Commit, then tag and push:

   ```bash
   git commit -am "Release 1.1.0"
   git tag v1.1.0
   git push origin main v1.1.0
   ```

5. The GitHub Actions workflow [`.github/workflows/release.yml`](.github/workflows/release.yml)
   builds and pushes to GHCR:

   ```
   ghcr.io/niharika-patil05/fms-backend:1.1.0   + :stable
   ghcr.io/niharika-patil05/fms-frontend:1.1.0  + :stable
   ```

   (The workflow fails unless the git tag, `VERSION` and `release.json` `.version` are
   all identical — this prevents shipping images the sponsor's `update.bat` would never
   pick up.) Make the GHCR packages
   **public** once (Package settings → Change visibility) so the sponsor can pull
   without logging in.
6. That's it — nothing to tell the sponsor. The next time they open the "Fertilizer
   Shop" icon (with internet available), `update.bat --quiet` picks up the new
   `release.json` automatically. A new `FertilizerShopSetup.exe` is only needed for an
   installation that doesn't have the app yet.

The `IMAGE_OWNER` value in `.env.example` / `.env` and the repo URL inside
`scripts/update.*` must match your GitHub account/repo.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `start.bat` says *Docker Desktop is not running* | Open Docker Desktop, wait for "Engine running", retry. |
| Browser can't open `http://localhost:8080` | Another program uses port 8080. Edit `.env`, set e.g. `FRONTEND_PORT=9090`, run `stop.bat` then `start.bat`, use `http://localhost:9090`. |
| App stuck "not healthy" | `scripts\logs.bat` to see errors. Usually the first start is still downloading MongoDB – wait and retry `start.bat`. |
| Forgot admin password | There's no reset flow yet — ask the developer to update the password directly in the database, or restore a backup from before the password was changed. |
| `update.bat` says can't reach GitHub | PC is offline, or the GHCR packages aren't public. Connect to internet / make packages public, retry. |
| Update failed | It already rolled back. Data is safe; backup is in `backups\`. Send `scripts\logs.bat` output to the developer. |
| "I deleted `.env`" | Restore `env.backup` from your most recent `backups\fms-*` folder to `.env`, then `start.bat`. If no backup exists, run `start.bat` (it makes a new `.env`) – existing data is still there but everyone must log in again. |
| Need a totally clean reinstall **keeping data** | `stop.bat`, then `start.bat`. The volume is reused automatically. |
| Move the app to a new PC | Run `backup.bat` on the old PC, copy the `backups\` folder to a USB drive. Run `FertilizerShopSetup.exe` on the new PC like a normal first install, then copy that `backups\` folder into the new `C:\Program Files\Fertilizer Shop\` and run `scripts\restore.bat <backup>` there. |

---

# 🏗️ Application reference

## Tech Stack (MERN)
| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Axios (CRA build, served by nginx) |
| Backend | Node.js 20, Express.js |
| Database | MongoDB 7 + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Packaging | Docker, Docker Compose, GitHub Actions → GHCR |

## Project Structure
```
Fertilizer_Management_System/
├── installer/FertilizerShop.iss ← Inno Setup source → compiles to FertilizerShopSetup.exe (sponsor runs this ONCE)
├── app.ico                     ← icon used by the installer + Desktop/Start Menu shortcuts
├── docker-compose.yml          ← 3 services + named volume
├── .env.example                ← configuration template (copy to .env)
├── VERSION / release.json      ← current app version (release.json is what the auto-updater polls)
├── .github/workflows/release.yml ← builds & pushes versioned images on a git tag
├── scripts/                    ← start / stop / restart / backup / restore / update / rollback / logs  (.bat + .sh)
│   ├── _first_run.bat          ← run once by the installer: installs Docker if missing, first start
│   ├── _start_silent.bat       ← shared no-prompt startup logic (used by _first_run + the Desktop icon)
│   ├── update.bat --quiet      ← non-interactive auto-update check (used by the Desktop icon)
│   └── _launch_hidden.vbs      ← what the Desktop/Start Menu icon runs every time (hidden window)
├── backend/
│   ├── Dockerfile
│   ├── migrate.js              ← tracked, idempotent migration runner
│   ├── migrations/             ← NNN-*.js  (001 no-op, 002 backfills isActive, 003 clears legacy default admin)
│   ├── models/                 ← User, Product, Customer, Invoice
│   ├── routes/                 ← auth, products, inventory, billing, credit, dashboard
│   ├── middleware/auth.js      ← JWT middleware
│   ├── server.js               ← Express entry (health endpoint reports version)
│   └── seed.js                 ← demo data (destructive; guarded by ALLOW_SEED)
└── frontend/
    ├── Dockerfile              ← build stage + nginx runtime
    ├── nginx.conf              ← SPA routing + /api reverse proxy
    └── src/                    ← pages, components, context/AuthContext.js, utils/api.js
```

## Features
* **Products** – CRUD, brand/category/unit, purchase vs selling price, supplier, live profit margin, quick restock.
* **Inventory & Alerts** – low stock (`qty ≤ minimumStock`), near expiry (≤ 30 days), expired, dead stock (no sale 90+ days), stock value analytics.
* **Billing** – cash / credit / partial, auto invoice numbers (`INV-2026-00001`), automatic stock deduction, discount & tax, printable invoice, record payments.
* **Credit & Borrowers** – credit limits, outstanding balance, reliability score `= (on‑time payments / total payments) × 100`, payment history, top defaulters.
* **Dashboard** – today / month / year sales & profit, 6‑month chart, alert summary, recent invoices, top products.

## Core Algorithms
```javascript
if (daysSinceLastSale > 90)            → Dead Stock
if ((expiryDate - today) <= 30 days)   → Expiry Alert
Score = (On-Time Payments / Total Payments) × 100
```

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Status + running version |
| POST | `/api/auth/login` / `/api/auth/register` | Auth |
| GET/POST | `/api/products` | List / add products |
| PUT | `/api/products/:id` | Update product |
| GET | `/api/products/alerts/summary` | Alert counts |
| POST | `/api/inventory/restock` | Add stock |
| GET | `/api/inventory/stats` | Stock statistics |
| GET/POST | `/api/billing` | List / create invoices |
| PUT | `/api/billing/:id/payment` | Record payment |
| GET/POST | `/api/credit/customers` | List / add customers |
| GET | `/api/credit/summary` | Credit analytics |
| GET | `/api/dashboard/overview` · `/sales-chart` · `/top-products` | Dashboard data |

## Environment Variables (`.env`)
| Variable | Purpose |
|---|---|
| `APP_VERSION` | Version to run (compose image tag). `update.bat` rewrites this. |
| `MONGO_IMAGE_TAG` | MongoDB image tag (default `7`). |
| `IMAGE_OWNER` | GHCR account that hosts the images. |
| `FRONTEND_PORT` | Host port for the web app (default `8080`). |
| `PORT` | Backend port inside its container (default `5000`). |
| `MONGO_URI` | `mongodb://mongo:27017/fertilizer_mgmt` (compose service name). |
| `JWT_SECRET` | Login‑token signing key. Random per install, generated once by `start.bat`. Keep secret & stable. |
| `JWT_EXPIRE` | Login validity (default `30d`). |
| `CORS_ORIGIN` | Allowed browser origins (blank = reflect request origin – fine for localhost). |

*Academic Year 2025‑26 | Shivaji University, Kolhapur*
