import { useCallback, useEffect, useRef } from "react";
import type { DynoPoint, DynoResult } from "@/lib/engine";

const HP_LINE = "#38bdf8";
const HP_FILL = "rgba(56, 189, 248, 0.22)";
const TQ_LINE = "#fb923c";
const TQ_FILL = "rgba(251, 146, 60, 0.20)";

const GRID = "rgba(148, 163, 184, 0.10)";
const GRID_STRONG = "rgba(148, 163, 184, 0.24)";
const LABEL = "rgba(148, 163, 184, 0.70)";
const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace';

interface DynoGraphProps {
  result: DynoResult;
  highlightRpm?: number;
}

/** Round a raw tick spacing up to a 1/2/5 × 10ⁿ value. */
function niceStep(max: number, ticks: number): number {
  if (!(max > 0)) return 1;
  const raw = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const mult =
    norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return mult * mag;
}

export default function DynoGraph({ result, highlightRpm }: DynoGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef(1);
  const lastResultRef = useRef<DynoResult | null>(null);

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Cap at 2 — beyond that the extra samples buy nothing on these curves.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      if (W < 60 || H < 60) return;

      // One transform per frame; coordinates stay in CSS pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const pts = result.points;
      if (pts.length < 2) return;

      const compact = W < 360;
      const pad = {
        top: 24,
        right: compact ? 12 : 18,
        bottom: 30,
        left: compact ? 36 : 44,
      };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;
      if (plotW <= 10 || plotH <= 10) return;

      const minRpm = pts[0].rpm;
      const maxRpm = pts[pts.length - 1].rpm;
      const peakY = Math.max(...pts.map((p) => Math.max(p.hp, p.torque_lbft)));

      const yStep = niceStep(peakY * 1.05, compact ? 4 : 5);
      const yMax = Math.max(yStep, Math.ceil((peakY * 1.05) / yStep) * yStep);

      const xOf = (rpm: number) =>
        pad.left + ((rpm - minRpm) / Math.max(1, maxRpm - minRpm)) * plotW;
      const yOf = (val: number) =>
        pad.top + plotH - (Math.max(0, val) / yMax) * plotH;

      // ── horizontal grid + y labels ──
      ctx.font = `${compact ? 9 : 10}px ${MONO}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      for (let v = 0; v <= yMax + 1e-6; v += yStep) {
        const y = yOf(v);
        ctx.strokeStyle = v === 0 ? GRID_STRONG : GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();

        ctx.fillStyle = LABEL;
        ctx.fillText(String(Math.round(v)), pad.left - 7, y);
      }

      // ── vertical grid + rpm labels ──
      const range = maxRpm - minRpm;
      const rpmStep = range <= 4000 ? 500 : range <= 8000 ? 1000 : 2000;
      const firstTick = Math.ceil(minRpm / rpmStep) * rpmStep;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let rpm = firstTick; rpm <= maxRpm; rpm += rpmStep) {
        const x = xOf(rpm);
        ctx.strokeStyle = GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + plotH);
        ctx.stroke();

        ctx.fillStyle = LABEL;
        ctx.fillText(
          rpm >= 1000
            ? `${(rpm / 1000).toFixed(rpm % 1000 === 0 ? 0 : 1)}k`
            : String(rpm),
          x,
          pad.top + plotH + 9
        );
      }

      // Baseline
      ctx.strokeStyle = GRID_STRONG;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top + plotH);
      ctx.lineTo(pad.left + plotW, pad.top + plotH);
      ctx.stroke();

      // ── curves ──
      const visible = Math.max(2, Math.round(pts.length * progress));
      const shown = pts.slice(0, visible);
      const baseY = pad.top + plotH;

      const series = (
        get: (p: DynoPoint) => number,
        line: string,
        fillTop: string
      ) => {
        if (shown.length < 2) return;

        const grad = ctx.createLinearGradient(0, pad.top, 0, baseY);
        grad.addColorStop(0, fillTop);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        shown.forEach((p, i) => {
          const x = xOf(p.rpm);
          const y = yOf(get(p));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(xOf(shown[shown.length - 1].rpm), baseY);
        ctx.lineTo(xOf(shown[0].rpm), baseY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        shown.forEach((p, i) => {
          const x = xOf(p.rpm);
          const y = yOf(get(p));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      };

      series((p) => p.torque_lbft, TQ_LINE, TQ_FILL);
      series((p) => p.hp, HP_LINE, HP_FILL);

      // ── peak callouts ──
      if (progress > 0.9) {
        const marker = (
          rpm: number,
          val: number,
          color: string,
          label: string
        ) => {
          const x = xOf(rpm);
          const y = yOf(val);

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "rgba(7, 10, 16, 0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = `600 ${compact ? 9 : 10}px Inter, system-ui, sans-serif`;
          const tw = ctx.measureText(label).width;
          const bw = tw + 10;
          const bh = 16;
          const bx = Math.min(
            Math.max(pad.left, x + 8),
            pad.left + plotW - bw
          );
          const by = Math.max(pad.top, y - bh - 8);

          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 4);
          ctx.fillStyle = "rgba(9, 13, 20, 0.88)";
          ctx.fill();
          ctx.strokeStyle = "rgba(148, 163, 184, 0.20)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, bx + 5, by + bh / 2 + 0.5);
        };

        marker(
          result.peak_torque_rpm,
          result.peak_torque,
          TQ_LINE,
          `${Math.round(result.peak_torque)} lb·ft`
        );
        marker(
          result.peak_hp_rpm,
          result.peak_hp,
          HP_LINE,
          `${Math.round(result.peak_hp)} hp`
        );
      }

      // ── cursor ──
      if (highlightRpm != null && progress >= 1) {
        const x = xOf(highlightRpm);
        if (x >= pad.left && x <= pad.left + plotW) {
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "rgba(226, 232, 240, 0.32)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, pad.top);
          ctx.lineTo(x, baseY);
          ctx.stroke();
          ctx.restore();

          const near = pts.reduce((a, b) =>
            Math.abs(b.rpm - highlightRpm) < Math.abs(a.rpm - highlightRpm)
              ? b
              : a
          );

          for (const [val, color] of [
            [near.torque_lbft, TQ_LINE],
            [near.hp, HP_LINE],
          ] as const) {
            ctx.beginPath();
            ctx.arc(x, yOf(val), 3.5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "rgba(7, 10, 16, 0.95)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    },
    [result, highlightRpm]
  );

  // Animate on a new result; redraw immediately when only the cursor moves.
  useEffect(() => {
    const resultChanged = lastResultRef.current !== result;
    lastResultRef.current = result;

    cancelAnimationFrame(rafRef.current);

    if (!resultChanged) {
      progressRef.current = 1;
      draw(1);
      return;
    }

    const start = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      progressRef.current = eased;
      draw(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [result, draw]);

  // Keep the backing store in sync with the CSS box.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw(progressRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      aria-label="Torque and horsepower curves across the RPM range"
    />
  );
}
