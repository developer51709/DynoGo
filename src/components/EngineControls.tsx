import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { EngineParams, FuelType } from "@/lib/engine";
import {
  FUEL_PROPERTIES,
  boostDensityRatio,
  boreStrokeToDisplacement,
  ciToLiters,
  manifoldTempF,
} from "@/lib/engine";

interface EngineControlsProps {
  params: EngineParams;
  onChange: (p: EngineParams) => void;
}

/* ───────────────────────── primitives ───────────────────────── */

const svg = (path: string, size = 15) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden
  >
    <path d={path} />
  </svg>
);

const ICON = {
  engine:
    "M256,120v48a16,16,0,0,1-16,16H227.31L192,219.31A15.86,15.86,0,0,1,180.69,224H103.31A15.86,15.86,0,0,1,92,219.31L52.69,180A15.86,15.86,0,0,1,48,168.69V148H24v24a8,8,0,0,1-16,0V108a8,8,0,0,1,16,0v24H48V80A16,16,0,0,1,64,64h60V40H100a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16H140V64h40.69A15.86,15.86,0,0,1,192,68.69L227.31,104H240A16,16,0,0,1,256,120Z",
  cam: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,1,1-48-48A48.05,48.05,0,0,1,176,128Zm-16,0a32,32,0,1,0-32,32A32,32,0,0,0,160,128Z",
  fuel: "M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM144,120H80a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Z",
  boost:
    "M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17Z",
  rpm: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z",
  gauge:
    "M240,152v24a16,16,0,0,1-16,16H115.93a4,4,0,0,1-3.24-6.35L174.27,101a8.21,8.21,0,0,0-1.37-11.3,8,8,0,0,0-11.37,1.61l-72,99.06A4,4,0,0,1,86.25,192H32a16,16,0,0,1-16-16V153.13c0-1.79,0-3.57.13-5.33a4,4,0,0,1,4-3.8H48a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,47.73,128H23.92a4,4,0,0,1-3.87-5c12-43.84,49.66-77.13,95.52-82.28a4,4,0,0,1,4.43,4V72a8,8,0,0,0,8.53,8A8.17,8.17,0,0,0,136,71.73V44.67a4,4,0,0,1,4.43-4A112.18,112.18,0,0,1,236.23,123a4,4,0,0,1-3.88,5H208.27a8.17,8.17,0,0,0-8.25,7.47,8,8,0,0,0,8,8.53h27.92a4,4,0,0,1,4,3.86C240,149.23,240,150.61,240,152Z",
};

function Section({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-card-border bg-card/70 p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary/90">{icon}</span>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {hint ? (
          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  // Keep the field in sync when the slider (or a preset) changes the value.
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  // Apply only complete, in-range values so typing "4500" isn't clamped at "4".
  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) return;
    if (parsed !== value) onChange(parsed);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-foreground/75">
          {label}
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/50 px-1.5 py-0.5 focus-within:border-primary/60">
          <input
            type="number"
            value={draft}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              setDraft(e.target.value);
              commit(e.target.value);
            }}
            onBlur={() => setDraft(String(value))}
            className="w-14 bg-transparent text-right font-mono text-xs font-semibold tabular-nums text-foreground outline-none"
          />
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--fill": `${pct}%` } as CSSProperties}
        className="mt-1"
        aria-label={label}
      />
      <div className="flex justify-between font-mono text-[9.5px] tabular-nums text-muted-foreground/50">
        <span>
          {min.toFixed(decimals)}
          {unit}
        </span>
        <span>
          {max.toFixed(decimals)}
          {unit}
        </span>
      </div>
    </div>
  );
}

