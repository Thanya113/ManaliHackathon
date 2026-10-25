"use client";

import React, { useState } from "react";

interface SpreadDataPoint {
  date: string;
  spread: number;
  fairValue?: number;
  zScore?: number;
  upperBand?: number;
  lowerBand?: number;
}

interface SpreadChartProps {
  data: SpreadDataPoint[];
  title?: string;
  pairKey?: string;
  height?: number;
}

export const SpreadChart: React.FC<SpreadChartProps> = ({
  data,
  title = "Normalized Calendar Spread vs Cost-of-Carry Fair Value",
  pairKey = "GOLD APR25 - JUN25",
  height = 320,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="card-gradient rounded-xl p-8 border border-[#1E3E62] flex items-center justify-center text-slate-400 text-sm">
        No spread series data available to render chart.
      </div>
    );
  }

  // Determine min and max spread values for scaling
  const spreads = data.map((d) => d.spread);
  const fairValues = data.map((d) => d.fairValue ?? d.spread);
  const allValues = [...spreads, ...fairValues];
  
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = Math.max(20, (rawMax - rawMin) * 0.15);
  const minVal = Math.floor(rawMin - padding);
  const maxVal = Math.ceil(rawMax + padding);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / (data.length - 1 || 1)) * plotWidth;
  const getY = (val: number) => padTop + plotHeight - ((val - minVal) / range) * plotHeight;

  // Build SVG path strings
  let spreadPath = "";
  let fairPath = "";

  data.forEach((d, i) => {
    const x = getX(i);
    const ySpread = getY(d.spread);
    const yFair = getY(d.fairValue ?? d.spread);

    if (i === 0) {
      spreadPath += `M ${x} ${ySpread}`;
      fairPath += `M ${x} ${yFair}`;
    } else {
      spreadPath += ` L ${x} ${ySpread}`;
      fairPath += ` L ${x} ${yFair}`;
    }
  });

  // Zero spread horizontal axis if inside range
  const zeroY = minVal <= 0 && maxVal >= 0 ? getY(0) : null;

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <span className="text-xs text-amber-700 font-mono font-semibold">({pairKey})</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical spread divergence from institutional carry equilibrium (₹ per 10 grams)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium">Actual Spread</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
            <span className="text-slate-700 font-medium">Fair Value (Cost of Carry)</span>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Status Strip */}
      {hoveredPoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs shadow-xs">
          <div className="text-slate-600 font-medium">
            Date: <span className="text-slate-900 font-semibold">{hoveredPoint.date}</span>
          </div>
          <div className="text-slate-600">
            Actual Spread:{" "}
            <span className="text-amber-800 font-mono font-bold">₹{hoveredPoint.spread.toFixed(2)}/10g</span>
          </div>
          {hoveredPoint.fairValue !== undefined && (
            <div className="text-slate-600">
              Fair Value:{" "}
              <span className="text-sky-700 font-mono font-bold">₹{hoveredPoint.fairValue.toFixed(2)}/10g</span>
            </div>
          )}
          {hoveredPoint.zScore !== undefined && (
            <div className="text-slate-600">
              Z-Score:{" "}
              <span
                className={`font-mono font-bold ${
                  Math.abs(hoveredPoint.zScore) >= 1.8 ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {hoveredPoint.zScore >= 0 ? "+" : ""}
                {hoveredPoint.zScore.toFixed(2)}σ
              </span>
            </div>
          )}
        </div>
      )}

      {/* Responsive SVG Container */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="spreadAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padTop + pct * plotHeight;
            const val = maxVal - pct * range;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeOpacity="0.9"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ₹{Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Zero Spread Reference Line */}
          {zeroY !== null && (
            <line
              x1={padLeft}
              y1={zeroY}
              x2={svgWidth - padRight}
              y2={zeroY}
              stroke="#F43F5E"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          )}

          {/* Theoretical Cost of Carry Line (Sky Blue) */}
          <path
            d={fairPath}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeOpacity="0.9"
          />

          {/* Actual Spread Line (Amber Gold) */}
          <path d={spreadPath} fill="none" stroke="#D97706" strokeWidth="2.5" />

          {/* Hover Crosshair and Markers */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={svgHeight - padBottom}
                stroke="#D97706"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].spread)}
                r="5"
                fill="#D97706"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {data[hoverIndex].fairValue !== undefined && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].fairValue!)}
                  r="4"
                  fill="#0284C7"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Transparent mouse tracking columns for interactive hover */}
          {data.map((_, idx) => {
            const x = getX(idx);
            const colWidth = plotWidth / data.length;
            return (
              <rect
                key={idx}
                x={x - colWidth / 2}
                y={padTop}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                className="cursor-crosshair"
              />
            );
          })}

          {/* X-Axis Date Labels */}
          {[0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1].map(
            (idx) => {
              if (idx < 0 || idx >= data.length) return null;
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={svgHeight - padBottom + 18}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {data[idx].date.slice(5)}
                </text>
              );
            }
          )}
        </svg>
      </div>
    </div>
  );
};
