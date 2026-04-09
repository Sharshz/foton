"use client";

import { useState } from "react";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
import { useFotonNotifications } from "@/features/marketplace/hooks/use-foton-notifications";

// Admin FID — only this user sees real data
const ADMIN_FID = parseInt(process.env.NEXT_PUBLIC_USER_FID ?? "0");

const GENESIS_CONTRACT = "0xec63f0d5d0a3518b8f66534b5f8b1eaa668f6114";

// Mock analytics — in production query contract events + DB
const STATS = [
  { label: "Total Mints", value: "147", delta: "+12 today", color: "#00ff88" },
  { label: "Total Volume", value: "Ξ 84.2", delta: "+3.1 today", color: "#00d4ff" },
  { label: "Active Listings", value: "38", delta: "6 new", color: "#7c3aed" },
  { label: "Open Bids", value: "24", delta: "$2,140 total", color: "#ffd700" },
];

const RECENT_MINTS = [
  { address: "0x1a2b...3c4d", time: "2m ago", tokenId: 147 },
  { address: "0x5e6f...7g8h", time: "14m ago", tokenId: 146 },
  { address: "0x9i0j...1k2l", time: "28m ago", tokenId: 145 },
  { address: "0xm3n4...o5p6", time: "1h ago", tokenId: 144 },
  { address: "0xu1v2...w3x4", time: "2h ago", tokenId: 143 },
];

const COLLECTIONS = [
  { name: "Foton Genesis", contract: GENESIS_CONTRACT, supply: 2000, minted: 147, status: "live" },
  { name: "BaseMarket Genesis", contract: "0xe2e80e6fbc821052a5ba8a308eb5db9ffd07d084", supply: 0, minted: 892, status: "live" },
];

type AdminSection = "overview" | "collections" | "listings" | "bids" | "features";

const DEFAULT_FEATURES = {
  genesis_mint: true,
  usdc_bids: true,
  user_collections: true,
  secondary_market: true,
  farcaster_share: true,
  price_ticker: true,
  swap_portal: true,
};

