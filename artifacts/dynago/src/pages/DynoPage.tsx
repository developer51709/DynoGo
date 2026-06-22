import { useState, useMemo, useCallback, useRef } from "react";
import { runDyno, DEFAULT_PARAMS, ciToLiters } from "@/lib/engine";
import type { EngineParams, DynoPoint } from "@/lib/engine";
import DynoGraph from "@/components/DynoGraph";
import EngineControls from "@/components/EngineControls";
import ResultsPanel from "@/components/ResultsPanel";

export default function DynoPage() {
  const [params, setParams] = useState<EngineParams>(DEFAULT_PARAMS);
  const [highlightRpm, setHighlightRpm] = useState(3500);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"controls" | "results">("controls");
  const controlsRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => runDyno(params), [params]);

  // Find the live data point closest to highlightRpm
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

  /* ── Phosphor icon SVGs ── */
  const icons = {
    menu: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>
      </svg>
    ),
    close: (
      <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
      </svg>
    ),
    reset: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,128a96,96,0,1,1-96-96,96.11,96.11,0,0,1,96,96Zm-96-80a79.48,79.48,0,0,0-56.39,23.39L48,48a8,8,0,0,0-8,8V96a8,8,0,0,0,8,8H88a8,8,0,0,0,5.66-13.66L76.49,73.17A64,64,0,1,1,128,192a64.14,64.14,0,0,1-48.53-22.33,8,8,0,1,0-12.09,10.49A80,80,0,1,0,128,48Z"/>
      </svg>
    ),
    github: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68Z"/>
      </svg>
    ),
    sliders: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M40,88H73a32,32,0,0,0,62,0H216a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H183a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16H121a32,32,0,0,0,62,0h33a8,8,0,0,0,0-16Zm-64,24a16,16,0,1,1,16-16A16,16,0,0,1,152,192Z"/>
      </svg>
    ),
    chart: (
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
        <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z"/>
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a16,16,0,1,1,16,16A16,16,0,0,1,112,84Z"/>
      </svg>
    ),
  };

  const dispLiters = ciToLiters(params.displacement_ci).toFixed(2);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-border bg-card/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? icons.close : icons.menu}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" className="text-primary">
                <path d="M232,96H216V80a8,8,0,0,0-8-8H156.94l-13.72-27.43A8,8,0,0,0,136,40H120a8,8,0,0,0-7.22,4.57L98.94,72H48a8,8,0,0,0-8,8v16H24a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8H40v16a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V176h16a8,8,0,0,0,8-8V104A8,8,0,0,0,232,96ZM224,160H208a8,8,0,0,0-8,8v16H56V168a8,8,0,0,0-8-8H32V112H48a8,8,0,0,0,8-8V96H104a8,8,0,0,0,7.22-4.57L124.94,64h6.12l13.72,27.43A8,8,0,0,0,152,96h48v8a8,8,0,0,0,8,8h16Z"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-bold text-foreground tracking-tight">DynoGo</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                Engine Simulation
              </span>
            </div>
          </div>
        </div>

        {/* Engine summary chip */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" className="text-primary">
            <path d="M232,96H216V80a8,8,0,0,0-8-8H156.94l-13.72-27.43A8,8,0,0,0,136,40H120a8,8,0,0,0-7.22,4.57L98.94,72H48a8,8,0,0,0-8,8v16H24a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8H40v16a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V176h16a8,8,0,0,0,8-8V104A8,8,0,0,0,232,96Z"/>
          </svg>
          <span>
            {Math.round(params.displacement_ci)}ci ({dispLiters}L) ·{" "}
            {params.cylinders}-cyl ·{" "}
            {params.compression_ratio.toFixed(1)}:1 CR
            {params.boost_psi > 0 && (
              <span className="text-primary ml-1.5">
                · +{params.boost_psi.toFixed(1)} psi boost
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
            title="Reset to defaults"
          >
            {icons.reset}
            <span className="hidden sm:inline">Reset</span>
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
            title="GitHub Pages deployment info"
          >
            {icons.github}
            <span className="hidden sm:inline">Deploy</span>
          </a>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Sidebar / Controls ── */}
        <aside
          className={`
            shrink-0 w-80 flex flex-col border-r border-border bg-background overflow-hidden
            transition-all duration-300
            ${sidebarOpen ? "w-80" : "w-0 overflow-hidden"}
            lg:w-80 lg:flex
          `}
        >
          {/* Mobile tabs */}
          <div className="flex border-b border-border shrink-0 lg:hidden">
            <button
              onClick={() => setActiveTab("controls")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "controls"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {icons.sliders}
              Controls
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "results"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {icons.chart}
              Results
            </button>
          </div>

          {/* Scrollable controls */}
          <div
            ref={controlsRef}
            className={`flex-1 overflow-y-auto p-3 min-h-0 ${
              activeTab === "results" ? "hidden lg:block" : ""
            }`}
          >
            <EngineControls params={params} onChange={setParams} />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Graph area */}
          <div className="flex-1 min-h-0 relative bg-background p-3">
            <div className="w-full h-full min-h-[280px] rounded-xl border border-border overflow-hidden">
              <DynoGraph result={result} highlightRpm={highlightRpm} />
            </div>
          </div>

          {/* Results strip — desktop: horizontal row at bottom; shows key stats */}
          <div className="shrink-0 border-t border-border bg-card/40 px-4 py-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* Peak stats */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <div className="text-xl font-mono font-bold text-blue-400">
                      {Math.round(result.peak_hp)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      HP @ {result.peak_hp_rpm.toLocaleString()} RPM
                    </div>
                  </div>
                </div>
                <div className="w-px bg-border" />
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <div>
                    <div className="text-xl font-mono font-bold text-orange-400">
                      {Math.round(result.peak_torque)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      lb-ft @ {result.peak_torque_rpm.toLocaleString()} RPM
                    </div>
                  </div>
                </div>
                <div className="w-px bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2.5">
                  <div>
                    <div className="text-xl font-mono font-bold text-foreground/80">
                      {result.peak_cfm.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">CFM peak</div>
                  </div>
                </div>
              </div>

              {/* Live RPM scrubber */}
              <div className="flex items-center gap-3 flex-1 max-w-sm min-w-48">
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" className="text-muted-foreground shrink-0">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm56-88a8,8,0,0,1-8,8H136a8,8,0,0,1-8-8V80a8,8,0,0,1,16,0v40h32A8,8,0,0,1,184,128Z"/>
                </svg>
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
                <span className="text-sm font-mono text-foreground/70 w-16 text-right shrink-0">
                  {highlightRpm.toLocaleString()} rpm
                </span>
              </div>

              {/* Live values */}
              {livePoint && (
                <div className="hidden md:flex items-center gap-4 text-sm font-mono">
                  <div className="flex flex-col items-end">
                    <span className="text-blue-400 font-bold">{Math.round(livePoint.hp)} HP</span>
                    <span className="text-xs text-muted-foreground">at cursor</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-orange-400 font-bold">{Math.round(livePoint.torque_lbft)} lb-ft</span>
                    <span className="text-xs text-muted-foreground">at cursor</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-foreground/70 font-semibold">{(livePoint.ve * 100).toFixed(1)}%</span>
                    <span className="text-xs text-muted-foreground">VE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── Right panel: Results (desktop) ── */}
        <aside className="hidden lg:flex shrink-0 w-72 flex-col border-l border-border bg-background overflow-y-auto p-3 gap-0">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary/80 mb-3 px-1">
            {icons.chart}
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

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-border/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground/50 bg-background">
        <div className="flex items-center gap-1.5">
          {icons.info}
          <span>Physics: Heywood (1988) · Taylor (1985) · Pulkrabek (2004)</span>
        </div>
        <span>DynoGo — 100% client-side</span>
      </footer>

      {/* ── Mobile overlay sidebar ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 bottom-0 w-80 z-30 flex flex-col bg-background border-r border-border lg:hidden overflow-hidden">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <span className="font-bold text-foreground">Engine Controls</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              {icons.close}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <EngineControls params={params} onChange={setParams} />
          </div>
        </div>
      )}
    </div>
  );
}
