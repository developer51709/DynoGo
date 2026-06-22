import { useCallback } from "react";
import type { EngineParams, FuelType } from "@/lib/engine";
import { FUEL_PROPERTIES, boreStrokeToDisplacement, ciToLiters } from "@/lib/engine";

interface SliderRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({
  icon, label, value, min, max, step, unit, format, onChange,
}: SliderRowProps) {
  const display = format ? format(value) : value.toString();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <span className="text-primary opacity-80">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            className="w-20 text-right text-sm font-mono bg-secondary border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground w-10 shrink-0">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground/60">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="rounded-xl bg-card border border-card-border p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

interface EngineControlsProps {
  params: EngineParams;
  onChange: (p: EngineParams) => void;
}

export default function EngineControls({ params, onChange }: EngineControlsProps) {
  const set = useCallback(
    <K extends keyof EngineParams>(key: K, value: EngineParams[K]) => {
      onChange({ ...params, [key]: value });
    },
    [params, onChange]
  );

  const handleBoreStroke = useCallback(
    (bore: number, stroke: number) => {
      const disp = boreStrokeToDisplacement(bore, stroke, params.cylinders);
      onChange({ ...params, bore_in: bore, stroke_in: stroke, displacement_ci: disp });
    },
    [params, onChange]
  );

  const handleCylindersChange = useCallback(
    (cyl: number) => {
      const disp = boreStrokeToDisplacement(params.bore_in, params.stroke_in, cyl);
      onChange({ ...params, cylinders: cyl, displacement_ci: disp });
    },
    [params, onChange]
  );

  const dispLiters = ciToLiters(params.displacement_ci).toFixed(2);

  /* ── Phosphor icon SVGs ── */
  const icons = {
    engine: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M256,120v48a16,16,0,0,1-16,16H227.31L192,219.31A15.86,15.86,0,0,1,180.69,224H103.31A15.86,15.86,0,0,1,92,219.31L52.69,180A15.86,15.86,0,0,1,48,168.69V148H24v24a8,8,0,0,1-16,0V108a8,8,0,0,1,16,0v24H48V80A16,16,0,0,1,64,64h60V40H100a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16H140V64h40.69A15.86,15.86,0,0,1,192,68.69L227.31,104H240A16,16,0,0,1,256,120Z"/>
      </svg>
    ),
    cam: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,1,1-48-48A48.05,48.05,0,0,1,176,128Zm-16,0a32,32,0,1,0-32,32A32,32,0,0,0,160,128Z"/>
      </svg>
    ),
    fuel: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M230.14,70.54,185.46,25.86a8,8,0,0,0-11.32,11.32L192,55.06V72a8,8,0,0,0,3.56,6.65L208,86.43V192a8,8,0,0,1-16,0V152a24,24,0,0,0-24-24H160V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56V224H40a8,8,0,0,0,0,16H168a8,8,0,0,0,0-16H160V144h8a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V80A8,8,0,0,0,230.14,70.54ZM64,56H144V120H64Zm0,168V136H144v88Z"/>
      </svg>
    ),
    boost: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17Z"/>
      </svg>
    ),
    rpm: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z"/>
      </svg>
    ),
    gauge: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M240,152v24a16,16,0,0,1-16,16H115.93a4,4,0,0,1-3.24-6.35L174.27,101a8.21,8.21,0,0,0-1.37-11.3,8,8,0,0,0-11.37,1.61l-72,99.06A4,4,0,0,1,86.25,192H32a16,16,0,0,1-16-16V153.13c0-1.79,0-3.57.13-5.33a4,4,0,0,1,4-3.8H48a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,47.73,128H23.92a4,4,0,0,1-3.87-5c12-43.84,49.66-77.13,95.52-82.28a4,4,0,0,1,4.43,4V72a8,8,0,0,0,8.53,8A8.17,8.17,0,0,0,136,71.73V44.67a4,4,0,0,1,4.43-4A112.18,112.18,0,0,1,236.23,123a4,4,0,0,1-3.88,5H208.27a8.17,8.17,0,0,0-8.25,7.47,8,8,0,0,0,8,8.53h27.92a4,4,0,0,1,4,3.86C240,149.23,240,150.61,240,152Z"/>
      </svg>
    ),
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">

      {/* Engine Geometry */}
      <Section title="Engine Geometry" icon={icons.engine}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Cylinders</label>
            <div className="grid grid-cols-4 gap-1">
              {[4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCylindersChange(n)}
                  className={`py-1.5 text-sm rounded-md font-mono font-semibold border transition-all ${
                    params.cylinders === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {[12, 16, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCylindersChange(n)}
                  className={`py-1.5 text-sm rounded-md font-mono font-semibold border transition-all ${
                    params.cylinders === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Displacement</label>
            <div className="rounded-lg bg-secondary/60 border border-border p-3 text-center">
              <div className="text-2xl font-mono font-bold text-primary">
                {Math.round(params.displacement_ci)}
              </div>
              <div className="text-xs text-muted-foreground">cu. in.</div>
              <div className="text-sm font-mono text-foreground/70 mt-0.5">
                {dispLiters}L
              </div>
            </div>
          </div>
        </div>

        <SliderRow
          icon={<span>⊚</span>}
          label="Bore"
          value={params.bore_in}
          min={2.5}
          max={5.0}
          step={0.01}
          unit="in"
          onChange={(v) => handleBoreStroke(v, params.stroke_in)}
        />
        <SliderRow
          icon={<span>↕</span>}
          label="Stroke"
          value={params.stroke_in}
          min={2.5}
          max={5.0}
          step={0.01}
          unit="in"
          onChange={(v) => handleBoreStroke(params.bore_in, v)}
        />
        <SliderRow
          icon={icons.gauge}
          label="Compression Ratio"
          value={params.compression_ratio}
          min={7.0}
          max={17.0}
          step={0.1}
          unit=":1"
          format={(v) => v.toFixed(1)}
          onChange={(v) => set("compression_ratio", v)}
        />
      </Section>

      {/* Cam & VE */}
      <Section title="Camshaft & Volumetric Efficiency" icon={icons.cam}>
        <SliderRow
          icon={icons.cam}
          label={'Cam Duration @0.050"'}
          value={params.cam_duration}
          min={180}
          max={320}
          step={1}
          unit="°"
          onChange={(v) => set("cam_duration", v)}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80 font-medium">Cam Style</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { label: "Stock", dur: 200 },
              { label: "Street", dur: 220 },
              { label: "Perf.", dur: 240 },
              { label: "Stage 2", dur: 260 },
              { label: "Race", dur: 280 },
              { label: "Full Race", dur: 300 },
            ] as const).map((preset) => (
              <button
                key={preset.label}
                onClick={() => set("cam_duration", preset.dur)}
                className={`py-1.5 px-2 text-xs rounded-md border transition-all ${
                  Math.abs(params.cam_duration - preset.dur) < 3
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <SliderRow
          icon={icons.cam}
          label="Lobe Sep. Angle (LSA)"
          value={params.lsa}
          min={105}
          max={120}
          step={0.5}
          unit="°"
          format={(v) => v.toFixed(1)}
          onChange={(v) => set("lsa", v)}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80 font-medium">VE Tuning</span>
            <span className="text-xs text-muted-foreground font-mono">
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
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60">
            <span>Stock (worn)</span>
            <span>Optimized</span>
          </div>
        </div>
      </Section>

      {/* Fuel & AFR */}
      <Section title="Fuel & Air-Fuel Ratio" icon={icons.fuel}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
            <span className="text-primary/80">{icons.fuel}</span>
            Fuel Type
          </label>
          <select
            value={params.fuel_type}
            onChange={(e) => set("fuel_type", e.target.value as FuelType)}
          >
            {Object.entries(FUEL_PROPERTIES).map(([key, f]) => (
              <option key={key} value={key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <SliderRow
          icon={icons.fuel}
          label="Air-Fuel Ratio"
          value={params.afr}
          min={10.5}
          max={16.5}
          step={0.1}
          unit=":1"
          format={(v) => v.toFixed(1)}
          onChange={(v) => set("afr", v)}
        />

        {/* AFR indicator */}
        <div className="rounded-lg bg-secondary/40 border border-border p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Mixture</span>
            <span
              className={`text-xs font-semibold ${
                params.afr < FUEL_PROPERTIES[params.fuel_type].stoich_afr - 1.5
                  ? "text-orange-400"
                  : params.afr > FUEL_PROPERTIES[params.fuel_type].stoich_afr + 1.5
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {params.afr < FUEL_PROPERTIES[params.fuel_type].stoich_afr - 1.5
                ? "Rich"
                : params.afr > FUEL_PROPERTIES[params.fuel_type].stoich_afr + 1.5
                ? "Lean"
                : "Near Stoich"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                params.afr < FUEL_PROPERTIES[params.fuel_type].stoich_afr - 1.5
                  ? "bg-orange-500"
                  : params.afr > FUEL_PROPERTIES[params.fuel_type].stoich_afr + 1.5
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.round(
                  100 -
                    ((params.afr - 10.5) / (16.5 - 10.5)) * 100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Rich (10.5)</span>
            <span>Stoich: {FUEL_PROPERTIES[params.fuel_type].stoich_afr}</span>
            <span>Lean (16.5)</span>
          </div>
        </div>
      </Section>

      {/* Boost */}
      <Section title="Forced Induction" icon={icons.boost}>
        <SliderRow
          icon={icons.boost}
          label="Boost Pressure"
          value={params.boost_psi}
          min={0}
          max={40}
          step={0.5}
          unit="psi"
          format={(v) => v.toFixed(1)}
          onChange={(v) => set("boost_psi", v)}
        />

        {params.boost_psi > 0 && (
          <>
            <SliderRow
              icon={icons.boost}
              label="Intercooler Efficiency"
              value={params.intercooler_efficiency}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              format={(v) => Math.round(v * 100).toString()}
              onChange={(v) => set("intercooler_efficiency", v)}
            />
            <div className="rounded-md bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary/80">
              <span className="font-semibold">
                {(14.696 + params.boost_psi).toFixed(1)} psia
              </span>{" "}
              manifold pressure ·{" "}
              <span className="font-semibold">
                {((14.696 + params.boost_psi) / 14.696).toFixed(2)}×
              </span>{" "}
              density ratio
            </div>
          </>
        )}
      </Section>

      {/* RPM Range */}
      <Section title="RPM Range" icon={icons.rpm}>
        <SliderRow
          icon={icons.rpm}
          label="Idle RPM"
          value={params.idle_rpm}
          min={400}
          max={1500}
          step={50}
          unit="rpm"
          onChange={(v) => set("idle_rpm", Math.min(v, params.redline_rpm - 1000))}
        />
        <SliderRow
          icon={icons.rpm}
          label="Redline RPM"
          value={params.redline_rpm}
          min={3000}
          max={10000}
          step={100}
          unit="rpm"
          onChange={(v) => set("redline_rpm", Math.max(v, params.idle_rpm + 1000))}
        />
      </Section>
    </div>
  );
}
