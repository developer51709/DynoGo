import { estimateZeroToSixtySeconds, hpToKw } from "@/lib/engine";
import type { DynoPoint, DynoResult } from "@/lib/engine";

interface ResultsPanelProps {
  result: DynoResult;
  livePoint?: DynoPoint;
  highlightRpm: number;
}

function PeakCard({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
  tone: "hp" | "tq";
}) {
  const accent = tone === "hp" ? "text-hp" : "text-tq";
  const ring = tone === "hp" ? "border-hp/25" : "border-tq/25";
  const glow = tone === "hp" ? "bg-hp/8" : "bg-tq/8";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${ring} ${glow} p-4`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={`font-mono text-[30px] font-bold leading-none tabular-nums ${accent}`}
        >
          {value}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {unit}
        </span>
      </div>
      <div className="mt-2 font-mono text-[11px] tabular-nums text-muted-foreground/80">
        {sub}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 px-2.5 py-2.5 text-center">
      <div className="font-mono text-base font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {unit}
      </div>
      <div className="sr-only">{label}</div>
    </div>
  );
}

function Row({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px]">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-[12.5px] font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="w-14 text-right text-[10px] text-muted-foreground">
          {unit}
        </span>
      </span>
    </div>
  );
}

export default function ResultsPanel({
  result,
  livePoint,
  highlightRpm,
}: ResultsPanelProps) {
  const pt =
    livePoint ?? result.points[Math.floor(result.points.length / 2)] ?? null;

  const zeroSixty = estimateZeroToSixtySeconds(result.peak_hp);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <PeakCard
          label="Peak power"
          value={Math.round(result.peak_hp).toString()}
          unit="hp"
          sub={`@ ${result.peak_hp_rpm.toLocaleString()} rpm`}
          tone="hp"
        />
        <PeakCard
          label="Peak torque"
          value={Math.round(result.peak_torque).toString()}
          unit="lb·ft"
          sub={`@ ${result.peak_torque_rpm.toLocaleString()} rpm`}
          tone="tq"
        />
      </div>

      <div className="rounded-2xl border border-card-border bg-card/70 p-3.5">
        <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Estimates
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Tile
            label="Estimated zero to sixty"
            value={zeroSixty != null ? zeroSixty.toFixed(1) : "—"}
            unit="0–60 s"
          />
          <Tile
            label="Peak power in kilowatts"
            value={Math.round(hpToKw(result.peak_hp)).toString()}
            unit="kW"
          />
          <Tile
            label="Peak airflow"
            value={Math.round(result.peak_cfm).toString()}
            unit="CFM"
          />
        </div>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-muted-foreground/70">
          0–60 assumes a 1,600 kg reference car; a dyno measures engine output,
          not vehicle acceleration.
        </p>
      </div>

      <div className="rounded-2xl border border-card-border bg-card/70 px-3.5 py-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Live data
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {highlightRpm.toLocaleString()}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              rpm
            </span>
          </span>
        </div>

        {pt ? (
          <div className="divide-y divide-border/40">
            <Row
              label="Horsepower"
              value={Math.round(pt.hp).toString()}
              unit="hp"
            />
            <Row
              label="Torque"
              value={Math.round(pt.torque_lbft).toString()}
              unit="lb·ft"
            />
            <Row
              label="Volumetric efficiency"
              value={(pt.ve * 100).toFixed(1)}
              unit="%"
            />
            <Row label="Airflow" value={pt.cfm.toFixed(0)} unit="CFM" />
            <Row
              label="Mass air flow"
              value={(pt.maf_lbmin * 60).toFixed(0)}
              unit="lb/hr"
            />
            <Row
              label="Fuel flow"
              value={(pt.fuel_flow_lbmin * 60).toFixed(1)}
              unit="lb/hr"
            />
            <Row
              label="Thermal efficiency"
              value={(pt.thermal_efficiency * 100).toFixed(1)}
              unit="%"
            />
            <Row label="Friction" value={pt.fhp.toFixed(1)} unit="hp" />
            <Row
              label="BSFC"
              value={pt.bsfc > 90 ? "—" : pt.bsfc.toFixed(3)}
              unit="lb/hp·hr"
            />
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No data at this RPM.
          </p>
        )}
      </div>
    </div>
  );
}
