"use client";

import { useState } from "react";
import type { NFTItem, OfferDraft } from "@/features/marketplace/types";
import { MakeOfferModal } from "@/features/marketplace/components/make-offer-modal";
import { BuyNowModal } from "@/features/marketplace/components/buy-now-modal";
import { UsdcBidModal } from "@/features/marketplace/components/usdc-bid-modal";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";

interface NFTDetailModalProps {
  nft: NFTItem | null;
  onClose: () => void;
}

export function NFTDetailModal({ nft, onClose }: NFTDetailModalProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [placedOffer, setPlacedOffer] = useState<OfferDraft | null>(null);
  const [usdcBid, setUsdcBid] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(false);

  if (!nft) return null;

  function formatAddress(addr: string) {
    if (addr.includes("...")) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
        style={{ background: "#0a0a0f" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "#0a0a0f", borderBottom: "1px solid #2a2a3e" }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "#a0a0c0" }}
          >
            <span className="text-lg">←</span>
            <span>Back</span>
          </button>
          <span className="text-sm font-semibold text-white">{nft.collection}</span>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-8">
          {/* Image */}
          <div
            className="rounded-2xl overflow-hidden aspect-square w-full relative"
            style={{ border: `1px solid ${purchased ? "#00ff8855" : "#2a2a3e"}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
            {purchased && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <div
                  className="rounded-2xl px-5 py-3 text-center"
                  style={{
                    background: "rgba(0,255,136,0.15)",
                    border: "1.5px solid #00ff88",
                  }}
                >
                  <p className="text-2xl font-black" style={{ color: "#00ff88" }}>
                    ✓ Owned
                  </p>
                  <p className="text-xs mt-1 text-white">In your wallet</p>
                </div>
              </div>
            )}
          </div>

          {/* Name & Collection */}
          <div>
            <p className="text-sm font-medium" style={{ color: "#7c3aed" }}>
              {nft.collection}
            </p>
            <h2 className="text-xl font-bold text-white mt-1">{nft.name}</h2>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "#a0a0c0" }}>
              {nft.description}
            </p>
          </div>

          {/* Purchased banner */}
          {purchased && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(0,255,136,0.07)",
                border: "1px solid #00ff8844",
              }}
            >
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  You own this NFT!
                </p>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Listed in your Profile
                </p>
              </div>
            </div>
          )}

          {/* Active offer banner */}
          {placedOffer && !purchased && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid #7c3aed44",
              }}
            >
              <span className="text-lg">📬</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  Your offer: Ξ {placedOffer.offerEth}
                </p>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Expires in {placedOffer.expiryDays} days
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,58,237,0.2)",
                  color: "#a78bfa",
                  border: "1px solid #7c3aed44",
                }}
              >
                Pending
              </span>
            </div>
          )}

          {/* Price Box */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
          >
            <p className="text-xs font-medium" style={{ color: "#a0a0c0" }}>
              {purchased ? "Purchased For" : "Current Price"}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold" style={{ color: "#00d4ff" }}>
                Ξ {nft.price}
              </span>
              <span className="text-sm mb-1" style={{ color: "#a0a0c0" }}>
                ${nft.priceUsd.toLocaleString()}
              </span>
            </div>

            {!purchased ? (
              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => setShowBidModal(true)}
                    className="flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
                    style={
                      usdcBid
                        ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid #7c3aed44" }
                        : { background: "#1a1a2e", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.3)" }
                    }
                  >
                    {usdcBid ? `$${usdcBid} Bid ✓` : "Bid USDC"}
                  </button>
                </div>
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                  style={
                    placedOffer
                      ? { background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }
                      : { background: "#0a0a0f", color: "#a0a0c0", border: "1px solid #2a2a3e" }
                  }
                >
                  {placedOffer ? `ETH Offer: Ξ ${placedOffer.offerEth}` : "Make ETH Offer"}
                </button>
                <ShareButton
                  text={`Check out ${nft.name} from ${nft.collection} on Foton — Ξ ${nft.price} on Base ⚡`}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: "#0a0a0f", color: "#a0a0c0", border: "1px solid #2a2a3e" }}
                >
                  Share on Farcaster
                </ShareButton>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <div
                  className="py-3 rounded-xl text-center text-sm font-bold"
                  style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid #00ff8833" }}
                >
                  ✓ Purchase Confirmed on Base
                </div>
                <ShareButton
                  text={`Just bought ${nft.name} on Foton! Ξ ${nft.price} on Base. Trade NFTs. Own Base. ⚡`}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #00ff8811, #00d4ff11)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}
                >
                  Share Purchase on Farcaster
                </ShareButton>
              </div>
            )}
          </div>

          {/* Details */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #2a2a3e" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #2a2a3e" }}>
              <p className="text-sm font-semibold text-white">Details</p>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Token ID", value: `#${nft.tokenId}` },
                { label: "Chain", value: "Base" },
                { label: "Owner", value: formatAddress(nft.owner) },
                { label: "Creator", value: formatAddress(nft.creator) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#a0a0c0" }}>
                    {label}
                  </span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attributes */}
          {nft.attributes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white mb-3">Traits</p>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr) => (
                  <div
                    key={attr.trait_type}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "linear-gradient(135deg, #00d4ff08, #7c3aed08)",
                      border: "1px solid #2a2a3e",
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: "#7c3aed" }}>
                      {attr.trait_type}
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <MakeOfferModal
          nft={nft}
          onClose={() => setShowOfferModal(false)}
          onOfferPlaced={(offer) => {
            setPlacedOffer(offer);
            setShowOfferModal(false);
          }}
        />
      )}

      {/* Buy Now Modal */}
      {showBuyModal && (
        <BuyNowModal
          nft={nft}
          onClose={() => setShowBuyModal(false)}
          onPurchased={() => {
            setPurchased(true);
            setShowBuyModal(false);
          }}
        />
      )}

      {/* USDC Bid Modal */}
      {showBidModal && (
        <UsdcBidModal
          nft={nft}
          onClose={() => setShowBidModal(false)}
          onBidPlaced={(_nft, bidUsdc) => {
            setUsdcBid(bidUsdc);
            setShowBidModal(false);
          }}
        />
      )}
    </>
  );
}
