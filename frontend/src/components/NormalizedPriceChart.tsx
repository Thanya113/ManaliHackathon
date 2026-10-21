"use client";

import React, { useState } from "react";

interface NormalizedPricePoint {
  date: string;
  p1Norm: number;
  p2Norm: number;
  leg1Label?: string;
  leg2Label?: string;
}

interface NormalizedPriceChartProps {
  data: NormalizedPricePoint[];
  leg1Name?: string;
  leg2Name?: string;
  height?: number;
}

export const NormalizedPriceChart: React.FC<NormalizedPriceChartProps> = ({
  data,
  leg1Name = "Front Month (M1)",
  leg2Name = "Deferred Month (M2)",
  height = 300,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="card-gradient rounded-xl p-8 border border-[#1E3E62] flex items-center justify-center text-slate-400 text-sm">
        No price data available.
      </div>
    );
  }

  const p1Vals = data.map((d) => d.p1Norm);
  const p2Vals = data.map((d) => d.p2Norm);
  const allVals = [...p1Vals, ...p2Vals];

  const minVal = Math.floor(Math.min(...allVals) * 0.995);
  const maxVal = Math.ceil(Math.max(...allVals) * 1.005);
  const range = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / (data.length - 1 || 1)) * plotWidth;
  const getY = (val: number) => padTop + plotHeight - ((val - minVal) / range) * plotHeight;

  let pathP1 = "";
  let pathP2 = "";

  data.forEach((d, i) => {
    const x = getX(i);
    const y1 = getY(d.p1Norm);
    const y2 = getY(d.p2Norm);

    if (i === 0) {
      pathP1 += `M ${x} ${y1}`;
      pathP2 += `M ${x} ${y2}`;
    } else {
      pathP1 += ` L ${x} ${y1}`;
      pathP2 += ` L ${x} ${y2}`;
    }
  });

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Normalized Futures Price Series</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized comparison in standardized benchmark: ₹ per 10 grams @ 995 purity
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium">{leg1Name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium">{leg2Name}</span>
          </div>
        </div>
      </div>

      {hoveredPoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#071328]/80 border border-[#1E3E62]/80 text-xs">
          <div className="text-slate-400">
            Date: <span className="text-slate-200 font-semibold">{hoveredPoint.date}</span>
          </div>
          <div className="text-slate-400">
            {leg1Name}: <span className="text-amber-400 font-mono font-bold">₹{hoveredPoint.p1Norm.toLocaleString()}</span>
          </div>
          <div className="text-slate-400">
            {leg2Name}: <span className="text-cyan-400 font-mono font-bold">₹{hoveredPoint.p2Norm.toLocaleString()}</span>
          </div>
          <div className="text-slate-400">
            Spread:{" "}
            <span className="text-emerald-400 font-mono font-bold">
              +₹{(hoveredPoint.p2Norm - hoveredPoint.p1Norm).toFixed(2)}/10g
            </span>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
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
                  stroke="#1E3E62"
                  strokeDasharray="3 3"
                  strokeOpacity="0.4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ₹{Math.round(val).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Leg 2 Line (Cyan) */}
          <path d={pathP2} fill="none" stroke="#38BDF8" strokeWidth="2.5" />

          {/* Leg 1 Line (Amber) */}
          <path d={pathP1} fill="none" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Hover effects */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={svgHeight - padBottom}
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].p1Norm)}
                r="5"
                fill="#F59E0B"
                stroke="#071328"
                strokeWidth="2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].p2Norm)}
                r="5"
                fill="#38BDF8"
                stroke="#071328"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Interactive Mouse Tracking Columns */}
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

          {/* X Axis Labels */}
          {[0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1].map(
            (idx) => {
              if (idx < 0 || idx >= data.length) return null;
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={svgHeight - padBottom + 18}
                  fill="#94A3B8"
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
