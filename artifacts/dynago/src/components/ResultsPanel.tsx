import type { DynoResult, DynoPoint } from "@/lib/engine";

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  color?: "torque" | "hp" | "neutral";
  icon: React.ReactNode;
}

function StatCard({ label, value, unit, sub, color = "neutral", icon }: StatCardProps) {
  const colorClass =
    color === "torque"
      ? "text-orange-400"
      : color === "hp"
      ? "text-blue-400"
      : "text-foreground";
  const borderClass =
    color === "torque"
      ? "border-orange-500/30"
      : color === "hp"
      ? "border-blue-500/30"
      : "border-card-border";
  const bgClass =
    color === "torque"
      ? "bg-orange-500/5"
      : color === "hp"
      ? "bg-blue-500/5"
      : "bg-card";

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${bgClass} ${borderClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={`${colorClass} opacity-70`}>{icon}</span>
      </div>
      <div className={`text-3xl font-mono font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">
        {unit}
        {sub && <span className="text-muted-foreground/60 ml-2">{sub}</span>}
      </div>
    </div>
  );
}

interface LiveDataRowProps {
  label: string;
  value: string;
  unit: string;
}

function LiveRow({ label, value, unit }: LiveDataRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-mono font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

interface ResultsPanelProps {
  result: DynoResult;
  livePoint?: DynoPoint;
  highlightRpm: number;
  onHighlightRpmChange: (rpm: number) => void;
}

export default function ResultsPanel({
  result,
  livePoint,
  highlightRpm,
  onHighlightRpmChange,
}: ResultsPanelProps) {
  const pt = livePoint ?? result.points[Math.floor(result.points.length / 2)];

  /* Phosphor icons */
  const icons = {
    lightning: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17Z"/>
      </svg>
    ),
    wrench: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M218.83,103.77l-80-80A8,8,0,0,0,128,24a104,104,0,0,0,0,208,8,8,0,0,0,5.66-13.66ZM40,128a88,88,0,0,1,84.67-87.76l5.88,5.88-46.23,46.24a8,8,0,0,0,0,11.32l48,48a8,8,0,0,0,11.32,0L188,107.32l5.88,5.88A88.07,88.07,0,0,1,40,128Zm107.31,57.37L115.31,153.37l52.69-52.68,32,32Z"/>
      </svg>
    ),
    thermometer: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M148,152.4V48a20,20,0,0,0-40,0V152.4a36,36,0,1,0,40,0ZM128,56a4,4,0,0,1,4,4v4h-8V60A4,4,0,0,1,128,56Zm0,136a20,20,0,1,1,20-20A20,20,0,0,1,128,192Z"/>
      </svg>
    ),
    drop: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Z"/>
      </svg>
    ),
    wind: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M184,72a32,32,0,0,0-32-32c-13.1,0-24.8,7.92-30.29,20.43A8,8,0,0,0,136.31,70c3.35-7.9,10.45-14,19.69-14a16,16,0,0,1,0,32H24a8,8,0,0,0,0,16H156A32,32,0,0,0,184,72Zm-24,88H24a8,8,0,0,0,0,16H160a16,16,0,0,1,0,32c-9.24,0-16.34-6.1-19.69-14a8,8,0,0,0-14.6,6.43C131.2,212.08,142.9,220,156,220a32,32,0,0,0,4-63.75V156A32,32,0,0,0,160,160Zm32-48H24a8,8,0,0,0,0,16H192a16,16,0,0,1,0,32H160a8,8,0,0,0,0,16h32a32,32,0,0,0,0-64Z"/>
      </svg>
    ),
    chart: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
        <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z"/>
      </svg>
    ),
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Peak numbers */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Peak Horsepower"
          value={Math.round(result.peak_hp).toString()}
          unit="HP"
          sub={`@ ${result.peak_hp_rpm.toLocaleString()} RPM`}
          color="hp"
          icon={icons.lightning}
        />
        <StatCard
          label="Peak Torque"
          value={Math.round(result.peak_torque).toString()}
          unit="lb-ft"
          sub={`@ ${result.peak_torque_rpm.toLocaleString()} RPM`}
          color="torque"
          icon={icons.wrench}
        />
      </div>

      {/* Estimated 0-60 */}
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80 mb-3">
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z"/>
          </svg>
          <span>Performance Estimates</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-mono font-bold text-foreground">
              {(result.peak_hp / 14.2).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">est. 0–60 (s)</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-foreground">
              {Math.round((result.peak_hp * 550 * 0.85) / 1000)}k
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">peak power (W)</div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-foreground">
              {Math.round(result.peak_cfm)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">peak CFM</div>
          </div>
        </div>
      </div>

      {/* Cursor / live data */}
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80">
            {icons.chart}
            <span>Live Data at RPM</span>
          </div>
          <span className="text-sm font-mono font-bold text-foreground">
            {highlightRpm.toLocaleString()} RPM
          </span>
        </div>

        <input
          type="range"
          min={result.points[0].rpm}
          max={result.points[result.points.length - 1].rpm}
          step={50}
          value={highlightRpm}
          onChange={(e) => onHighlightRpmChange(parseInt(e.target.value))}
          className="w-full mb-3"
          aria-label="Scrub RPM"
        />

        <LiveRow
          label="Horsepower"
          value={Math.round(pt.hp).toString()}
          unit="HP"
        />
        <LiveRow
          label="Torque"
          value={Math.round(pt.torque_lbft).toString()}
          unit="lb-ft"
        />
        <LiveRow
          label="Volumetric Efficiency"
          value={(pt.ve * 100).toFixed(1)}
          unit="%"
        />
        <LiveRow
          label="Airflow (CFM)"
          value={pt.cfm.toFixed(1)}
          unit="CFM"
        />
        <LiveRow
          label="Mass Air Flow"
          value={(pt.maf_lbmin * 60).toFixed(2)}
          unit="lb/hr"
        />
        <LiveRow
          label="Fuel Flow"
          value={(pt.fuel_flow_lbmin * 60).toFixed(3)}
          unit="lb/hr"
        />
        <LiveRow
          label="Thermal Efficiency"
          value={(pt.thermal_efficiency * 100).toFixed(1)}
          unit="%"
        />
        <LiveRow
          label="Friction HP"
          value={pt.fhp.toFixed(1)}
          unit="HP"
        />
        <LiveRow
          label="BSFC"
          value={pt.bsfc.toFixed(3)}
          unit="lb/HP·hr"
        />
      </div>
    </div>
  );
}