function Choice<T extends string | number>({
  options,
  value,
  onSelect,
  columns = "grid-cols-4",
}: {
  options: { label: string; value: T }[];
  value: T;
  onSelect: (v: T) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${columns}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onSelect(o.value)}
            className={`rounded-lg border px-1 py-1.5 text-[11.5px] font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-secondary/40 text-secondary-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Readout({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5">
      <div className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {value}
        <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
          {unit}
        </span>
      </div>
      <div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-muted-foreground/80">
        {label}
      </div>
    </div>
  );
}

/* ───────────────────────── panel ───────────────────────── */

export default function EngineControls({ params, onChange }: EngineControlsProps) {
  const set = useCallback(
    <K extends keyof EngineParams>(key: K, value: EngineParams[K]) => {
      onChange({ ...params, [key]: value });
    },
    [params, onChange]
  );

  const setBoreStroke = useCallback(
    (bore: number, stroke: number) => {
      onChange({
        ...params,
        bore_in: bore,
        stroke_in: stroke,
        displacement_ci: boreStrokeToDisplacement(bore, stroke, params.cylinders),
      });
    },
    [params, onChange]
  );

  const setCylinders = useCallback(
    (cyl: number) => {
      onChange({
        ...params,
        cylinders: cyl,
        displacement_ci: boreStrokeToDisplacement(
          params.bore_in,
          params.stroke_in,
          cyl
        ),
      });
    },
    [params, onChange]
  );

  const fuel = FUEL_PROPERTIES[params.fuel_type];
  const lambda = params.afr / fuel.stoich_afr;
  const afrPct = Math.min(
    100,
    Math.max(0, ((params.afr - 10.5) / (16.5 - 10.5)) * 100)
  );

  const mixture =
    lambda < 0.96
      ? { label: "Rich", tone: "text-tq" }
      : lambda > 1.04
        ? { label: "Lean", tone: "text-amber-300" }
        : { label: "Stoichiometric", tone: "text-emerald-400" };

  const density = boostDensityRatio(
    params.boost_psi,
    params.intercooler_efficiency
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Geometry ── */}
      <Section
        title="Engine geometry"
        icon={svg(ICON.engine)}
        hint={`${Math.round(params.displacement_ci)} cu in`}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[12.5px] font-medium text-foreground/75">
              Displacement
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold leading-none tabular-nums text-primary">
                {Math.round(params.displacement_ci)}
              </span>
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                cu in
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground/70">
              {ciToLiters(params.displacement_ci).toFixed(2)} L
            </div>
          </div>
          <div className="w-[46%]">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Cylinders
            </div>
            <Choice
              options={[3, 4, 6, 8, 10, 12, 16].map((n) => ({
                label: String(n),
                value: n,
              }))}
              value={params.cylinders}
              onSelect={setCylinders}
              columns="grid-cols-4"
            />
          </div>
        </div>

        <Slider
          label="Bore"
          value={params.bore_in}
          min={2.5}
          max={5}
          step={0.01}
          unit="in"
          decimals={2}
          onChange={(v) => setBoreStroke(v, params.stroke_in)}
        />
        <Slider
          label="Stroke"
          value={params.stroke_in}
          min={2.5}
          max={5}
          step={0.01}
          unit="in"
          decimals={2}
          onChange={(v) => setBoreStroke(params.bore_in, v)}
        />
        <Slider
          label="Compression ratio"
          value={params.compression_ratio}
          min={7}
          max={17}
          step={0.1}
          unit=":1"
          decimals={1}
          onChange={(v) => set("compression_ratio", v)}
        />
      </Section>

      {/* ── Cam ── */}
      <Section
        title="Camshaft"
        icon={svg(ICON.cam)}
        hint={`LSA ${params.lsa.toFixed(1)}°`}
      >
        <Slider
          label='Duration @ .050"'
          value={params.cam_duration}
          min={180}
          max={320}
          step={1}
          unit="°"
          onChange={(v) => set("cam_duration", v)}
        />

        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Profile
          </div>
          <Choice
            options={[
              { label: "Stock", value: 200 },
              { label: "Street", value: 220 },
              { label: "Perf.", value: 240 },
              { label: "Stage 2", value: 260 },
              { label: "Race", value: 280 },
              { label: "Full", value: 300 },
            ]}
            value={
              [200, 220, 240, 260, 280, 300].find(
                (d) => Math.abs(params.cam_duration - d) < 3
              ) ?? -1
            }
            onSelect={(v) => set("cam_duration", v)}
            columns="grid-cols-3"
          />
        </div>

        <Slider
          label="Lobe separation"
          value={params.lsa}
          min={105}
          max={120}
          step={0.5}
          unit="°"
          decimals={1}
          onChange={(v) => set("lsa", v)}
        />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[12.5px] font-medium text-foreground/75">
              VE character
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {Math.round(50 + params.ve_preset * 40)}% peak
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={params.ve_preset}
            onChange={(e) => set("ve_preset", parseFloat(e.target.value))}
            style={
              { "--fill": `${params.ve_preset * 100}%` } as CSSProperties
            }
            aria-label="VE character"
          />
          <div className="flex justify-between text-[9.5px] text-muted-foreground/50">
            <span>Worn</span>
            <span>Optimized</span>
          </div>
        </div>
      </Section>

      {/* ── Fuel ── */}
      <Section
        title="Fuel & mixture"
        icon={svg(ICON.fuel)}
        hint={`λ ${lambda.toFixed(2)}`}
      >
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Fuel
          </div>
          <select
            value={params.fuel_type}
            onChange={(e) => set("fuel_type", e.target.value as FuelType)}
            aria-label="Fuel type"
          >
            {Object.entries(FUEL_PROPERTIES).map(([key, f]) => (
              <option key={key} value={key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <Slider
          label="Air-fuel ratio"
          value={params.afr}
          min={10.5}
          max={16.5}
          step={0.1}
          unit=":1"
          decimals={1}
          onChange={(v) => set("afr", v)}
        />

        <div className="rounded-xl border border-border/60 bg-secondary/30 px-2.5 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Mixture
            </span>
            <span className={`text-[11px] font-semibold ${mixture.tone}`}>
              {mixture.label}
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-tq via-emerald-400 to-amber-300 opacity-70"
              style={{ width: `${afrPct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${afrPct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9.5px] tabular-nums text-muted-foreground/60">
            <span>10.5</span>
            <span>stoich {fuel.stoich_afr}</span>
            <span>16.5</span>
          </div>
        </div>
      </Section>

      {/* ── Boost ── */}
      <Section
        title="Forced induction"
        icon={svg(ICON.boost)}
        hint={params.boost_psi > 0 ? `${density.toFixed(2)}× density` : "Naturally aspirated"}
      >
        <Slider
          label="Boost pressure"
          value={params.boost_psi}
          min={0}
          max={40}
          step={0.5}
          unit="psi"
          decimals={1}
          onChange={(v) => set("boost_psi", v)}
        />

        {params.boost_psi > 0 ? (
          <>
            <Slider
              label="Intercooler efficiency"
              value={params.intercooler_efficiency}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              onChange={(v) => set("intercooler_efficiency", v)}
            />
            <div className="grid grid-cols-3 gap-1.5">
              <Readout
                label="Manifold"
                value={(14.696 + params.boost_psi).toFixed(1)}
                unit="psia"
              />
              <Readout
                label="Charge"
                value={manifoldTempF(
                  params.boost_psi,
                  params.intercooler_efficiency
                ).toFixed(0)}
                unit="°F"
              />
              <Readout label="Density" value={density.toFixed(2)} unit="×" />
            </div>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground/70">
              A weaker intercooler leaves the charge hotter and less dense, so
              the same boost pressure makes less power.
            </p>
          </>
        ) : (
          <p className="text-[10.5px] leading-relaxed text-muted-foreground/70">
            Raise boost pressure to enable intercooler and charge-air readouts.
          </p>
        )}
      </Section>

      {/* ── RPM ── */}
      <Section title="Operating range" icon={svg(ICON.rpm)}>
        <Slider
          label="Idle"
          value={params.idle_rpm}
          min={400}
          max={1500}
          step={50}
          unit="rpm"
          onChange={(v) => set("idle_rpm", Math.min(v, params.redline_rpm - 1000))}
        />
        <Slider
          label="Redline"
          value={params.redline_rpm}
          min={3000}
          max={10000}
          step={100}
          unit="rpm"
          onChange={(v) =>
            set("redline_rpm", Math.max(v, params.idle_rpm + 1000))
          }
        />
      </Section>
    </div>
  );
}
