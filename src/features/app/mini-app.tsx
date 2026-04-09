"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ExploreTab } from "@/features/marketplace/tabs/explore-tab";
import { CollectionsTab } from "@/features/marketplace/tabs/collections-tab";
import { ActivityTab } from "@/features/marketplace/tabs/activity-tab";
import { ProfileTab } from "@/features/marketplace/tabs/profile-tab";
import { MintTab } from "@/features/marketplace/tabs/mint-tab";
import { GenesisTab } from "@/features/marketplace/tabs/genesis-tab";
import { AdminTab } from "@/features/marketplace/tabs/admin-tab";
import type { MarketTab } from "@/features/marketplace/types";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";
import { PriceTicker } from "@/features/marketplace/components/price-ticker";
import { SwapPortal } from "@/features/marketplace/components/swap-portal";

const TABS: { id: MarketTab; label: string; icon: string }[] = [
  { id: "explore", label: "Explore", icon: "🔍" },
  { id: "collections", label: "Collect", icon: "📦" },
  { id: "genesis", label: "Genesis", icon: "✨" },
  { id: "mint", label: "Mint", icon: "⚡" },
  { id: "activity", label: "Activity", icon: "📊" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "admin", label: "Admin", icon: "⚙️" },
];

export function MiniApp() {
  const [activeTab, setActiveTab] = useState<MarketTab>("explore");
  const [walletOpen, setWalletOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{ background: "#0a0a0f", color: "#ffffff" }}
    >
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #2a2a3e", background: "#0a0a0f" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
              color: "#ffffff",
            }}
          >
            F
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-none">Foton</h1>
            <p className="text-xs leading-none mt-0.5" style={{ color: "#7c3aed" }}>
              Trade NFTs. Own Base.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
              color: "#00d4ff",
              border: "1px solid #00d4ff33",
            }}
          >
            🔔
          </button>
          <ShareButton
            text="Check out Foton — trade NFTs and own the future on Base! ✨⚡"
            variant="outline"
            size="sm"
            className="rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95"
          >
            Share
          </ShareButton>
          <button
            onClick={() => setWalletOpen(true)}
            className="rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
            style={
              isConnected
                ? {
                    background: "rgba(0,255,136,0.08)",
                    color: "#00ff88",
                    border: "1px solid rgba(0,255,136,0.3)",
                  }
                : {
                    background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                    color: "#ffffff",
                  }
            }
          >
            {isConnected ? (
              <>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#00ff88" }}
                />
                {shortAddr}
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>
      </header>

      {/* Price Ticker */}
      <PriceTicker />

      {/* Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "collections" && <CollectionsTab />}
        {activeTab === "genesis" && <GenesisTab />}
        {activeTab === "mint" && <MintTab />}
        {activeTab === "activity" && <ActivityTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "admin" && <AdminTab />}
      </div>

      {/* Bottom Nav */}
      <nav
        className="shrink-0 flex items-center"
        style={{ borderTop: "1px solid #2a2a3e", background: "#0a0a0f" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isMint = tab.id === "mint";
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative"
              style={{ minHeight: "56px" }}
            >
              {isMint ? (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base -mt-1"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #00d4ff, #7c3aed)"
                      : "linear-gradient(135deg, #00d4ff44, #7c3aed44)",
                    border: isActive ? "none" : "1px solid #2a2a3e",
                  }}
                >
                  {tab.icon}
                </div>
              ) : (
                <span className="text-lg leading-none">{tab.icon}</span>
              )}
              <span
                className="text-xs font-semibold leading-none"
                style={{
                  color: isActive
                    ? isMint
                      ? "#00d4ff"
                      : "#00d4ff"
                    : "#a0a0c0",
                }}
              >
                {tab.label}
              </span>
              {isActive && !isMint && (
                <div
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "#00d4ff" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Swap portal */}
      {swapOpen && <SwapPortal onClose={() => setSwapOpen(false)} />}

      {/* Wallet modal */}
      {walletOpen && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setWalletOpen(false)}
        >
          <div
            className="rounded-t-3xl p-5 pb-8"
            style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ background: "#2a2a3e" }}
            />

            {isConnected ? (
              <>
                <p className="text-xs font-semibold mb-3" style={{ color: "#a0a0c0" }}>
                  CONNECTED WALLET
                </p>
                {/* Address card */}
                <div
                  className="rounded-xl p-4 flex items-center gap-3 mb-4"
                  style={{ background: "#0a0a0f", border: "1px solid #00ff8833" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm"
                    style={{
                      background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                      border: "1px solid #00d4ff33",
                      color: "#00d4ff",
                    }}
                  >
                    ◈
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">Base Network</p>
                    <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "#a0a0c0" }}>
                      {address}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "#00ff88" }}
                  />
                </div>

                {/* Action row */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <button
                    onClick={() => { setWalletOpen(false); setSwapOpen(true); }}
                    className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    style={{
                      background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                      color: "#00d4ff",
                      border: "1px solid #00d4ff33",
                    }}
                  >
                    ⇅ Swap
                  </button>
                  <button
                    onClick={() => { disconnect(); setWalletOpen(false); }}
                    className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{
                      background: "rgba(255,80,80,0.08)",
                      color: "#ff5050",
                      border: "1px solid rgba(255,80,80,0.25)",
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-white mb-1">Connect Wallet</p>
                <p className="text-xs mb-4" style={{ color: "#a0a0c0" }}>
                  Connect to buy, sell, and mint NFTs on Base
                </p>
                <div className="space-y-2.5">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      onClick={() => { connect({ connector }); setWalletOpen(false); }}
                      disabled={isPending}
                      className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-left flex items-center gap-3 transition-all active:scale-95"
                      style={{
                        background: "#0a0a0f",
                        border: "1px solid #2a2a3e",
                        color: "#ffffff",
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                          border: "1px solid #2a2a3e",
                        }}
                      >
                        🔗
                      </div>
                      {connector.name}
                      <span className="ml-auto text-xs" style={{ color: "#a0a0c0" }}>→</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
