"use client";

import { useState } from "react";
import { NftMintButton } from "@/neynar-web-sdk/neynar";
import { useFarcasterUser } from "@/neynar-farcaster-sdk/mini";
import type { NftMintResponse } from "@/neynar-web-sdk/neynar";
import { CreateNFTPortal } from "@/features/marketplace/components/create-nft-portal";

const COLLECTION_IMAGE = "https://cdn.neynar.com/nft/generated/5ca6abcb-0ae3-443d-8fae-6d7c0ecc23a3/1775722330324-5139a223-197c-4fac-afff-88f19c0fc378.png";

type MintMode = "mint" | "create";

export function MintTab() {
  const { data: user } = useFarcasterUser();
  const [mintedNft, setMintedNft] = useState<NftMintResponse | null>(null);
  const [mode, setMode] = useState<MintMode>("mint");

  function handleMintSuccess(result: NftMintResponse) {
    setMintedNft(result);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Mode toggle */}
      <div
        className="shrink-0 flex items-center gap-1 mx-4 my-3 p-1 rounded-2xl"
        style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
      >
        <button
          onClick={() => setMode("mint")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={
            mode === "mint"
              ? {
                  background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                  color: "#ffffff",
                }
              : { color: "#a0a0c0" }
          }
        >
          ⚡ Mint NFT
        </button>
        <button
          onClick={() => setMode("create")}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={
            mode === "create"
              ? {
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "#ffffff",
                }
              : { color: "#a0a0c0" }
          }
        >
          🎨 Create Collection
        </button>
      </div>

      {/* Content */}
      {mode === "create" ? (
        <CreateNFTPortal onBack={() => setMode("mint")} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Hero banner */}
          <div className="relative h-44 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={COLLECTION_IMAGE}
              alt="BaseMarket Genesis"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.85) 100%)",
              }}
            />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,212,255,0.15)",
                    color: "#00d4ff",
                    border: "1px solid rgba(0,212,255,0.3)",
                  }}
                >
                  LIVE ON BASE
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,255,136,0.12)",
                    color: "#00ff88",
                    border: "1px solid rgba(0,255,136,0.3)",
                  }}
                >
                  FREE MINT
                </span>
              </div>
              <h2 className="text-xl font-black text-white">BaseMarket Genesis</h2>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                1-of-1 cyber beings from the BaseMarket genesis drop
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Minted NFT result */}
            {mintedNft && mintedNft.tokens[0] && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1.5px solid #00ff88",
                  boxShadow: "0 0 20px rgba(0,255,136,0.1)",
                }}
              >
                {mintedNft.tokens[0].image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mintedNft.tokens[0].image_url}
                    alt={`BaseMarket Genesis #${mintedNft.tokens[0].token_id}`}
                    className="w-full aspect-square object-cover"
                  />
                )}
                <div className="p-4" style={{ background: "rgba(0,255,136,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                      style={{
                        background: "rgba(0,255,136,0.15)",
                        border: "1px solid #00ff88",
                        color: "#00ff88",
                      }}
                    >
                      ✓
                    </div>
                    <p className="text-sm font-bold text-white">Successfully Minted!</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#00d4ff" }}>
                    BaseMarket Genesis #{mintedNft.tokens[0].token_id}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#a0a0c0" }}>
                    Your unique cyber being is now on Base
                  </p>
                  {mintedNft.transaction_hash && (
                    <p
                      className="text-xs font-mono mt-2 truncate"
                      style={{ color: "#7c3aed" }}
                    >
                      tx: {mintedNft.transaction_hash}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Collection stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Supply", value: "∞" },
                { label: "Price", value: "Free" },
                { label: "Chain", value: "Base" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
                >
                  <p
                    className="text-base font-bold"
                    style={{ color: "#00d4ff" }}
                  >
                    {value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* What you get */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-semibold text-white mb-3">What you get</p>
              <div className="space-y-2.5">
                {[
                  {
                    icon: "🤖",
                    title: "Unique AI-generated robot",
                    desc: "Every token is a 1-of-1 cyberpunk portrait minted live",
                  },
                  {
                    icon: "🔗",
                    title: "On-chain ownership",
                    desc: "ERC-721 token stored permanently on Base",
                  },
                  {
                    icon: "✨",
                    title: "Mystery reveal",
                    desc: "Your cyber being is revealed after minting",
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract info */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: "#a0a0c0" }}>
                CONTRACT
              </p>
              <p className="text-xs font-mono" style={{ color: "#7c3aed" }}>
                0xe2e80e6fbc821052a5ba8a308eb5db9ffd07d084
              </p>
              <p className="text-xs mt-1" style={{ color: "#a0a0c0" }}>
                Deployed on Base Mainnet
              </p>
            </div>

            {/* Mint button */}
            <div className="pb-2">
              <NftMintButton
                fid={user?.fid}
                collectionSlug="basemarket-genesis"
                onSuccess={handleMintSuccess}
                className="w-full py-4 rounded-2xl text-base font-black transition-all active:scale-98"
              >
                {mintedNft ? "Mint Another ⚡" : "Mint Your Cyber Being ⚡"}
              </NftMintButton>

              {!user?.fid && (
                <p
                  className="text-xs text-center mt-2"
                  style={{ color: "#a0a0c0" }}
                >
                  Connect your Farcaster account to mint
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