export function AdminTab() {
  const { user } = useFarcasterUser();
  const [section, setSection] = useState<AdminSection>("overview");
  const { broadcastNewCollection } = useFotonNotifications();
  const [notifSent, setNotifSent] = useState(false);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);

  function toggleFeature(key: keyof typeof DEFAULT_FEATURES) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const isAdmin = user?.fid === ADMIN_FID;

  if (!isAdmin) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
          style={{ background: "rgba(255,80,80,0.1)", border: "2px solid rgba(255,80,80,0.3)" }}
        >
          🔒
        </div>
        <h2 className="text-xl font-black text-white mb-2">Admin Only</h2>
        <p className="text-sm" style={{ color: "#a0a0c0" }}>
          This dashboard is restricted to the app owner.
        </p>
      </div>
    );
  }

  const SECTIONS: { id: AdminSection; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "collections", label: "Collections" },
    { id: "listings", label: "Listings" },
    { id: "bids", label: "Bids" },
    { id: "features", label: "Features" },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Section tabs */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0"
              style={section === id
                ? { background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }
                : { background: "#12121f", color: "#a0a0c0", border: "1px solid #2a2a3e" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4 pb-8">

          {/* OVERVIEW */}
          {section === "overview" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Dashboard</h2>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Foton marketplace analytics</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {STATS.map(({ label, value, delta, color }) => (
                  <div key={label} className="p-4 rounded-2xl" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-xs font-semibold text-white mt-1">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{delta}</p>
                  </div>
                ))}
              </div>

              {/* Recent mints */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2a2a3e" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #2a2a3e" }}>
                  <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>RECENT MINTS — FOTON GENESIS</p>
                </div>
                <div className="divide-y" style={{ borderColor: "#2a2a3e" }}>
                  {RECENT_MINTS.map(({ address, time, tokenId }) => (
                    <div key={tokenId} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)", border: "1px solid #2a2a3e", color: "#00d4ff" }}>
                          #{tokenId}
                        </div>
                        <div>
                          <p className="text-sm text-white font-semibold">{address}</p>
                          <p className="text-xs" style={{ color: "#a0a0c0" }}>{time}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>Minted</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract links */}
              <div className="p-4 rounded-2xl space-y-3" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>CONTRACTS ON BASE</p>
                {COLLECTIONS.map(({ name, contract }) => (
                  <div key={contract} className="flex items-center justify-between">
                    <p className="text-sm text-white">{name}</p>
                    <a href={`https://basescan.org/address/${contract}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono" style={{ color: "#7c3aed" }}>
                      {contract.slice(0, 8)}…{contract.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* COLLECTIONS */}
          {section === "collections" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Collections</h2>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>All deployed contracts</p>
              </div>
              {COLLECTIONS.map(({ name, contract, supply, minted, status }) => {
                const pct = supply > 0 ? Math.round((minted / supply) * 100) : null;
                return (
                  <div key={contract} className="p-4 rounded-2xl space-y-3" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-white">{name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}>
                        {status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Minted", value: minted.toLocaleString() },
                        { label: "Supply", value: supply === 0 ? "Unlimited" : supply.toLocaleString() },
                        { label: "Progress", value: pct !== null ? `${pct}%` : "∞" },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl p-2 text-center" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
                          <p className="text-sm font-bold text-white">{value}</p>
                          <p className="text-xs" style={{ color: "#a0a0c0" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {pct !== null && (
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a2e" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00d4ff, #7c3aed)" }} />
                      </div>
                    )}
                    <a href={`https://basescan.org/address/${contract}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono block" style={{ color: "#7c3aed" }}>
                      {contract} ↗
                    </a>
                  </div>
                );
              })}
            </>
          )}

          {/* LISTINGS */}
          {section === "listings" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Active Listings</h2>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>38 NFTs listed for sale</p>
              </div>
              {[
                { name: "Foton Genesis #12", price: "0.08", lister: "0x1a2b...3c4d", age: "2h ago" },
                { name: "Based Punk #042", price: "1.20", lister: "0x5e6f...7g8h", age: "4h ago" },
                { name: "Void Walker #333", price: "0.55", lister: "0xq7r8...s9t0", age: "6h ago" },
                { name: "Neon Genesis #001", price: "0.42", lister: "0x1a2b...3c4d", age: "8h ago" },
              ].map(({ name, price, lister, age }) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#a0a0c0" }}>{lister} · {age}</p>
                  </div>
                  <p className="text-sm font-black" style={{ color: "#00d4ff" }}>Ξ {price}</p>
                </div>
              ))}
            </>
          )}

          {/* FEATURES */}
          {section === "features" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Feature Toggles</h2>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Enable or disable marketplace features</p>
              </div>
              <div className="space-y-3">
                {(Object.entries(features) as [keyof typeof DEFAULT_FEATURES, boolean][]).map(([key, enabled]) => {
                  const labels: Record<keyof typeof DEFAULT_FEATURES, { title: string; desc: string; icon: string }> = {
                    genesis_mint: { title: "Genesis Mint", desc: "Free mint for Foton Genesis collection", icon: "✨" },
                    usdc_bids: { title: "USDC Bidding", desc: "Users can bid on NFTs with USDC", icon: "💜" },
                    user_collections: { title: "User Collections", desc: "Anyone can deploy & list collections", icon: "🎨" },
                    secondary_market: { title: "Secondary Market", desc: "Buy/sell NFTs in the marketplace", icon: "🔄" },
                    farcaster_share: { title: "Farcaster Sharing", desc: "Share mints, bids & purchases to feed", icon: "🟣" },
                    price_ticker: { title: "Price Ticker", desc: "Live ETH/BTC price bar at top", icon: "📊" },
                    swap_portal: { title: "Swap Portal", desc: "ETH ↔ USDC swap via Uniswap", icon: "⇅" },
                  };
                  const { title, desc, icon } = labels[key];
                  return (
                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl"
                      style={{ background: "#12121f", border: `1px solid ${enabled ? "rgba(0,212,255,0.2)" : "#2a2a3e"}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: enabled ? "rgba(0,212,255,0.1)" : "#0a0a0f", border: `1px solid ${enabled ? "rgba(0,212,255,0.2)" : "#2a2a3e"}` }}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeature(key)}
                        className="w-12 h-6 rounded-full transition-all duration-300 shrink-0 relative"
                        style={{ background: enabled ? "#00d4ff" : "#2a2a3e" }}
                      >
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                          style={{ left: enabled ? "26px" : "2px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#00d4ff" }}>ADMIN NOTE</p>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  Feature toggles are stored in client state. Connect a database to persist these settings across sessions.
                </p>
              </div>

              {/* Notification broadcast */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                <div>
                  <p className="text-sm font-bold text-white">Push Notifications</p>
                  <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Send Farcaster push to all subscribers</p>
                </div>
                <button
                  onClick={() => {
                    broadcastNewCollection("Foton Genesis", "2,000");
                    setNotifSent(true);
                    setTimeout(() => setNotifSent(false), 4000);
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={
                    notifSent
                      ? { background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }
                      : { background: "linear-gradient(135deg, #7c3aed22, #a855f722)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                  }
                >
                  {notifSent ? "✓ Notification sent!" : "📣 Announce Genesis Collection"}
                </button>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Notifications are sent via Farcaster to all users who have enabled them for Foton.
                </p>
              </div>
            </>
          )}

          {/* BIDS */}
          {section === "bids" && (
            <>
              <div>
                <h2 className="text-lg font-black text-white">Open Bids</h2>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>24 active USDC bids</p>
              </div>
              {[
                { name: "Based Punk #042", bid: "$980", bidder: "0x9i0j...1k2l", expires: "2d left" },
                { name: "Void Walker #333", bid: "$520", bidder: "0xm3n4...o5p6", expires: "5d left" },
                { name: "Neon Genesis #001", bid: "$360", bidder: "0xab12...cd34", expires: "6d left" },
                { name: "Sound Wave #007", bid: "$180", bidder: "0xdead...beef", expires: "1d left" },
              ].map(({ name, bid, bidder, expires }) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#a0a0c0" }}>{bidder} · {expires}</p>
                  </div>
                  <p className="text-sm font-black" style={{ color: "#7c3aed" }}>{bid} USDC</p>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
