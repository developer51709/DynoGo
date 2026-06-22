# DynoGo

A browser-based engine dyno simulation tool built for accuracy, clarity, and usability — inspired by the old desktop dyno software that used to run on machines that no longer support it.

**[Live Demo →](https://your-username.github.io/DynoGo)**

![DynoGo Screenshot](https://placehold.co/1280x720/151b24/f97316?text=DynoGo+Engine+Simulator)

---

## What it does

DynoGo simulates a full engine dyno sweep — torque and horsepower curves across the RPM range — entirely in the browser. No server, no account, no install. Works on a phone or a desktop.

Inputs you can tune:

| Category | Controls |
|---|---|
| **Engine Geometry** | Displacement, bore, stroke, cylinders, compression ratio |
| **Camshaft** | Duration (at 0.050"), lobe separation angle (LSA), VE preset |
| **Fuel & Mixture** | Fuel type (pump gas, E30, E85, race gas, diesel), air-fuel ratio |
| **Forced Induction** | Boost pressure (psi), intercooler efficiency |
| **RPM Range** | Idle RPM, redline RPM |

Outputs updated in real time:

- Animated torque & HP curves on a Canvas graph
- Peak HP and torque with RPM
- Live data scrubber — inspect HP, torque, VE, CFM, MAF, fuel flow, thermal efficiency, friction HP, and BSFC at any RPM point
- Performance estimates (0–60, peak power in watts, peak CFM)

---

## Physics

All calculations are based on real internal combustion engine thermodynamics. No invented math.

| Formula | Source |
|---|---|
| **Volumetric Efficiency** | Gaussian bell curve shaped by cam duration and LSA (empirical from cam grinder data) |
| **Airflow (CFM)** | `CFM = displacement × RPM × VE / (2 × 1728)` — 4-stroke first principles |
| **Thermal Efficiency** | Otto cycle: `η = 1 − CR^(1−γ)` × combustion efficiency (Heywood Fig. 4-32) × real-engine factor |
| **Indicated HP** | `IHP = fuel_flow × LHV × η_thermal / 42.44` |
| **Friction HP** | Chen-Flynn correlation: `FMEP × displacement × RPM / (2 × 792,000)` |
| **Torque** | `Torque = HP × 5252 / RPM` |
| **BSFC** | `fuel_flow [lb/hr] / BHP` |

**References:**
- Heywood, J.B. — *Internal Combustion Engine Fundamentals* (1988)
- Taylor, C.F. — *The Internal Combustion Engine in Theory and Practice* (1985)
- Pulkrabek, W.W. — *Engineering Fundamentals of the Internal Combustion Engine* (2004)

---

## Tech stack

- **React + Vite** — UI and build tooling
- **TypeScript** — fully typed physics engine and components
- **Tailwind CSS v4** — styling
- **Phosphor Icons** — all icons (SVG-inlined, zero external requests)
- **HTML Canvas** — animated torque/HP graph
- **pnpm workspaces** — monorepo

100% client-side. No backend, no database, no external APIs.

---

## Running locally

Requires [Node.js 24+](https://nodejs.org) and [pnpm 10+](https://pnpm.io).

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm --filter @workspace/dynago run dev
```

The app is served at `http://localhost:<PORT>` (port is assigned automatically).

---

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow that builds and deploys automatically on every push to `main`.

### First-time setup

The workflow file is committed as `_github/workflows/deploy.yml` because Replit's GitHub integration cannot write to `.github/` directly. You need to rename it once:

**Option A — rename on GitHub (no local clone needed):**
1. Push the repo to GitHub from Replit.
2. Open `_github/workflows/deploy.yml` on GitHub and click the ✏️ pencil icon.
3. In the filename bar, change `_github` → `.github` and commit.
4. Go to **Settings → Pages → Source → GitHub Actions**.

**Option B — rename locally:**
```bash
mv _github .github
git add .github
git rm -r --cached _github
git commit -m "activate GitHub Actions"
git push
```

### What the workflow does

1. Installs pnpm + Node.js 24 on Ubuntu.
2. Runs `pnpm --filter @workspace/dynago run build` with `BASE_PATH=/`.
3. Uploads `artifacts/dynago/dist/public/` to GitHub Pages via the official `actions/deploy-pages` action.

After setup, every push to `main` deploys automatically. The site will be live at:

```
https://<your-username>.github.io/<repo-name>/
```

---

## Project structure

```
DynoGo/
├── artifacts/
│   └── dynago/               # The DynoGo web app
│       ├── src/
│       │   ├── lib/
│       │   │   └── engine.ts # Physics simulation engine
│       │   ├── components/
│       │   │   ├── DynoGraph.tsx      # Canvas-based HP/Torque graph
│       │   │   ├── EngineControls.tsx # All input sliders and selectors
│       │   │   └── ResultsPanel.tsx   # Peak stats and live data
│       │   └── pages/
│       │       └── DynoPage.tsx       # Main page layout
│       └── vite.config.ts
├── _github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions (rename folder to .github)
└── pnpm-workspace.yaml
```

---

## License

MIT
