"use client";

import { useState, useCallback } from "react";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import type { NFTItem, OfferDraft } from "@/features/marketplace/types";

interface MakeOfferModalProps {
  nft: NFTItem;
  onClose: () => void;
  onOfferPlaced: (offer: OfferDraft) => void;
}

type Step = "offer" | "review" | "success";

const EXPIRY_OPTIONS = [
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "1 month", value: 30 },
];

function PercentBadge({ pct }: { pct: number }) {
  const isBelow = pct < 0;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: isBelow ? "rgba(255,80,80,0.12)" : "rgba(0,255,136,0.12)",
        color: isBelow ? "#ff5050" : "#00ff88",
        border: `1px solid ${isBelow ? "#ff505033" : "#00ff8833"}`,
      }}
    >
      {isBelow ? "" : "+"}
      {pct.toFixed(1)}%
    </span>
  );
}

export function MakeOfferModal({ nft, onClose, onOfferPlaced }: MakeOfferModalProps) {
  const [step, setStep] = useState<Step>("offer");
  const [offerEth, setOfferEth] = useState("");
  const [expiry, setExpiry] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 60_000 });
  const ethUsd = prices?.ethereum?.usd ?? 2500;

  const askingPrice = parseFloat(nft.price);
  const offerValue = parseFloat(offerEth) || 0;
  const offerUsd = offerValue ? (offerValue * ethUsd).toFixed(2) : "0.00";
  const pctVsAsk = askingPrice > 0 ? ((offerValue - askingPrice) / askingPrice) * 100 : 0;
  const isValidOffer = offerEth.trim() !== "" && !isNaN(offerValue) && offerValue > 0;
  const isBelowAsk = offerValue < askingPrice;

  const handleSubmitOffer = useCallback(async () => {
    if (!isValidOffer) return;
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 1600));
    const offer: OfferDraft = {
      nft,
      offerEth,
      offerUsd: parseFloat(offerUsd),
      expiryDays: expiry,
      placedAt: new Date(),
    };
    onOfferPlaced(offer);
    setIsSubmitting(false);
    setStep("success");
  }, [nft, offerEth, offerUsd, expiry, isValidOffer, onOfferPlaced]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[424px] rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "#12121f",
          border: "1px solid #2a2a3e",
          maxHeight: "88dvh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#2a2a3e" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid #2a2a3e" }}
        >
          <div className="flex items-center gap-3">
            {step === "review" && (
              <button
                onClick={() => setStep("offer")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                ←
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {step === "offer" && "Make an Offer"}
                {step === "review" && "Review Offer"}
                {step === "success" && "Offer Submitted! 🎉"}
              </h2>
              {step !== "success" && (
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  {nft.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: "#1a1a2e", color: "#a0a0c0" }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1: Offer */}
          {step === "offer" && (
            <div className="p-5 space-y-5">
              {/* NFT preview */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>
                    {nft.collection}
                  </p>
                  <p className="text-sm font-bold text-white truncate">{nft.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "#a0a0c0" }}>
                      Asking:
                    </span>
                    <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>
                      Ξ {nft.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offer input */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "#a0a0c0" }}
                >
                  YOUR OFFER
                </label>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl transition-all"
                  style={{
                    background: "#0a0a0f",
                    border: `1px solid ${
                      isValidOffer
                        ? isBelowAsk
                          ? "#7c3aed55"
                          : "#00ff8855"
                        : "#2a2a3e"
                    }`,
                  }}
                >
                  <span className="text-xl font-bold" style={{ color: "#00d4ff" }}>
                    Ξ
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={offerEth}
                    onChange={(e) => setOfferEth(e.target.value)}
                    className="flex-1 bg-transparent text-xl font-bold outline-none text-white placeholder:text-gray-600"
                    style={{ caretColor: "#00d4ff" }}
                    min="0"
                    step="0.001"
                    autoFocus
                  />
                  <span className="text-sm shrink-0" style={{ color: "#a0a0c0" }}>
                    ETH
                  </span>
                </div>

                {/* Live feedback row */}
                {isValidOffer && (
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-xs" style={{ color: "#a0a0c0" }}>
                      ≈ ${offerUsd} USD
                    </span>
                    <PercentBadge pct={pctVsAsk} />
                  </div>
                )}
              </div>

              {/* Quick % shortcuts */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#a0a0c0" }}>
                  QUICK SELECT
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "-20%", pct: 0.8 },
                    { label: "-10%", pct: 0.9 },
                    { label: "-5%", pct: 0.95 },
                    { label: "Ask", pct: 1.0 },
                  ].map(({ label, pct }) => {
                    const val = (askingPrice * pct).toFixed(4);
                    const isSelected = parseFloat(offerEth).toFixed(4) === val;
                    return (
                      <button
                        key={label}
                        onClick={() => setOfferEth(val)}
                        className="py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        style={
                          isSelected
                            ? {
                                background:
                                  "linear-gradient(135deg, #7c3aed33, #00d4ff22)",
                                color: "#00d4ff",
                                border: "1px solid #00d4ff44",
                              }
                            : {
                                background: "#0a0a0f",
                                color: "#a0a0c0",
                                border: "1px solid #2a2a3e",
                              }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "#a0a0c0" }}
                >
                  OFFER EXPIRES IN
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className="py-2 rounded-xl text-xs font-semibold transition-all"
                      style={
                        expiry === opt.value
                          ? {
                              background:
                                "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                              color: "#00d4ff",
                              border: "1px solid #00d4ff44",
                            }
                          : {
                              background: "#0a0a0f",
                              color: "#a0a0c0",
                              border: "1px solid #2a2a3e",
                            }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid #7c3aed33",
                }}
              >
                <span className="text-sm shrink-0 mt-0.5">💡</span>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  The seller has{" "}
                  <span className="text-white">{expiry} days</span> to accept
                  your offer. You can cancel anytime before it&apos;s accepted.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === "review" && (
            <div className="p-5 space-y-4">
              {/* NFT image */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3" style={{ background: "#0a0a0f" }}>
                  <p className="text-xs" style={{ color: "#a0a0c0" }}>
                    {nft.collection}
                  </p>
                  <p className="text-base font-bold text-white">{nft.name}</p>
                </div>
              </div>

              {/* Offer breakdown */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                <h3 className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
                  OFFER SUMMARY
                </h3>
                {[
                  {
                    label: "Your offer",
                    value: `Ξ ${offerEth}`,
                    color: "#ffffff",
                  },
                  {
                    label: "USD estimate",
                    value: `≈ $${offerUsd}`,
                    color: "#a0a0c0",
                  },
                  {
                    label: "Asking price",
                    value: `Ξ ${nft.price}`,
                    color: "#a0a0c0",
                  },
                  {
                    label: "Difference",
                    value: `${pctVsAsk >= 0 ? "+" : ""}${pctVsAsk.toFixed(1)}% vs ask`,
                    color: pctVsAsk >= 0 ? "#00ff88" : "#ff5050",
                  },
                  {
                    label: "Expires in",
                    value: `${expiry} days`,
                    color: "#ffffff",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#a0a0c0" }}>
                      {label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "rgba(0,212,255,0.05)",
                  border: "1px solid #00d4ff22",
                }}
              >
                <span className="text-sm shrink-0 mt-0.5">ℹ️</span>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  Simulated offer on Foton. In production this locks
                  WETH in an escrow contract until the seller accepts or the
                  offer expires.
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="p-5 flex flex-col items-center text-center py-8">
              {/* Animated check */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
                style={{
                  background: "linear-gradient(135deg, #7c3aed22, #00d4ff22)",
                  border: "2px solid #7c3aed",
                }}
              >
                📬
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                Offer Sent!
              </h3>
              <p className="text-sm mb-6" style={{ color: "#a0a0c0" }}>
                Your offer of{" "}
                <span style={{ color: "#00d4ff" }}>Ξ {offerEth}</span> on{" "}
                <span className="text-white font-semibold">{nft.name}</span>{" "}
                has been submitted
              </p>

              {/* Offer card */}
              <div
                className="w-full rounded-xl p-4 space-y-3 mb-4"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-xs" style={{ color: "#a0a0c0" }}>
                      {nft.collection}
                    </p>
                    <p className="text-sm font-bold text-white">{nft.name}</p>
                  </div>
                </div>
                <div
                  className="h-px w-full"
                  style={{ background: "#2a2a3e" }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p
                      className="text-base font-black"
                      style={{ color: "#00d4ff" }}
                    >
                      Ξ {offerEth}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                      Offer
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className="text-base font-black"
                      style={{
                        color: pctVsAsk >= 0 ? "#00ff88" : "#ff5050",
                      }}
                    >
                      {pctVsAsk >= 0 ? "+" : ""}
                      {pctVsAsk.toFixed(0)}%
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                      vs ask
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-white">{expiry}d</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                      Expires
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs mb-4" style={{ color: "#a0a0c0" }}>
                You&apos;ll be notified if the seller accepts your offer
              </p>
              <ShareButton
                text={`Just placed a Ξ ${offerEth} offer on ${nft.name} on Foton — Trade NFTs. Own Base. ⚡`}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "#a78bfa",
                  border: "1px solid #7c3aed44",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid #2a2a3e", background: "#12121f" }}
        >
          {step === "offer" && (
            <button
              onClick={() => setStep("review")}
              disabled={!isValidOffer}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={
                isValidOffer
                  ? {
                      background: "linear-gradient(135deg, #7c3aed, #00d4ff)",
                      color: "#ffffff",
                    }
                  : {
                      background: "#1a1a2e",
                      color: "#a0a0c0",
                      cursor: "not-allowed",
                    }
              }
            >
              Review Offer →
            </button>
          )}

          {step === "review" && (
            <button
              onClick={handleSubmitOffer}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98 flex items-center justify-center gap-2"
              style={{
                background: isSubmitting
                  ? "#1a1a2e"
                  : "linear-gradient(135deg, #7c3aed, #00d4ff)",
                color: isSubmitting ? "#a0a0c0" : "#ffffff",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "#a0a0c066",
                      borderTopColor: "#a0a0c0",
                    }}
                  />
                  Submitting offer...
                </>
              ) : (
                "📬 Submit Offer"
              )}
            </button>
          )}

          {step === "success" && (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={{
                background: "linear-gradient(135deg, #7c3aed22, #00d4ff22)",
                color: "#00d4ff",
                border: "1px solid #00d4ff44",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
