"use client";

import { useState } from "react";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import { MOCK_COLLECTIONS, MOCK_NFTS } from "@/features/marketplace/mock-data";
import type { NFTItem } from "@/features/marketplace/types";

interface TrendingSectionProps {
  onSelectNFT: (nft: NFTItem) => void;
  onBidNFT: (nft: NFTItem) => void;
}

// Simulated 24h volume change per collection
const VOLUME_CHANGES: Record<string, number> = {
  "neon-genesis": +42.3,
  "void-walkers": -8.1,
  "pixel-warriors": +127.5,
  "based-punks": +18.9,
};

export function TrendingSection({ onSelectNFT, onBidNFT }: TrendingSectionProps) {
  const [activeTab, setActiveTab] = useState<"collections" | "nfts">("collections");

  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 60_000 });
  const ethUsd = prices?.ethereum?.usd ?? null;

  // Top collections sorted by 24h volume change
  const trendingCollections = [...MOCK_COLLECTIONS]
    .sort((a, b) => (VOLUME_CHANGES[b.slug] ?? 0) - (VOLUME_CHANGES[a.slug] ?? 0))
    .slice(0, 4);

  // Top NFTs by likes
  const trendingNFTs = [...MOCK_NFTS]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 6);

  return (
    <div className="shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🔥</span>
          <h2 className="text-sm font-black text-white">Trending</h2>
        </div>
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-xl"
          style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
        >
          {(["collections", "nfts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={
                activeTab === tab
                  ? { background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }
                  : { color: "#a0a0c0" }
              }
            >
              {tab === "collections" ? "Collections" : "NFTs"}
            </button>
          ))}
        </div>
      </div>

      {/* Collections */}
      {activeTab === "collections" && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
          {trendingCollections.map((col, rank) => {
            const change = VOLUME_CHANGES[col.slug] ?? 0;
            const floorUsd = ethUsd
              ? (parseFloat(col.floorPrice) * ethUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })
              : null;

            return (
              <div
                key={col.id}
                className="shrink-0 w-36 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95"
                style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
              >
                {/* Cover */}
                <div className="relative h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${col.id}&backgroundColor=0a0a0f`;
                    }}
                  />
                  {/* Rank badge */}
                  <div
                    className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: rank === 0 ? "#FFD700" : rank === 1 ? "#C0C0C0" : rank === 2 ? "#CD7F32" : "#1a1a2e", color: rank < 3 ? "#000" : "#fff" }}
                  >
                    {rank + 1}
                  </div>
                  {/* Change badge */}
                  <div
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: change >= 0 ? "rgba(0,255,136,0.15)" : "rgba(255,80,80,0.15)",
                      color: change >= 0 ? "#00ff88" : "#ff5050",
                      border: `1px solid ${change >= 0 ? "rgba(0,255,136,0.3)" : "rgba(255,80,80,0.3)"}`,
                    }}
                  >
                    {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-bold text-white truncate">{col.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#00d4ff" }}>
                        Ξ {col.floorPrice}
                      </p>
                      {floorUsd && (
                        <p className="text-xs" style={{ color: "#a0a0c0" }}>${floorUsd}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#a0a0c0" }}>Vol</p>
                      <p className="text-xs font-semibold text-white">Ξ {parseFloat(col.volumeETH).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NFTs */}
      {activeTab === "nfts" && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
          {trendingNFTs.map((nft) => {
            const priceUsd = ethUsd
              ? (parseFloat(nft.price) * ethUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })
              : null;

            return (
              <div
                key={nft.id}
                className="shrink-0 w-32 rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
              >
                {/* Image */}
                <button
                  onClick={() => onSelectNFT(nft)}
                  className="block w-full"
                >
                  <div className="h-28 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.id}`;
                      }}
                    />
                    {/* Likes */}
                    <div
                      className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                    >
                      ❤️ {nft.likes}
                    </div>
                  </div>
                </button>

                {/* Info + quick bid */}
                <div className="p-2">
                  <p className="text-xs font-bold text-white truncate">{nft.name}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#00d4ff" }}>
                    Ξ {nft.price}
                    {priceUsd && <span style={{ color: "#a0a0c0", fontWeight: 400 }}> · ${priceUsd}</span>}
                  </p>
                  <button
                    onClick={() => onBidNFT(nft)}
                    className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,255,0.3))", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    Bid USDC
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 h-px mb-1" style={{ background: "#2a2a3e" }} />
    </div>
  );
}
