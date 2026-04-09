"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { base } from "wagmi/chains";
import { useFarcasterUser, ShareButton } from "@/neynar-farcaster-sdk/mini";
import { useUsdcBalanceOf } from "@/neynar-web-sdk/blockchain";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import { MOCK_NFTS, MOCK_COLLECTIONS } from "@/features/marketplace/mock-data";
import { NFTCard } from "@/features/marketplace/components/nft-card";
import { NFTDetailModal } from "@/features/marketplace/components/nft-detail-modal";
import { ListNFTModal } from "@/features/marketplace/components/list-nft-modal";
import { SwapPortal } from "@/features/marketplace/components/swap-portal";
import type { NFTItem, ListingDraft, NFTCollection } from "@/features/marketplace/types";

// Simulated user-deployed collections (populated after Create flow)
const DEMO_USER_COLLECTIONS: NFTCollection[] = [];

const BASE_OWNED_NFTS = MOCK_NFTS.slice(0, 2);

export function ProfileTab() {
  const { data: user } = useFarcasterUser();
  const { address } = useAccount();
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: !!address },
  });

  const { data: usdcRaw, isLoading: usdcLoading } = useUsdcBalanceOf(
    address as `0x${string}`,
    { enabled: !!address }
  );

  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 60_000 });
  const ethUsd = prices?.ethereum?.usd ?? null;

  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [listings, setListings] = useState<ListingDraft[]>([]);
  const [ownedNfts, setOwnedNfts] = useState<NFTItem[]>(BASE_OWNED_NFTS);
  const [userCollections, setUserCollections] = useState<NFTCollection[]>(DEMO_USER_COLLECTIONS);
  const [profileSection, setProfileSection] = useState<"nfts" | "collections" | "listings">("nfts");

  const displayName = user?.displayName ?? "Anonymous";
  const username = user?.username ? `@${user.username}` : "Not connected";
  const avatar = user?.pfpUrl;

  const totalEth = ownedNfts.reduce((sum, n) => sum + parseFloat(n.price), 0);
  const totalValue = totalEth.toFixed(3);
  const totalUsd = ethUsd
    ? `$${(totalEth * ethUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : null;

  // Format ETH balance: show 4 decimal places, trim trailing zeros
  const ethBalance = balanceData
    ? parseFloat(balanceData.formatted).toFixed(4).replace(/\.?0+$/, "") || "0"
    : null;

  // USDC has 6 decimals — format to 2dp, with commas
  const usdcBalance =
    usdcRaw !== undefined
      ? (Number(usdcRaw) / 1_000_000).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  function handleListed(listing: ListingDraft) {
    setListings((prev) => [listing, ...prev]);
    // Mark the NFT as listed in owned collection
    setOwnedNfts((prev) =>
      prev.map((n) =>
        n.id === listing.nft.id
          ? { ...n, isListed: true, listingPrice: listing.priceEth }
          : n
      )
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div
          className="p-4"
          style={{
            background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%)",
            borderBottom: "1px solid #2a2a3e",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
              style={{ border: "2px solid #00d4ff" }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #00d4ff22, #7c3aed44)",
                    color: "#00d4ff",
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>
              <p className="text-sm" style={{ color: "#7c3aed" }}>
                {username}
              </p>
              {user?.fid && (
                <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                  FID: {user.fid}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-bold text-white">{ownedNfts.length}</p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>NFTs</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>Ξ {totalValue}</p>
              {totalUsd && <p className="text-xs mt-0.5" style={{ color: "#00ff88" }}>{totalUsd}</p>}
              {!totalUsd && <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Portfolio</p>}
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-bold text-white">{userCollections.length}</p>
              <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Collections</p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div
            className="mt-3 rounded-xl overflow-hidden"
            style={{ border: "1px solid #2a2a3e" }}
          >
            {/* Header row — address */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5"
              style={{ borderBottom: "1px solid #1a1a2e", background: "rgba(0,0,0,0.3)" }}
            >
              <div
                className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, #0052ff22, #00d4ff22)",
                  border: "1px solid #0052ff55",
                  color: "#4d94ff",
                }}
              >
                ◈
              </div>
              <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
                WALLET · BASE
              </p>
              <p className="text-xs font-mono ml-auto" style={{ color: "#7c7c9c" }}>
                {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected"}
              </p>
            </div>

            {/* Balance row — ETH + USDC */}
            <div className="grid grid-cols-2" style={{ background: "rgba(0,0,0,0.2)" }}>
              {/* ETH */}
              <div
                className="flex flex-col items-center justify-center py-3 gap-0.5"
                style={{ borderRight: "1px solid #1a1a2e" }}
              >
                <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>ETH</p>
                {balanceLoading ? (
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 animate-spin mt-1"
                    style={{ borderColor: "#2a2a3e", borderTopColor: "#00d4ff" }}
                  />
                ) : ethBalance !== null ? (
                  <p className="text-base font-bold" style={{ color: "#00d4ff" }}>
                    Ξ {ethBalance}
                  </p>
                ) : (
                  <p className="text-sm font-bold" style={{ color: "#a0a0c0" }}>—</p>
                )}
              </div>

              {/* USDC */}
              <div className="flex flex-col items-center justify-center py-3 gap-0.5">
                <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>USDC</p>
                {usdcLoading ? (
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 animate-spin mt-1"
                    style={{ borderColor: "#2a2a3e", borderTopColor: "#2775ca" }}
                  />
                ) : usdcBalance !== null ? (
                  <p className="text-base font-bold" style={{ color: "#2775ca" }}>
                    ${usdcBalance}
                  </p>
                ) : (
                  <p className="text-sm font-bold" style={{ color: "#a0a0c0" }}>—</p>
                )}
              </div>
            </div>

            {/* Swap button */}
            <button
              onClick={() => setShowSwap(true)}
              className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{
                borderTop: "1px solid #1a1a2e",
                background: "rgba(0,0,0,0.2)",
                color: "#00d4ff",
              }}
            >
              ⇅ Swap ETH / USDC
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0">
          {(["nfts", "collections", "listings"] as const).map((s) => {
            const labels = { nfts: "My NFTs", collections: "Collections", listings: "Listings" };
            const counts = {
              nfts: ownedNfts.length,
              collections: userCollections.length,
              listings: listings.length,
            };
            const active = profileSection === s;
            return (
              <button
                key={s}
                onClick={() => setProfileSection(s)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }
                    : { background: "#0a0a0f", color: "#a0a0c0", border: "1px solid #2a2a3e" }
                }
              >
                {labels[s]}
                {counts[s] > 0 && (
                  <span className="ml-1 text-xs px-1 py-0.5 rounded-full" style={{ background: active ? "rgba(0,212,255,0.15)" : "#1a1a2e", color: active ? "#00d4ff" : "#a0a0c0" }}>
                    {counts[s]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* MY NFTS */}
        {profileSection === "nfts" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">My NFTs</h3>
              <button
                onClick={() => setShowListModal(true)}
                className="text-xs rounded-lg px-3 py-1.5 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff", fontWeight: 600 }}
              >
                + List NFT
              </button>
            </div>
            {ownedNfts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">🖼️</div>
                <p className="font-semibold text-white">No NFTs yet</p>
                <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>Explore the market to find your first NFT</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {ownedNfts.map((nft) => (
                  <div key={nft.id} className="relative">
                    <NFTCard nft={nft} onSelect={setSelectedNFT} />
                    {nft.isListed && (
                      <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold z-10"
                        style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.4)" }}>
                        Listed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY COLLECTIONS */}
        {profileSection === "collections" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">My Collections</h3>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "#1a1a2e", color: "#a0a0c0" }}>
                Deploy via ⚡ Mint tab
              </span>
            </div>

            {userCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "linear-gradient(135deg, #7c3aed22, #a855f722)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  🎨
                </div>
                <div>
                  <p className="font-semibold text-white">No collections yet</p>
                  <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>Deploy your own ERC-721 on Base</p>
                </div>
                <div className="w-full p-4 rounded-2xl space-y-3" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                  <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>HOW TO CREATE A COLLECTION</p>
                  {[
                    { step: "1", text: "Tap the ⚡ Mint tab below" },
                    { step: "2", text: 'Switch to "🎨 Create Collection"' },
                    { step: "3", text: "Fill in name, art style & supply" },
                    { step: "4", text: "Deploy — real ERC-721 on Base!" },
                    { step: "5", text: "Your collection appears here for listing" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}>
                        {step}
                      </div>
                      <p className="text-xs text-white">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {userCollections.map((col) => (
                  <div key={col.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2a2a3e" }}>
                    <div className="flex items-center gap-3 p-3" style={{ background: "#12121f" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={col.image} alt={col.name} className="w-12 h-12 rounded-xl object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${col.id}`; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{col.name}</p>
                        <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>{col.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: "#00d4ff" }}>Floor Ξ {col.floorPrice}</span>
                          <span className="text-xs" style={{ color: "#a0a0c0" }}>·</span>
                          <span className="text-xs" style={{ color: "#a0a0c0" }}>{col.items} items</span>
                        </div>
                      </div>
                      {col.verified && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff" }}>✓</div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3 pt-0" style={{ background: "#0a0a0f" }}>
                      <button
                        onClick={() => setShowListModal(true)}
                        className="py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}
                      >
                        List for Sale
                      </button>
                      <ShareButton
                        text={`Check out my NFT collection "${col.name}" on Foton — ${col.items} items on Base! Floor: Ξ ${col.floorPrice}. Trade NFTs. Own Base. ⚡`}
                        className="py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
                      >
                        Share on Farcaster
                      </ShareButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE LISTINGS */}
        {profileSection === "listings" && (
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Active Listings</h3>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">🏷️</div>
                <p className="font-semibold text-white">No active listings</p>
                <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
                  Go to My NFTs and tap + List NFT to sell
                </p>
              </div>
            ) : (
              listings.map((listing, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#12121f", border: "1px solid #2a2a3e" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.nft.image} alt={listing.nft.name} className="w-12 h-12 rounded-xl object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${listing.nft.id}`; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{listing.nft.name}</p>
                    <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>{listing.nft.collection}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Expires in {listing.durationDays}d</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>Ξ {listing.priceEth}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>Live</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <NFTDetailModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />

      {showListModal && (
        <ListNFTModal
          ownedNfts={ownedNfts}
          onClose={() => setShowListModal(false)}
          onListed={handleListed}
        />
      )}

      {showSwap && <SwapPortal onClose={() => setShowSwap(false)} />}
    </div>
  );
}
