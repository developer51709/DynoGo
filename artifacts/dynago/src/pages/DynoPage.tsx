import { useState, useMemo, useCallback, useEffect } from "react";
import { runDyno, DEFAULT_PARAMS, ciToLiters } from "@/lib/engine";
import type { EngineParams, DynoPoint } from "@/lib/engine";
import DynoGraph from "@/components/DynoGraph";
import EngineControls from "@/components/EngineControls";
import ResultsPanel from "@/components/ResultsPanel";

type MobileTab = "controls" | "results";

/* ── Phosphor icon paths ── */
const ICONS = {
  engine: "M256,120v48a16,16,0,0,1-16,16H227.31L192,219.31A15.86,15.86,0,0,1,180.69,224H103.31A15.86,15.86,0,0,1,92,219.31L52.69,180A15.86,15.86,0,0,1,48,168.69V148H24v24a8,8,0,0,1-16,0V108a8,8,0,0,1,16,0v24H48V80A16,16,0,0,1,64,64h60V40H100a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16H140V64h40.69A15.86,15.86,0,0,1,192,68.69L227.31,104H240A16,16,0,0,1,256,120Z",
  reset: "M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L60.63,81.29l17,17A8,8,0,0,1,72,112H24a8,8,0,0,1-8-8V56A8,8,0,0,1,29.66,50.3L49.31,70,60.25,60A96,96,0,0,1,224,128Z",
  sliders: "M40,88H73a32,32,0,0,0,62,0H216a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H183a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16H121a32,32,0,0,0,62,0h33a8,8,0,0,0,0-16Zm-64,24a16,16,0,1,1,16-16A16,16,0,0,1,152,192Z",
  chart: "M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z",
  info: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a16,16,0,1,1,16,16A16,16,0,0,1,112,84Z",
  clock: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z",
};

function Icon({ path, size = 16, className = "" }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}

