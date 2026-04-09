"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { base } from "wagmi/chains";
import { useFarcasterUser, ShareButton } from "@/neynar-farcaster-sdk/mini";
import { NftMintButton, type NftMintResponse } from "@/neynar-web-sdk/neynar";

const CONTRACT_ADDRESS = "0xec63f0d5d0a3518b8f66534b5f8b1eaa668f6114";
const COLLECTION_IMAGE = "https://cdn.neynar.com/nft/generated/5ca6abcb-0ae3-443d-8fae-6d7c0ecc23a3/1775741269036-a9ffe328-f517-4cb4-8108-223811106d1d.png";
const MAX_SUPPLY = 2000;
const BASESCAN = `https://basescan.org/address/${CONTRACT_ADDRESS}`;

const TRAITS = [
  { label: "Supply", value: "2,000" },
  { label: "Price", value: "Free" },
  { label: "Chain", value: "Base" },
  { label: "Royalty", value: "0%" },
];

const RARITY_TIERS = [
  { name: "Photon Core", pct: "5%", color: "#ffd700", glow: "rgba(255,215,0,0.3)" },
  { name: "Wave Form", pct: "15%", color: "#00d4ff", glow: "rgba(0,212,255,0.2)" },
  { name: "Particle Field", pct: "30%", color: "#7c3aed", glow: "rgba(124,58,237,0.2)" },
  { name: "Spectrum", pct: "50%", color: "#00ff88", glow: "rgba(0,255,136,0.15)" },
];

export function GenesisTab() {
  const { address } = useAccount();
  const { user } = useFarcasterUser();
  const [minted, setMinted] = useState(false);
  const [mintResult, setMintResult] = useState<NftMintResponse | null>(null);

  const { data: balance } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: !!address },
  });

  // Mock minted count — in production query contract totalSupply
  const mintedCount = 147;
  const pct = Math.round((mintedCount / MAX_SUPPLY) * 100);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 space-y-4 pb-8">

        {/* Hero banner */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,212,255,0.3)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COLLECTION_IMAGE}
            alt="Foton Genesis"
            className="w-full object-cover"
            style={{ height: 200 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #0a0a0fcc 40%, transparent 100%)" }}
          />
          <div className="absolute bottom-0 left-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(0,212,255,0.2)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.4)" }}
              >
                GENESIS DROP
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}
              >
                FREE MINT
              </span>
            </div>
            <h1 className="text-xl font-black text-white">Foton Genesis</h1>
            <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>2,000 photon entities on Base</p>
          </div>
        </div>

        {/* Mint progress */}
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Mint Progress</p>
            <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>
              {mintedCount.toLocaleString()} / {MAX_SUPPLY.toLocaleString()}
            </p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1a1a2e" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #00d4ff, #7c3aed)",
                boxShadow: "0 0 8px rgba(0,212,255,0.5)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "#a0a0c0" }}>
            {MAX_SUPPLY - mintedCount} remaining · Early adopters only
          </p>
        </div>

        {/* Traits grid */}
        <div className="grid grid-cols-4 gap-2">
          {TRAITS.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-black text-white">{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "#a0a0c0" }}>ABOUT</p>
          <p className="text-sm leading-relaxed" style={{ color: "#d0d0e8" }}>
            Foton Genesis is the founding collection of the Foton marketplace on Base.
            Each piece is a unique photon entity — generated on-chain with distinct light
            wave patterns, energy signatures, and rarity traits. Free to mint, yours forever.
          </p>
        </div>

        {/* Rarity tiers */}
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
        >
          <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>RARITY TIERS</p>
          <div className="space-y-2">
            {RARITY_TIERS.map(({ name, pct: p, color, glow }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${glow}` }}
                  />
                  <span className="text-sm text-white">{name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mint CTA */}
        {!minted ? (
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: "#12121f", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-black text-white">Mint Foton Genesis</p>
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                  Pay gas only · 1 per wallet · Base mainnet
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black" style={{ color: "#00ff88" }}>FREE</p>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>+ gas (~$0.01)</p>
              </div>
            </div>

            {address || user?.fid ? (
              <NftMintButton
                fid={user?.fid}
                collectionSlug="foton-genesis"
                onSuccess={(result) => {
                  setMintResult(result);
                  setMinted(true);
                }}
                className="w-full py-4 rounded-xl font-black text-base transition-all active:scale-98"
              >
                Mint Foton Genesis →
              </NftMintButton>
            ) : (
              <div
                className="w-full py-4 rounded-xl font-bold text-sm text-center"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                Connect wallet to mint
              </div>
            )}

            {address && balance && (
              <p className="text-xs text-center" style={{ color: "#a0a0c0" }}>
                Balance: Ξ {parseFloat(balance.formatted).toFixed(4)} on Base
              </p>
            )}
          </div>
        ) : (
          /* Success state */
          <div
            className="p-5 rounded-2xl flex flex-col items-center text-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,136,0.05), rgba(0,212,255,0.05))",
              border: "1px solid rgba(0,255,136,0.3)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
              style={{
                background: "rgba(0,255,136,0.1)",
                border: "2px solid #00ff88",
                boxShadow: "0 0 24px rgba(0,255,136,0.2)",
              }}
            >
              ✓
            </div>
            <h3 className="text-lg font-black text-white mb-1">Minted! 🎉</h3>
            <p className="text-sm mb-3" style={{ color: "#a0a0c0" }}>
              Your Foton Genesis NFT is now in your wallet{user?.username ? `, @${user.username}` : ""}!
            </p>
            {mintResult?.tokens?.[0]?.token_id && (
              <p className="text-xs mb-3" style={{ color: "#a0a0c0" }}>
                Token #{mintResult.tokens[0].token_id} minted
              </p>
            )}
            <ShareButton
              text={`Just minted Foton Genesis${mintResult?.tokens?.[0]?.token_id ? ` #${mintResult.tokens[0].token_id}` : ""} — the genesis collection of the Foton NFT marketplace on Base! Free mint, yours forever. ✨⚡`}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #00ff8811, #00d4ff11)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}
            >
              Share on Farcaster
            </ShareButton>
          </div>
        )}

        {/* Contract link */}
        <div className="flex justify-center">
          <a
            href={BASESCAN}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "#a0a0c0" }}
          >
            Contract: {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)} ↗
          </a>
        </div>

      </div>
    </div>
  );
}
