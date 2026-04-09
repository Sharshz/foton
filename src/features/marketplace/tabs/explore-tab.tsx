"use client";

import { useState, useMemo } from "react";
import { MOCK_NFTS } from "@/features/marketplace/mock-data";
import { NFTCard } from "@/features/marketplace/components/nft-card";
import { NFTDetailModal } from "@/features/marketplace/components/nft-detail-modal";
import { UsdcBidModal } from "@/features/marketplace/components/usdc-bid-modal";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { TrendingSection } from "@/features/marketplace/components/trending-section";
import type { NFTItem, NFTCategory, FilterState } from "@/features/marketplace/types";

const CATEGORIES: { label: string; value: NFTCategory }[] = [
  { label: "All", value: "all" },
  { label: "Art", value: "art" },
  { label: "Collectibles", value: "collectibles" },
  { label: "Gaming", value: "gaming" },
  { label: "Music", value: "music" },
  { label: "Photo", value: "photography" },
];

const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
  { label: "Liked", value: "most_liked" },
] as const;

export function ExploreTab() {
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [bidNFT, setBidNFT] = useState<NFTItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    sortBy: "recent",
    priceMin: "",
    priceMax: "",
  });

  const filteredNFTs = useMemo(() => {
    let result = [...MOCK_NFTS];

    // Search by name or collection
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.collection.toLowerCase().includes(q)
      );
    }

    if (filters.category !== "all") {
      result = result.filter((n) => n.category === filters.category);
    }

    if (filters.priceMin) {
      result = result.filter((n) => parseFloat(n.price) >= parseFloat(filters.priceMin));
    }

    if (filters.priceMax) {
      result = result.filter((n) => parseFloat(n.price) <= parseFloat(filters.priceMax));
    }

    switch (filters.sortBy) {
      case "price_asc":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price_desc":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "most_liked":
        result.sort((a, b) => b.likes - a.likes);
        break;
      default:
        result.sort((a, b) => b.listedAt.getTime() - a.listedAt.getTime());
    }

    return result;
  }, [filters, searchQuery]);

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Trending */}
        {!searchQuery && filters.category === "all" && (
          <TrendingSection
            onSelectNFT={setSelectedNFT}
            onBidNFT={setBidNFT}
          />
        )}

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search NFTs or collections..."
          />
        </div>

        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2.5 shrink-0 no-scrollbar"
          style={{ borderBottom: "1px solid #2a2a3e" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilters((f) => ({ ...f, category: cat.value }))}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                filters.category === cat.value
                  ? {
                      background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                      color: "#ffffff",
                    }
                  : {
                      background: "#12121f",
                      color: "#a0a0c0",
                      border: "1px solid #2a2a3e",
                    }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid #1a1a2e" }}
        >
          <span className="text-xs" style={{ color: "#a0a0c0" }}>
            {filteredNFTs.length} {hasActiveSearch ? `result${filteredNFTs.length !== 1 ? "s" : ""}` : "items"}
            {hasActiveSearch && (
              <span style={{ color: "#00d4ff" }}> for &quot;{searchQuery}&quot;</span>
            )}
          </span>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters((f) => ({ ...f, sortBy: opt.value }))}
                className="text-xs px-2 py-1 rounded-md transition-all"
                style={
                  filters.sortBy === opt.value
                    ? { color: "#00d4ff", background: "rgba(0,212,255,0.1)" }
                    : { color: "#a0a0c0" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* NFT Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNFTs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-4">
                {hasActiveSearch ? "🔍" : "🎨"}
              </div>
              <p className="font-semibold text-white">
                {hasActiveSearch
                  ? `No results for "${searchQuery}"`
                  : "No NFTs found"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
                {hasActiveSearch
                  ? "Try a different name or collection"
                  : "Try adjusting your filters"}
              </p>
              {hasActiveSearch && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    color: "#00d4ff",
                    border: "1px solid #00d4ff33",
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} onSelect={setSelectedNFT} onBid={setBidNFT} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <NFTDetailModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />

      {/* USDC Bid Modal */}
      {bidNFT && (
        <UsdcBidModal
          nft={bidNFT}
          onClose={() => setBidNFT(null)}
          onBidPlaced={() => setBidNFT(null)}
        />
      )}
    </>
  );
}
