"use client";

import { useState } from "react";
import type { NFTItem } from "@/features/marketplace/types";

interface NFTCardProps {
  nft: NFTItem;
  onSelect: (nft: NFTItem) => void;
  onBid?: (nft: NFTItem) => void;
}

export function NFTCard({ nft, onSelect, onBid }: NFTCardProps) {
  const [liked, setLiked] = useState(nft.isLiked);
  const [likeCount, setLikeCount] = useState(nft.likes);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  }

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer group transition-transform active:scale-95"
      style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
      onClick={() => onSelect(nft)}
    >
      {/* NFT Image */}
      <div className="relative aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(nft.id)}&backgroundColor=1a1a2e,12121f,0a0a0f&shapeColor=00d4ff,7c3aed,00ff88`;
          }}
        />
        {/* Like button overlay */}
        <button
          onClick={handleLike}
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all"
          style={{
            background: liked ? "rgba(124, 58, 237, 0.9)" : "rgba(10, 10, 15, 0.8)",
            color: liked ? "#ffffff" : "#a0a0c0",
            border: liked ? "1px solid #7c3aed" : "1px solid #2a2a3e",
          }}
        >
          <span>{liked ? "♥" : "♡"}</span>
          <span>{likeCount}</span>
        </button>
        {/* Verified badge */}
        <div
          className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: "rgba(0, 212, 255, 0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
        >
          BASE
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-3">
        <p className="text-xs font-medium truncate" style={{ color: "#a0a0c0" }}>
          {nft.collection}
        </p>
        <p className="text-sm font-bold text-white truncate mt-0.5">{nft.name}</p>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs" style={{ color: "#a0a0c0" }}>Price</p>
            <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>
              Ξ {nft.price}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {onBid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBid(nft);
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  color: "#7c3aed",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                Bid
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(nft);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                color: "#00d4ff",
                border: "1px solid #00d4ff44",
              }}
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