export default function DynoPage() {
  const [params, setParams] = useState<EngineParams>(DEFAULT_PARAMS);
  const [highlightRpm, setHighlightRpm] = useState(3500);
  const [mobileTab, setMobileTab] = useState<MobileTab>("controls");

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

  // Keep highlightRpm in range if redline changes
  useEffect(() => {
    if (highlightRpm > params.redline_rpm) setHighlightRpm(params.redline_rpm);
    if (highlightRpm < params.idle_rpm) setHighlightRpm(params.idle_rpm);
  }, [params.redline_rpm, params.idle_rpm]);

  const dispLiters = ciToLiters(params.displacement_ci).toFixed(2);

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">

      {/* ══ HEADER ══ */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14 border-b border-border bg-card/70 backdrop-blur-sm z-10">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Icon path={ICONS.engine} size={16} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-foreground tracking-tight">DynoGo</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">Engine Simulation</span>
          </div>
        </div>

        {/* Peak stats pill — always visible on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-2.5 py-1 text-xs font-mono">
            <span className="text-blue-400 font-bold">{Math.round(result.peak_hp)}<span className="font-normal text-muted-foreground ml-0.5">hp</span></span>
            <span className="text-border">·</span>
            <span className="text-orange-400 font-bold">{Math.round(result.peak_torque)}<span className="font-normal text-muted-foreground ml-0.5">lb-ft</span></span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-secondary border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
            title="Reset to defaults"
          >
            <Icon path={ICONS.reset} size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ══ MOBILE LAYOUT (< lg) ══ */}
      <div className="flex-1 flex flex-col min-h-0 lg:hidden">

        {/* Graph — always visible on mobile, fixed height */}
        <div className="shrink-0 h-[42dvh] border-b border-border bg-background">
          <DynoGraph result={result} highlightRpm={highlightRpm} />
        </div>

        {/* Mobile peak + RPM scrubber strip */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border bg-card/40">
          <span className="text-xs text-muted-foreground shrink-0">
            <Icon path={ICONS.clock} size={12} className="inline mr-1 opacity-60" />
            {highlightRpm.toLocaleString()} rpm
          </span>
          <input
            type="range"
            min={params.idle_rpm}
            max={params.redline_rpm}
            step={50}
            value={highlightRpm}
            onChange={(e) => setHighlightRpm(parseInt(e.target.value))}
            className="flex-1 min-w-0"
            aria-label="Scrub RPM"
          />
          {livePoint && (
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <span className="text-blue-400 font-semibold">{Math.round(livePoint.hp)}hp</span>
              <span className="text-orange-400 font-semibold">{Math.round(livePoint.torque_lbft)}lb</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex border-b border-border bg-card/30">
          <button
            onClick={() => setMobileTab("controls")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === "controls"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <Icon path={ICONS.sliders} size={15} />
            Controls
          </button>
          <button
            onClick={() => setMobileTab("results")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === "results"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <Icon path={ICONS.chart} size={15} />
            Analysis
          </button>
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mobileTab === "controls" ? (
            <div className="p-3">
              <EngineControls params={params} onChange={setParams} />
            </div>
          ) : (
            <div className="p-3">
              <ResultsPanel
                result={result}
                livePoint={livePoint}
                highlightRpm={highlightRpm}
                onHighlightRpmChange={setHighlightRpm}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══ DESKTOP LAYOUT (lg+) ══ */}
      <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">

        {/* Left sidebar — controls */}
        <aside className="shrink-0 w-80 flex flex-col border-r border-border bg-background overflow-y-auto">
          <div className="p-3">
            <EngineControls params={params} onChange={setParams} />
          </div>
        </aside>

        {/* Centre — graph + bottom strip */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 p-3">
            <div className="w-full h-full rounded-xl border border-border overflow-hidden">
              <DynoGraph result={result} highlightRpm={highlightRpm} />
            </div>
          </div>

          {/* Bottom stats + scrubber */}
          <div className="shrink-0 border-t border-border bg-card/40 px-4 py-3">
            <div className="flex items-center gap-4 flex-wrap">

              {/* Peak numbers */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <div className="text-xl font-mono font-bold text-blue-400">{Math.round(result.peak_hp)}</div>
                    <div className="text-xs text-muted-foreground">HP @ {result.peak_hp_rpm.toLocaleString()}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                  <div>
                    <div className="text-xl font-mono font-bold text-orange-400">{Math.round(result.peak_torque)}</div>
                    <div className="text-xs text-muted-foreground">lb-ft @ {result.peak_torque_rpm.toLocaleString()}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="text-xl font-mono font-bold text-foreground/70">{result.peak_cfm.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">CFM peak</div>
                </div>
              </div>

              {/* RPM scrubber */}
              <div className="flex items-center gap-3 flex-1 min-w-40">
                <Icon path={ICONS.clock} size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={params.idle_rpm}
                  max={params.redline_rpm}
                  step={50}
                  value={highlightRpm}
                  onChange={(e) => setHighlightRpm(parseInt(e.target.value))}
                  className="flex-1"
                  aria-label="Scrub RPM"
                />
                <span className="text-sm font-mono text-foreground/70 w-20 text-right shrink-0">
                  {highlightRpm.toLocaleString()} rpm
                </span>
              </div>

              {/* Live cursor values */}
              {livePoint && (
                <div className="flex items-center gap-4 text-sm font-mono">
                  <div className="text-right">
                    <div className="text-blue-400 font-bold">{Math.round(livePoint.hp)} HP</div>
                    <div className="text-xs text-muted-foreground">at cursor</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold">{Math.round(livePoint.torque_lbft)} lb-ft</div>
                    <div className="text-xs text-muted-foreground">at cursor</div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground/70 font-semibold">{(livePoint.ve * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">VE</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right sidebar — analysis */}
        <aside className="shrink-0 w-72 flex flex-col border-l border-border bg-background overflow-y-auto p-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80 mb-3 px-1">
            <Icon path={ICONS.chart} size={14} />
            <span>Analysis</span>
          </div>
          <ResultsPanel
            result={result}
            livePoint={livePoint}
            highlightRpm={highlightRpm}
            onHighlightRpmChange={setHighlightRpm}
          />
        </aside>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="shrink-0 border-t border-border/40 px-3 py-1.5 hidden sm:flex items-center justify-between text-xs text-muted-foreground/40 bg-background">
        <div className="flex items-center gap-1.5">
          <Icon path={ICONS.info} size={12} />
          <span>Physics: Heywood (1988) · Taylor (1985) · Pulkrabek (2004)</span>
        </div>
        <span>DynoGo — 100% client-side</span>
      </footer>
    </div>
  );
}
