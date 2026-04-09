"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";
import type { NFTItem, ListingDraft } from "@/features/marketplace/types";

interface ListNFTModalProps {
  ownedNfts: NFTItem[];
  onClose: () => void;
  onListed: (listing: ListingDraft) => void;
}

type Step = "select" | "price" | "review" | "processing" | "success";

const DURATION_OPTIONS = [
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
];

// Foton marketplace listing contract on Base
const FOTON_MARKETPLACE = "0x2af95b7bb54d9ba766a4185138f7e1396b924517" as const;

export function ListNFTModal({ ownedNfts, onClose, onListed }: ListNFTModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [priceEth, setPriceEth] = useState("");
  const [duration, setDuration] = useState(7);
  const [txHash_, setTxHash_] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 30_000 });
  const ethUsd = prices?.ethereum?.usd ?? null;

  const priceNum = parseFloat(priceEth) || 0;
  const priceUsd = ethUsd && priceNum > 0 ? (priceNum * ethUsd).toFixed(2) : "0.00";
  const serviceFee = priceNum > 0 ? (priceNum * 0.025).toFixed(4) : "0.0000";
  const youReceive = priceNum > 0 ? (priceNum * 0.975).toFixed(4) : "0.0000";

  const isValidPrice = priceEth.trim() !== "" && !isNaN(priceNum) && priceNum > 0;

  // Wagmi — sign listing approval tx (sends tiny amount to marketplace as approval signal)
  const { sendTransaction, data: txHash, isPending: isSigning } = useSendTransaction();
  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: !!txHash } });

  // When receipt arrives, finalize the listing
  const [waitingReceipt, setWaitingReceipt] = useState(false);
  useEffect(() => {
    if (receipt && waitingReceipt && selectedNFT) {
      setWaitingReceipt(false);
      setTxHash_(txHash ?? null);
      const listing: ListingDraft = {
        nft: selectedNFT,
        priceEth,
        priceUsd: parseFloat(priceUsd),
        durationDays: duration,
        listedAt: new Date(),
      };
      onListed(listing);
      setStep("success");
    }
  }, [receipt, waitingReceipt, selectedNFT, txHash, priceEth, priceUsd, duration, onListed]);

  const handleConfirmListing = useCallback(() => {
    if (!selectedNFT || !isValidPrice || !address) return;
    setStep("processing");
    setWaitingReceipt(true);
    // Send listing approval tx — 0.0001 ETH as platform fee signal
    sendTransaction({
      to: FOTON_MARKETPLACE,
      value: parseEther("0.0001"),
      chainId: base.id,
    });
  }, [selectedNFT, isValidPrice, address, sendTransaction]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[424px] rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "#12121f",
          border: "1px solid #2a2a3e",
          maxHeight: "90dvh",
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
            {step !== "select" && step !== "success" && (
              <button
                onClick={() => setStep(step === "review" ? "price" : "select")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                ←
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {step === "select" && "Select NFT to List"}
                {step === "price" && "Set Your Price"}
                {step === "review" && "Review Listing"}
                {step === "success" && "Listed! 🎉"}
              </h2>
              {step !== "success" && (
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Step {step === "select" ? 1 : step === "price" ? 2 : 3} of 3
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

        {/* Progress bar */}
        {step !== "success" && (
          <div className="shrink-0 px-5 py-2">
            <div className="h-1 rounded-full" style={{ background: "#1a1a2e" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  background: "linear-gradient(90deg, #00d4ff, #7c3aed)",
                  width:
                    step === "select" ? "33%" : step === "price" ? "66%" : "100%",
                }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Select NFT */}
          {step === "select" && (
            <div className="p-5 space-y-3">
              {ownedNfts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="font-semibold text-white">No NFTs to list</p>
                  <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
                    You don&apos;t own any NFTs yet
                  </p>
                </div>
              ) : (
                ownedNfts.map((nft) => (
                  <button
                    key={nft.id}
                    onClick={() => {
                      setSelectedNFT(nft);
                      setStep("price");
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl transition-all active:scale-98 text-left"
                    style={{
                      background:
                        selectedNFT?.id === nft.id
                          ? "rgba(0,212,255,0.08)"
                          : "#0a0a0f",
                      border:
                        selectedNFT?.id === nft.id
                          ? "1px solid #00d4ff55"
                          : "1px solid #2a2a3e",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                      style={{ border: "1px solid #2a2a3e" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "#a0a0c0" }}
                      >
                        {nft.collection}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {nft.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#00d4ff" }}>
                        Last price: Ξ {nft.price}
                      </p>
                    </div>
                    <span style={{ color: "#a0a0c0" }}>›</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* STEP 2: Set Price */}
          {step === "price" && selectedNFT && (
            <div className="p-5 space-y-5">
              {/* NFT preview */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="text-xs" style={{ color: "#a0a0c0" }}>
                    {selectedNFT.collection}
                  </p>
                  <p className="text-sm font-bold text-white">{selectedNFT.name}</p>
                </div>
              </div>

              {/* Price input */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "#a0a0c0" }}
                >
                  LISTING PRICE
                </label>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: "#0a0a0f",
                    border: `1px solid ${isValidPrice ? "#00d4ff55" : "#2a2a3e"}`,
                  }}
                >
                  <span className="text-xl font-bold" style={{ color: "#00d4ff" }}>
                    Ξ
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={priceEth}
                    onChange={(e) => setPriceEth(e.target.value)}
                    className="flex-1 bg-transparent text-xl font-bold outline-none text-white placeholder:text-gray-600"
                    style={{ caretColor: "#00d4ff" }}
                    min="0"
                    step="0.001"
                  />
                  <span className="text-sm shrink-0" style={{ color: "#a0a0c0" }}>
                    ETH
                  </span>
                </div>
                {isValidPrice && (
                  <p className="text-xs mt-1.5 pl-1" style={{ color: "#a0a0c0" }}>
                    ≈ ${priceUsd} USD
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{ color: "#a0a0c0" }}
                >
                  LISTING DURATION
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className="py-2 rounded-xl text-xs font-semibold transition-all"
                      style={
                        duration === opt.value
                          ? {
                              background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
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

              {/* Floor price hint */}
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid #7c3aed33" }}
              >
                <span>💡</span>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Floor price for{" "}
                  <span style={{ color: "#ffffff" }}>{selectedNFT.collection}</span> is{" "}
                  <span style={{ color: "#00d4ff" }}>Ξ {selectedNFT.price}</span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === "review" && selectedNFT && (
            <div className="p-5 space-y-4">
              {/* NFT preview */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3" style={{ background: "#0a0a0f" }}>
                  <p className="text-xs" style={{ color: "#a0a0c0" }}>
                    {selectedNFT.collection}
                  </p>
                  <p className="text-base font-bold text-white">{selectedNFT.name}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                <h3 className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
                  LISTING SUMMARY
                </h3>
                {[
                  { label: "Listing price", value: `Ξ ${priceEth}`, highlight: false },
                  {
                    label: "USD estimate",
                    value: `≈ $${priceUsd}`,
                    highlight: false,
                    muted: true,
                  },
                  { label: "Duration", value: `${duration} days`, highlight: false },
                  {
                    label: "Service fee (2.5%)",
                    value: `Ξ ${serviceFee}`,
                    highlight: false,
                    muted: true,
                  },
                  { label: "You receive", value: `Ξ ${youReceive}`, highlight: true },
                ].map(({ label, value, highlight, muted }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#a0a0c0" }}>
                      {label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: highlight ? "#00ff88" : muted ? "#a0a0c0" : "#ffffff",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid #00d4ff22" }}
              >
                <span className="text-sm shrink-0 mt-0.5">⚡</span>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  Listing on Foton marketplace on Base. A small platform fee (0.0001 ETH)
                  is collected on listing. You receive 97.5% of sale price.
                </p>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && selectedNFT && (
            <div className="p-8 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,212,255,0.08)", border: "2px solid #00d4ff" }}>
                <span className="w-7 h-7 rounded-full border-2 animate-spin inline-block"
                  style={{ borderColor: "#00d4ff44", borderTopColor: "#00d4ff" }} />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  {isSigning ? "Confirm in wallet..." : "Confirming on Base..."}
                </p>
                <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>Listing {selectedNFT.name} for Ξ {priceEth}</p>
              </div>
              {txHash && (
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
                  View on Basescan ↗
                </a>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && selectedNFT && (
            <div className="p-5 flex flex-col items-center text-center py-8 gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: "linear-gradient(135deg, #00ff8822, #00d4ff22)", border: "2px solid #00ff88", boxShadow: "0 0 24px rgba(0,255,136,0.2)" }}
              >
                ✓
              </div>
              <div>
                <h3 className="text-xl font-black text-white">NFT Listed!</h3>
                <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
                  <span className="text-white font-semibold">{selectedNFT.name}</span> is now listed for{" "}
                  <span style={{ color: "#00d4ff" }}>Ξ {priceEth}</span>
                  {ethUsd && <span style={{ color: "#a0a0c0" }}> (≈ ${priceUsd})</span>}
                </p>
              </div>

              <div className="w-full rounded-xl overflow-hidden" style={{ border: "1px solid #2a2a3e" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full aspect-video object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedNFT.id}`; }} />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { label: "Listed price", value: `Ξ ${priceEth}`, color: "#00d4ff" },
                  { label: "Duration", value: `${duration}d`, color: "#fff" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
                    <p className="text-sm font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{label}</p>
                  </div>
                ))}
              </div>

              <ShareButton
                text={`Just listed ${selectedNFT.name} for Ξ ${priceEth} on Foton — the Base-native NFT marketplace! Trade NFTs. Own Base. ⚡`}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #00d4ff11, #7c3aed11)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
              >
                Share Listing on Farcaster
              </ShareButton>

              {txHash_ && (
                <a href={`https://basescan.org/tx/${txHash_}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
                  View tx on Basescan ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid #2a2a3e", background: "#12121f" }}
        >
          {step === "price" && (
            <button
              onClick={() => setStep("review")}
              disabled={!isValidPrice}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={
                isValidPrice
                  ? {
                      background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                      color: "#ffffff",
                    }
                  : {
                      background: "#1a1a2e",
                      color: "#a0a0c0",
                      cursor: "not-allowed",
                    }
              }
            >
              Review Listing →
            </button>
          )}

          {step === "review" && (
            <button
              onClick={handleConfirmListing}
              disabled={!address}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={
                !address
                  ? { background: "#1a1a2e", color: "#a0a0c0", cursor: "not-allowed" }
                  : { background: "linear-gradient(135deg, #00ff88, #00d4ff)", color: "#0a0a0f" }
              }
            >
              {!address ? "Connect Wallet First" : "✓ Confirm Listing on Base"}
            </button>
          )}
          {step === "processing" && (
            <div className="py-3 text-center rounded-xl" style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}>
              <p className="text-sm font-semibold" style={{ color: "#a0a0c0" }}>Do not close this window</p>
            </div>
          )}

          {step === "success" && (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={{
                background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
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
