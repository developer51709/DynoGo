# DynoGo

A browser-based engine dyno simulation tool built for accuracy, clarity, and usability — inspired by the old desktop dyno software that used to run on machines that no longer support it.

**[Live Demo →](https://soren.is-a.dev/DynoGo)**

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
- Performance estimates (0–60 for a 1,600 kg reference car, peak power in kW, peak CFM)

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
| **Boost Density** | `(P_man / P_atm) × (T_amb / T_man)` — compressor temperature rise with intercooler effectiveness |

**References:**
- Heywood, J.B. — *Internal Combustion Engine Fundamentals* (1988)
- Taylor, C.F. — *The Internal Combustion Engine in Theory and Practice* (1985)
- Pulkrabek, W.W. — *Engineering Fundamentals of the Internal Combustion Engine* (2004)

---

## Tech stack

- **React + Vite** — UI and build tooling
- **TypeScript** — fully typed physics engine and components
- **Tailwind CSS v4** — styling
- **Inline SVG icons** — zero external icon requests
- **HTML Canvas** — animated torque/HP graph

100% client-side. No backend, no database, no external APIs.

---

## Running locally

Requires [Node.js 24+](https://nodejs.org) and [pnpm 10+](https://pnpm.io).

```bash
pnpm install
pnpm dev            # dev server on http://localhost:3000
pnpm build          # typecheck + production build into dist/
pnpm preview        # serve the production build
pnpm typecheck      # types only
```

`PORT` and `BASE_PATH` are optional environment variables; they default to `3000` and `/`.

---

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow that builds and deploys automatically on every push to `main`.

### What the workflow does

1. Installs pnpm + Node.js 24 on Ubuntu.
2. Runs `pnpm run build` with `BASE_PATH=/DynoGo/`.
3. Uploads `dist/` to GitHub Pages via the official `actions/deploy-pages` action.

Enable **Settings → Pages → Source: GitHub Actions** once. After that, every push to `main` deploys automatically to:

```
https://<your-username>.github.io/DynoGo/
```

---

## Project structure

```
DynoGo/
├── src/
│   ├── lib/
│   │   └── engine.ts          # Physics simulation engine
│   ├── components/
│   │   ├── DynoGraph.tsx      # Canvas-based HP/Torque graph
│   │   ├── EngineControls.tsx # All input sliders and selectors
│   │   ├── ResultsPanel.tsx   # Peak stats and live data
│   │   └── ui/                # The few shadcn/ui primitives in use
│   ├── pages/
│   │   └── DynoPage.tsx       # Main page layout
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/                    # Static assets
├── .github/workflows/deploy.yml
├── index.html
├── vite.config.ts
└── package.json
```

---

## License

MIT
