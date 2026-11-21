import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_PARAMS, runDyno } from "@/lib/engine";
import type { DynoPoint, DynoResult, EngineParams } from "@/lib/engine";
import DynoGraph from "@/components/DynoGraph";
import EngineControls from "@/components/EngineControls";
import ResultsPanel from "@/components/ResultsPanel";

type Tab = "controls" | "analysis";

const ICON = {
  engine:
    "M256,120v48a16,16,0,0,1-16,16H227.31L192,219.31A15.86,15.86,0,0,1,180.69,224H103.31A15.86,15.86,0,0,1,92,219.31L52.69,180A15.86,15.86,0,0,1,48,168.69V148H24v24a8,8,0,0,1-16,0V108a8,8,0,0,1,16,0v24H48V80A16,16,0,0,1,64,64h60V40H100a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16H140V64h40.69A15.86,15.86,0,0,1,192,68.69L227.31,104H240A16,16,0,0,1,256,120Z",
  reset:
    "M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L60.63,81.29l17,17A8,8,0,0,1,72,112H24a8,8,0,0,1-8-8V56A8,8,0,0,1,29.66,50.3L49.31,70,60.25,60A96,96,0,0,1,224,128Z",
  sliders:
    "M40,88H73a32,32,0,0,0,62,0H216a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H183a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16H121a32,32,0,0,0,62,0h33a8,8,0,0,0,0-16Zm-64,24a16,16,0,1,1,16-16A16,16,0,0,1,152,192Z",
  chart:
    "M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z",
};

function Icon({
  path,
  size = 15,
  className = "",
}: {
  path: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

function PeakStat({
  label,
  value,
  unit,
  tone,
  large = false,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "hp" | "tq" | "muted";
  large?: boolean;
}) {
  const color =
    tone === "hp"
      ? "text-hp"
      : tone === "tq"
        ? "text-tq"
        : "text-foreground/80";

  return (
    <div className="flex flex-col">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={`font-mono font-bold leading-none tabular-nums ${color} ${
            large ? "text-lg" : "text-[15px]"
          }`}
        >
          {value}
        </span>
        <span className="text-[9.5px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function PeakRow({
  result,
  large = false,
}: {
  result: DynoResult;
  large?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <PeakStat
        label="Peak hp"
        value={Math.round(result.peak_hp).toString()}
        unit="hp"
        tone="hp"
        large={large}
      />
      <span className="h-7 w-px bg-border/70" />
      <PeakStat
        label="Peak torque"
        value={Math.round(result.peak_torque).toString()}
        unit="lb·ft"
        tone="tq"
        large={large}
      />
      <span className="hidden h-7 w-px bg-border/70 sm:block" />
      <div className="hidden sm:block">
        <PeakStat
          label="Airflow"
          value={Math.round(result.peak_cfm).toString()}
          unit="CFM"
          tone="muted"
          large={large}
        />
      </div>
    </div>
  );
}

function Scrubber({
  idle,
  redline,
  value,
  onChange,
  point,
}: {
  idle: number;
  redline: number;
  value: number;
  onChange: (rpm: number) => void;
  point?: DynoPoint;
}) {
  const pct =
    redline === idle ? 0 : ((value - idle) / (redline - idle)) * 100;

  return (
    <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
      <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
        {value.toLocaleString()}
        <span className="ml-0.5 text-[9.5px] text-muted-foreground">rpm</span>
      </span>
      <input
        type="range"
        min={idle}
        max={redline}
        step={50}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ "--fill": `${pct}%` } as CSSProperties}
        className="min-w-0 flex-1"
        aria-label="Scrub RPM"
      />
      {point ? (
        <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
          <span className="text-hp">{Math.round(point.hp)}</span>
          <span className="text-tq">{Math.round(point.torque_lbft)}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function DynoPage() {
  const [params, setParams] = useState<EngineParams>(DEFAULT_PARAMS);
  const [highlightRpm, setHighlightRpm] = useState(3500);
  const [tab, setTab] = useState<Tab>("controls");

  const result = useMemo(() => runDyno(params), [params]);

  const livePoint = useMemo<DynoPoint | undefined>(() => {
    if (!result.points.length) return undefined;
    return result.points.reduce((a, b) =>
      Math.abs(a.rpm - highlightRpm) < Math.abs(b.rpm - highlightRpm) ? a : b
    );
  }, [result, highlightRpm]);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setHighlightRpm(3500);
  }, []);

  useEffect(() => {
    if (highlightRpm > params.redline_rpm) setHighlightRpm(params.redline_rpm);
    if (highlightRpm < params.idle_rpm) setHighlightRpm(params.idle_rpm);
  }, [params.idle_rpm, params.redline_rpm, highlightRpm]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <header className="flex h-13 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Icon path={ICON.engine} size={17} />
          </div>
          <div className="leading-tight">
            <div className="text-[13.5px] font-bold tracking-tight text-foreground">
              DynoGo
            </div>
            <div className="hidden text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70 sm:block">
              Engine dyno simulator
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/50 px-2.5 py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            title="Reset to defaults"
          >
            <Icon path={ICON.reset} size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ── Mobile / tablet ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card/40 px-3 py-2">
          <PeakRow result={result} />
        </div>

        <div className="h-[32dvh] min-h-[190px] shrink-0 border-b border-border/60">
          <DynoGraph result={result} highlightRpm={highlightRpm} />
        </div>

        <div className="shrink-0 border-b border-border/60 bg-card/30">
          <Scrubber
            idle={params.idle_rpm}
            redline={params.redline_rpm}
            value={highlightRpm}
            onChange={setHighlightRpm}
            point={livePoint}
          />
        </div>

        <div className="flex shrink-0 gap-1 border-b border-border/60 bg-background px-2 py-1.5">
          {(
            [
              { id: "controls" as const, label: "Controls", icon: ICON.sliders },
              { id: "analysis" as const, label: "Analysis", icon: ICON.chart },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11.5px] font-medium transition-colors ${
                tab === t.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon path={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {tab === "controls" ? (
            <EngineControls params={params} onChange={setParams} />
          ) : (
            <ResultsPanel
              result={result}
              livePoint={livePoint}
              highlightRpm={highlightRpm}
            />
          )}
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <aside className="w-[284px] shrink-0 overflow-y-auto border-r border-border/60 px-3.5 py-3.5 xl:w-[336px]">
          <EngineControls params={params} onChange={setParams} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 p-3.5">
            <div className="relative h-full overflow-hidden rounded-2xl border border-card-border bg-card/50">
              <DynoGraph result={result} highlightRpm={highlightRpm} />
              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-3 rounded-lg border border-border/50 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-3.5 rounded-full bg-hp" />
                  Horsepower
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-3.5 rounded-full bg-tq" />
                  Torque
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border/60 bg-card/30">
            <div className="flex items-center justify-between px-4 pt-2.5">
              <PeakRow result={result} large />
            </div>
            <Scrubber
              idle={params.idle_rpm}
              redline={params.redline_rpm}
              value={highlightRpm}
              onChange={setHighlightRpm}
              point={livePoint}
            />
          </div>
        </main>

        <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-border/60 px-3.5 py-3.5 xl:w-[368px]">
          <ResultsPanel
            result={result}
            livePoint={livePoint}
            highlightRpm={highlightRpm}
          />
        </aside>
      </div>
    </div>
  );
}
