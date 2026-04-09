"use client";

import { useState, useMemo } from "react";
import { MOCK_COLLECTIONS } from "@/features/marketplace/mock-data";
import { Sparkline } from "@/features/marketplace/components/sparkline";
import type { NFTCollection } from "@/features/marketplace/types";

type ChartRange = "7d" | "14d" | "30d";
type ChartMetric = "floor" | "volume";

const RANGE_OPTIONS: { label: string; value: ChartRange }[] = [
  { label: "7D", value: "7d" },
  { label: "14D", value: "14d" },
  { label: "30D", value: "30d" },
];

function pctChange(data: number[]): number {
  if (data.length < 2) return 0;
  const first = data[0];
  const last = data[data.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

function PctBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        background: up ? "rgba(0,255,136,0.12)" : "rgba(255,80,80,0.12)",
        color: up ? "#00ff88" : "#ff5050",
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function _ChartTooltip({
  point,
  metric,
}: {
  point: { date: string; floor: number; volume: number };
  metric: ChartMetric;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2 text-center"
      style={{ background: "#1a1a2e", border: "1px solid #2a2a3e" }}
    >
      <p className="text-xs font-bold" style={{ color: "#00d4ff" }}>
        Ξ {metric === "floor" ? point.floor : point.volume}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
        {point.date}
      </p>
    </div>
  );
}

function CollectionChart({
  collection,
}: {
  collection: NFTCollection;
}) {
  const [range, setRange] = useState<ChartRange>("30d");
  const [metric, setMetric] = useState<ChartMetric>("floor");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sliceCount = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const slicedHistory = collection.priceHistory.slice(-sliceCount);

  const data = useMemo(
    () => slicedHistory.map((p) => (metric === "floor" ? p.floor : p.volume)),
    [slicedHistory, metric]
  );

  const change = pctChange(data);
  const hoveredPoint = hoveredIdx !== null ? slicedHistory[hoveredIdx] : null;
  const currentVal = hoveredPoint
    ? metric === "floor"
      ? hoveredPoint.floor
      : hoveredPoint.volume
    : data[data.length - 1];

  // Build interactive bar chart for the full-width view
  const maxVal = Math.max(...data) || 1;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
    >
      {/* Chart header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
            {metric === "floor" ? "FLOOR PRICE" : "VOLUME"}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black" style={{ color: "#00d4ff" }}>
              Ξ {currentVal?.toFixed(metric === "floor" ? 3 : 1)}
            </span>
            <PctBadge pct={change} />
          </div>
          {hoveredPoint && (
            <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
              {hoveredPoint.date}
            </p>
          )}
        </div>

        {/* Metric toggle */}
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid #2a2a3e" }}
        >
          {(["floor", "volume"] as ChartMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-3 py-1.5 text-xs font-semibold capitalize transition-all"
              style={
                metric === m
                  ? { background: "#1a1a2e", color: "#00d4ff" }
                  : { background: "transparent", color: "#a0a0c0" }
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart — interactive bar + line overlay */}
      <div className="relative px-4 pb-2" style={{ height: 100 }}>
        <svg
          width="100%"
          height="100"
          viewBox="0 0 320 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full"
        >
          <defs>
            <linearGradient id={`fill-${collection.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area + line using Sparkline logic inline for full-width */}
          {(() => {
            const pts = data.map((v, i) => ({
              x: (i / (data.length - 1)) * 320,
              y: 90 - ((v - Math.min(...data)) / (maxVal - Math.min(...data) || 1)) * 80,
            }));

            let linePath = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 1; i < pts.length; i++) {
              const cpx = (pts[i - 1].x + pts[i].x) / 2;
              linePath += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
            }
            const areaPath = `${linePath} L 320 100 L 0 100 Z`;
            const isUp = change >= 0;
            const lineColor = isUp ? "#00d4ff" : "#ff5050";

            return (
              <>
                <path d={areaPath} fill={`url(#fill-${collection.id})`} />
                <path d={linePath} stroke={lineColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />

                {/* Hover vertical line */}
                {hoveredIdx !== null && (
                  <line
                    x1={(hoveredIdx / (data.length - 1)) * 320}
                    y1="0"
                    x2={(hoveredIdx / (data.length - 1)) * 320}
                    y2="100"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    strokeOpacity="0.3"
                  />
                )}

                {/* Hover dot */}
                {hoveredIdx !== null && (
                  <>
                    <circle
                      cx={(hoveredIdx / (data.length - 1)) * 320}
                      cy={pts[hoveredIdx].y}
                      r="5"
                      fill={lineColor}
                      opacity="0.2"
                    />
                    <circle
                      cx={(hoveredIdx / (data.length - 1)) * 320}
                      cy={pts[hoveredIdx].y}
                      r="3"
                      fill={lineColor}
                    />
                  </>
                )}
              </>
            );
          })()}
        </svg>

        {/* Invisible hover targets */}
        <div className="absolute inset-0 flex">
          {data.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full cursor-crosshair"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={() => setHoveredIdx(i)}
              onTouchEnd={() => setHoveredIdx(null)}
            />
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-4 pb-3">
        {[0, Math.floor(sliceCount / 2), sliceCount - 1].map((idx) => (
          <span key={idx} className="text-xs" style={{ color: "#a0a0c0" }}>
            {slicedHistory[idx]?.date ?? ""}
          </span>
        ))}
      </div>

      {/* Range tabs */}
      <div
        className="flex gap-1 px-4 pb-4"
        style={{ borderTop: "1px solid #1a1a2e", paddingTop: 12 }}
      >
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              range === opt.value
                ? {
                    background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                    color: "#00d4ff",
                    border: "1px solid #00d4ff44",
                  }
                : {
                    background: "transparent",
                    color: "#a0a0c0",
                    border: "1px solid transparent",
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollectionDetail({
  collection,
  onBack,
}: {
  collection: NFTCollection;
  onBack: () => void;
}) {
  const floorData = collection.priceHistory.map((p) => p.floor);
  const floorChange = pctChange(floorData);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Banner */}
      <div className="relative shrink-0">
        <div
          className="h-28 w-full"
          style={{
            background: "linear-gradient(135deg, #0f0f1a, #1a1a2e, #12121f)",
            borderBottom: "1px solid #2a2a3e",
          }}
        />
        <button
          onClick={onBack}
          className="absolute top-3 left-3 rounded-full p-2 text-sm transition-all active:scale-90"
          style={{
            background: "rgba(10,10,15,0.8)",
            color: "#a0a0c0",
            border: "1px solid #2a2a3e",
          }}
        >
          ←
        </button>
        <div
          className="absolute bottom-0 left-4 transform translate-y-1/2 w-16 h-16 rounded-2xl overflow-hidden"
          style={{ border: "2px solid #00d4ff" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={collection.image}
            alt={collection.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.id}&backgroundColor=0a0a0f`;
            }}
          />
        </div>
        {collection.verified && (
          <div
            className="absolute bottom-2 right-4 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: "rgba(0,212,255,0.15)",
              color: "#00d4ff",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            ✓ Verified
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-10">
        {/* Name + description */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{collection.name}</h2>
            <PctBadge pct={floorChange} />
          </div>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#a0a0c0" }}>
            {collection.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Floor Price", value: `Ξ ${collection.floorPrice}`, color: "#00d4ff" },
            { label: "Volume", value: `Ξ ${collection.volumeETH}`, color: "#00ff88" },
            { label: "Items", value: collection.items.toLocaleString(), color: "#ffffff" },
            { label: "Owners", value: collection.owners.toLocaleString(), color: "#ffffff" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-xs" style={{ color: "#a0a0c0" }}>
                {label}
              </p>
              <p className="text-base font-bold mt-0.5" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Price history chart */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Price History</p>
          <CollectionChart collection={collection} />
        </div>

        <button
          className="w-full rounded-xl py-4 text-sm font-bold transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
            color: "#ffffff",
          }}
        >
          Browse Collection
        </button>
      </div>
    </div>
  );
}

export function CollectionsTab() {
  const [selected, setSelected] = useState<NFTCollection | null>(null);

  if (selected) {
    return <CollectionDetail collection={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Top Collections</h3>
        <span className="text-xs" style={{ color: "#a0a0c0" }}>
          7d volume
        </span>
      </div>

      {MOCK_COLLECTIONS.map((col, index) => {
        const floorData = col.priceHistory.slice(-7).map((p) => p.floor);
        const change = pctChange(floorData);

        return (
          <button
            key={col.id}
            onClick={() => setSelected(col)}
            className="w-full rounded-xl p-3 flex items-center gap-3 transition-all active:scale-95 text-left"
            style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
          >
            {/* Rank */}
            <span
              className="text-sm font-bold w-5 shrink-0"
              style={{ color: "#a0a0c0" }}
            >
              {index + 1}
            </span>

            {/* Image */}
            <div
              className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
              style={{ border: "1px solid #2a2a3e" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${col.id}&backgroundColor=0a0a0f`;
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">
                  {col.name}
                </span>
                {col.verified && (
                  <span style={{ color: "#00d4ff" }} className="text-xs shrink-0">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: "#a0a0c0" }}>
                Floor: Ξ {col.floorPrice}
              </span>
            </div>

            {/* Sparkline + change */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Sparkline
                data={floorData}
                width={64}
                height={28}
                strokeWidth={1.5}
              />
              <PctBadge pct={change} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
