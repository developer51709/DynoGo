import { useRef, useEffect, useCallback } from "react";
import type { DynoPoint, DynoResult } from "@/lib/engine";

interface DynoGraphProps {
  result: DynoResult;
  highlightRpm?: number;
}

const TORQUE_COLOR = "#f97316"; // orange-500
const HP_COLOR = "#3b82f6";     // blue-500
const GRID_COLOR = "rgba(255,255,255,0.07)";
const LABEL_COLOR = "#9ca3af";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function DynoGraph({ result, highlightRpm }: DynoGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const prevResultRef = useRef<DynoResult | null>(null);

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Padding
      const pad = { top: 24, right: 32, bottom: 52, left: 68 };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      // Scale
      const maxRpm = result.points[result.points.length - 1].rpm;
      const minRpm = result.points[0].rpm;

      // Find max values with 10% headroom
      const maxHp = Math.max(...result.points.map((p) => p.hp)) * 1.12;
      const maxTorque = Math.max(...result.points.map((p) => p.torque_lbft)) * 1.12;
      const maxY = Math.max(maxHp, maxTorque);

      function xOf(rpm: number) {
        return pad.left + ((rpm - minRpm) / (maxRpm - minRpm)) * plotW;
      }
      function yOf(val: number) {
        return pad.top + plotH - (val / maxY) * plotH;
      }

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "hsl(220, 17%, 10%)";
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;

      // Horizontal grid
      const ySteps = 5;
      for (let i = 0; i <= ySteps; i++) {
        const val = (maxY / ySteps) * i;
        const y = yOf(val);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();

        // Y-axis label
        ctx.fillStyle = LABEL_COLOR;
        ctx.font = `${9 * dpr}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(Math.round(val).toString(), pad.left - 8, y + 4);
      }

      // Vertical grid (RPM)
      const rpmRange = maxRpm - minRpm;
      const rpmStepTarget = rpmRange <= 5000 ? 500 : 1000;
      const rpmStart = Math.ceil(minRpm / rpmStepTarget) * rpmStepTarget;
      for (let rpm = rpmStart; rpm <= maxRpm; rpm += rpmStepTarget) {
        const x = xOf(rpm);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + plotH);
        ctx.stroke();

        ctx.fillStyle = LABEL_COLOR;
        ctx.font = `${11 * dpr}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          rpm >= 1000 ? `${(rpm / 1000).toFixed(1)}k` : rpm.toString(),
          x,
          pad.top + plotH + 16
        );
      }

      // Axis labels
      ctx.fillStyle = LABEL_COLOR;
      ctx.font = `bold ${12 * dpr}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("RPM", pad.left + plotW / 2, H - 6);

      ctx.save();
      ctx.translate(14, pad.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("HP / Torque (lb-ft)", 0, 0);
      ctx.restore();

      // Draw curve up to progress
      const totalPoints = result.points.length;
      const visibleCount = Math.max(2, Math.floor(totalPoints * progress));
      const visiblePoints = result.points.slice(0, visibleCount);

      function drawCurve(
        points: DynoPoint[],
        getValue: (p: DynoPoint) => number,
        color: string,
        lineWidth: number
      ) {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 * dpr;

        points.forEach((pt, i) => {
          const x = xOf(pt.rpm);
          const y = yOf(getValue(pt));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill under curve
        ctx.beginPath();
        points.forEach((pt, i) => {
          const x = xOf(pt.rpm);
          const y = yOf(getValue(pt));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        const lastX = xOf(points[points.length - 1].rpm);
        const baseY = pad.top + plotH;
        ctx.lineTo(lastX, baseY);
        ctx.lineTo(xOf(points[0].rpm), baseY);
        ctx.closePath();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      drawCurve(visiblePoints, (p) => p.torque_lbft, TORQUE_COLOR, 2.5 * dpr);
      drawCurve(visiblePoints, (p) => p.hp, HP_COLOR, 2.5 * dpr);

      // Axis border
      ctx.strokeStyle = "hsl(220, 14%, 25%)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pad.left, pad.top, plotW, plotH);

      // Peak markers (only when animation is mostly done)
      if (progress > 0.85) {
        const markerAlpha = Math.min(1, (progress - 0.85) / 0.15);
        ctx.globalAlpha = markerAlpha;

        // Peak HP marker
        const hpX = xOf(result.peak_hp_rpm);
        const hpY = yOf(result.peak_hp);
        ctx.beginPath();
        ctx.arc(hpX, hpY, 5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = HP_COLOR;
        ctx.fill();

        ctx.fillStyle = HP_COLOR;
        ctx.font = `bold ${11 * dpr}px Inter, system-ui, sans-serif`;
        ctx.textAlign = hpX > W - 120 ? "right" : "left";
        ctx.fillText(
          `${Math.round(result.peak_hp)} HP`,
          hpX + (hpX > W - 120 ? -10 : 10),
          hpY - 10
        );

        // Peak Torque marker
        const tqX = xOf(result.peak_torque_rpm);
        const tqY = yOf(result.peak_torque);
        ctx.beginPath();
        ctx.arc(tqX, tqY, 5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = TORQUE_COLOR;
        ctx.fill();

        ctx.fillStyle = TORQUE_COLOR;
        ctx.font = `bold ${11 * dpr}px Inter, system-ui, sans-serif`;
        ctx.textAlign = tqX > W - 120 ? "right" : "left";
        ctx.fillText(
          `${Math.round(result.peak_torque)} lb-ft`,
          tqX + (tqX > W - 120 ? -10 : 10),
          tqY - 10
        );

        ctx.globalAlpha = 1;
      }

      // Highlight RPM cursor
      if (highlightRpm && progress >= 1) {
        const x = xOf(highlightRpm);
        if (x >= pad.left && x <= pad.left + plotW) {
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, pad.top);
          ctx.lineTo(x, pad.top + plotH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Legend
      const legendY = pad.top + 14;
      const legendX = pad.left + plotW - 8;

      ctx.textAlign = "right";
      ctx.font = `bold ${12 * dpr}px Inter, system-ui, sans-serif`;

      ctx.fillStyle = HP_COLOR;
      ctx.fillRect(legendX - 100, legendY - 9, 20, 4);
      ctx.fillStyle = "hsl(210, 20%, 80%)";
      ctx.fillText("Horsepower", legendX, legendY);

      ctx.fillStyle = TORQUE_COLOR;
      ctx.fillRect(legendX - 100, legendY + 11, 20, 4);
      ctx.fillStyle = "hsl(210, 20%, 80%)";
      ctx.fillText("Torque (lb-ft)", legendX, legendY + 20);
    },
    [result, highlightRpm]
  );

  // Animate on result change
  useEffect(() => {
    const isFirstRun = prevResultRef.current === null;
    prevResultRef.current = result;

    if (isFirstRun) {
      progressRef.current = 0;
    } else {
      progressRef.current = 0;
    }

    cancelAnimationFrame(animFrameRef.current);

    const duration = 600; // ms
    const start = performance.now();

    function animate(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      progressRef.current = eased;
      draw(eased);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [result, draw]);

  // Redraw on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      draw(progressRef.current);
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      aria-label="Torque and horsepower curve graph"
    />
  );
}
