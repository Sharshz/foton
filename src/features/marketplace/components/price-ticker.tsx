"use client";

import { useEffect, useRef } from "react";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import { MOCK_COLLECTIONS } from "@/features/marketplace/mock-data";

// Static collection floor data from mock
const FLOOR_ITEMS = MOCK_COLLECTIONS.slice(0, 4).map((c) => ({
  label: c.name.split(" ")[0], // first word only for brevity
  floor: c.floorPrice,
}));

function TickerItem({
  label,
  value,
  change,
  prefix = "",
}: {
  label: string;
  value: string;
  change?: number | null;
  prefix?: string;
}) {
  const up = change === undefined || change === null || change >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 shrink-0">
      <span className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
        {label}
      </span>
      <span className="text-xs font-bold text-white">
        {prefix}{value}
      </span>
      {change !== undefined && change !== null && (
        <span
          className="text-xs font-semibold"
          style={{ color: up ? "#00ff88" : "#ff5050" }}
        >
          {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
      )}
      <span style={{ color: "#2a2a3e", fontSize: 10 }}>•</span>
    </span>
  );
}

export function PriceTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  const { data: prices } = useSimplePrice(
    ["ethereum", "bitcoin"],
    ["usd"],
    { include24hrChange: true },
    { refetchInterval: 60_000 }
  );

  const ethPrice = prices?.ethereum?.usd;
  const ethChange = (prices?.ethereum as Record<string, number> | undefined)?.["usd_24h_change"] ?? null;
  const btcPrice = prices?.bitcoin?.usd;
  const btcChange = (prices?.bitcoin as Record<string, number> | undefined)?.["usd_24h_change"] ?? null;

  // CSS marquee animation via inline keyframes — no JS needed
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const totalWidth = el.scrollWidth / 2; // duplicated content
    el.style.setProperty("--ticker-width", `${totalWidth}px`);
  }, [ethPrice]);

  const items = (
    <>
      {ethPrice && (
        <TickerItem
          label="ETH"
          value={`$${ethPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          change={ethChange}
        />
      )}
      {btcPrice && (
        <TickerItem
          label="BTC"
          value={`$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          change={btcChange}
        />
      )}
      {FLOOR_ITEMS.map((item) => (
        <TickerItem
          key={item.label}
          label={item.label}
          value={`Ξ ${item.floor}`}
          change={null}
          prefix=""
        />
      ))}
    </>
  );

  return (
    <div
      className="shrink-0 overflow-hidden flex items-center"
      style={{
        height: 28,
        background: "#0d0d18",
        borderBottom: "1px solid #1a1a2e",
      }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--ticker-width, 50%))); }
        }
        .ticker-track {
          display: flex;
          animation: ticker-scroll 28s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div ref={trackRef} className="ticker-track whitespace-nowrap">
        {/* Render twice for seamless loop */}
        {items}
        {items}
      </div>
    </div>
  );
}
