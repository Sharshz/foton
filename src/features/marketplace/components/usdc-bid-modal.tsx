"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance } from "wagmi";
import { base } from "wagmi/chains";
import { useUsdcBalanceOf } from "@/neynar-web-sdk/blockchain";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import type { NFTItem } from "@/features/marketplace/types";

interface UsdcBidModalProps {
  nft: NFTItem;
  onClose: () => void;
  onBidPlaced: (nft: NFTItem, bidUsd: string) => void;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const EXPIRY_OPTIONS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

export function UsdcBidModal({ nft, onClose, onBidPlaced }: UsdcBidModalProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [expiryIdx, setExpiryIdx] = useState(1);
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [error, setError] = useState("");

  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address, chainId: base.id, query: { enabled: !!address } });
  const { data: usdcRaw } = useUsdcBalanceOf(address ?? "0x0000000000000000000000000000000000000000");
  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 30_000 });

  const ethUsd = prices?.ethereum?.usd ?? null;
  const usdcBalance = usdcRaw ? Number(usdcRaw) / 1_000_000 : 0;
  const nftFloorUsd = ethUsd ? parseFloat(nft.price) * ethUsd : nft.priceUsd;

  const bidNum = parseFloat(bidAmount) || 0;
  const bidPct = nftFloorUsd > 0 ? Math.round((bidNum / nftFloorUsd) * 100) : 0;
  const hasSufficientUsdc = usdcBalance >= bidNum;

  function validate() {
    if (!bidAmount || bidNum <= 0) { setError("Enter a bid amount"); return false; }
    if (bidNum < nftFloorUsd * 0.1) { setError(`Minimum bid is $${(nftFloorUsd * 0.1).toFixed(2)}`); return false; }
    if (!hasSufficientUsdc) { setError(`Insufficient USDC — you have $${usdcBalance.toFixed(2)}`); return false; }
    return true;
  }

  function handleNext() {
    setError("");
    if (validate()) setStep("confirm");
  }

  const handlePlaceBid = useCallback(() => {
    // In production: approve USDC + call marketplace bid contract
    setStep("success");
    onBidPlaced(nft, String(bidNum));
  }, [nft, bidNum, onBidPlaced]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const expiry = EXPIRY_OPTIONS[expiryIdx];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== "confirm") onClose(); }}
    >
      <div
        className="w-full max-w-[424px] rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: "#12121f", border: "1px solid #2a2a3e", maxHeight: "90dvh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#2a2a3e" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid #2a2a3e" }}>
          <div>
            <h2 className="text-base font-bold text-white">
              {step === "input" && "Place a Bid"}
              {step === "confirm" && "Confirm Bid"}
              {step === "success" && "Bid Placed! 🎯"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>Pay with USDC on Base</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "#1a1a2e", color: "#a0a0c0" }}
          >✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* INPUT STEP */}
          {step === "input" && (
            <div className="p-5 space-y-4">
              {/* NFT preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded-xl object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.id}`; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>{nft.collection}</p>
                  <p className="text-sm font-bold text-white truncate">{nft.name}</p>
                  <p className="text-xs" style={{ color: "#a0a0c0" }}>
                    Floor: Ξ {nft.price} {ethUsd ? `· $${nftFloorUsd.toLocaleString()}` : ""}
                  </p>
                </div>
              </div>

              {/* Bid input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>YOUR BID (USDC)</label>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "#0a0a0f", border: `1px solid ${error ? "#ff505044" : "#2a2a3e"}` }}
                >
                  <span className="text-2xl font-black shrink-0" style={{ color: "#a0a0c0" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => { setBidAmount(e.target.value); setError(""); }}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-black text-white outline-none"
                    style={{ minWidth: 0 }}
                  />
                  <span className="text-sm font-bold shrink-0" style={{ color: "#a0a0c0" }}>USDC</span>
                </div>
                {error && <p className="text-xs" style={{ color: "#ff5050" }}>{error}</p>}
              </div>

              {/* Quick bid buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 75, 90, 100].map((p) => {
                  const amount = ((nftFloorUsd * p) / 100).toFixed(2);
                  return (
                    <button
                      key={p}
                      onClick={() => { setBidAmount(amount); setError(""); }}
                      className="py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={{
                        background: bidAmount === amount ? "rgba(0,212,255,0.15)" : "#1a1a2e",
                        color: bidAmount === amount ? "#00d4ff" : "#a0a0c0",
                        border: bidAmount === amount ? "1px solid rgba(0,212,255,0.3)" : "1px solid #2a2a3e",
                      }}
                    >
                      {p}%
                    </button>
                  );
                })}
              </div>
              {bidNum > 0 && (
                <p className="text-xs text-center" style={{ color: "#a0a0c0" }}>
                  {bidPct}% of floor price
                </p>
              )}

              {/* Expiry */}
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>BID EXPIRES IN</label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPIRY_OPTIONS.map(({ label }, i) => (
                    <button
                      key={label}
                      onClick={() => setExpiryIdx(i)}
                      className="py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                      style={{
                        background: expiryIdx === i ? "rgba(124,58,237,0.15)" : "#1a1a2e",
                        color: expiryIdx === i ? "#7c3aed" : "#a0a0c0",
                        border: expiryIdx === i ? "1px solid rgba(124,58,237,0.3)" : "1px solid #2a2a3e",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* USDC balance */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: `1px solid ${!hasSufficientUsdc && bidNum > 0 ? "#ff505044" : "#2a2a3e"}` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#2775ca", color: "#fff" }}>$</div>
                  <span className="text-sm text-white">USDC Balance</span>
                </div>
                <p className="text-sm font-bold" style={{ color: !hasSufficientUsdc && bidNum > 0 ? "#ff5050" : "#00ff88" }}>
                  ${usdcBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* CONFIRM STEP */}
          {step === "confirm" && (
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl space-y-3" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
                <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>BID SUMMARY</p>
                {[
                  { label: "NFT", value: nft.name },
                  { label: "Collection", value: nft.collection },
                  { label: "Your bid", value: `$${parseFloat(bidAmount).toFixed(2)} USDC` },
                  { label: "Floor price", value: `$${nftFloorUsd.toFixed(2)}` },
                  { label: "Bid vs floor", value: `${bidPct}%` },
                  { label: "Expires", value: `In ${expiry.label}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#a0a0c0" }}>{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <span className="text-sm shrink-0">⚡</span>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  USDC will be held in escrow until the seller accepts or your bid expires. You can cancel anytime before acceptance.
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 mt-2"
                style={{ background: "rgba(124,58,237,0.1)", border: "2px solid #7c3aed", boxShadow: "0 0 24px rgba(124,58,237,0.2)" }}>
                🎯
              </div>
              <h3 className="text-xl font-black text-white mb-2">Bid Placed!</h3>
              <p className="text-sm mb-1" style={{ color: "#a0a0c0" }}>
                You bid <span className="text-white font-bold">${parseFloat(bidAmount).toFixed(2)} USDC</span>
              </p>
              <p className="text-sm mb-6" style={{ color: "#a0a0c0" }}>
                on <span className="text-white font-bold">{nft.name}</span>
              </p>
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { label: "Bid", value: `$${parseFloat(bidAmount).toFixed(2)}` },
                  { label: "vs Floor", value: `${bidPct}%` },
                  { label: "Expires", value: expiry.label },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4" style={{ borderTop: "1px solid #2a2a3e", background: "#12121f" }}>
          {step === "input" && (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-sm" style={{ background: "#1a1a2e", color: "#a0a0c0" }}>Cancel</button>
              <button onClick={handleNext} disabled={!address} className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={!address ? { background: "#1a1a2e", color: "#a0a0c0", cursor: "not-allowed" } : { background: "linear-gradient(135deg, #7c3aed, #00d4ff)", color: "#fff" }}>
                {!address ? "Connect Wallet" : "Review Bid →"}
              </button>
            </div>
          )}
          {step === "confirm" && (
            <div className="flex gap-3">
              <button onClick={() => setStep("input")} className="flex-1 py-3.5 rounded-xl font-bold text-sm" style={{ background: "#1a1a2e", color: "#a0a0c0" }}>← Back</button>
              <button onClick={handlePlaceBid} className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={{ background: "linear-gradient(135deg, #7c3aed, #00d4ff)", color: "#fff" }}>
                Place Bid · ${parseFloat(bidAmount || "0").toFixed(2)} USDC
              </button>
            </div>
          )}
          {step === "success" && (
            <button onClick={onClose} className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,212,255,0.2))", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
