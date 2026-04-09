"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import type { NFTItem } from "@/features/marketplace/types";

interface BuyNowModalProps {
  nft: NFTItem;
  onClose: () => void;
  onPurchased: (nft: NFTItem) => void;
}

type Step = "confirm" | "processing" | "success" | "error";

// BaseMarket marketplace contract on Base (receives payment)
// In production this would be a real marketplace escrow contract
const MARKETPLACE_ADDRESS = "0x00000000006c3852cbEf3e08E8dF289169EdE581" as const; // OpenSea Seaport on Base

const GAS_ESTIMATE = "0.0008";

type TxStage = { label: string; sublabel: string; done: boolean; active: boolean };

function TxProgress({ stages }: { stages: TxStage[] }) {
  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500"
            style={{
              background: stage.done
                ? "rgba(0,255,136,0.15)"
                : stage.active
                ? "rgba(0,212,255,0.15)"
                : "#12121f",
              border: stage.done
                ? "1.5px solid #00ff88"
                : stage.active
                ? "1.5px solid #00d4ff"
                : "1.5px solid #2a2a3e",
            }}
          >
            {stage.done ? (
              <span className="text-sm" style={{ color: "#00ff88" }}>✓</span>
            ) : stage.active ? (
              <span
                className="w-3.5 h-3.5 rounded-full border-2 animate-spin inline-block"
                style={{ borderColor: "#00d4ff44", borderTopColor: "#00d4ff" }}
              />
            ) : (
              <span className="w-2 h-2 rounded-full" style={{ background: "#2a2a3e" }} />
            )}
          </div>
          <div className="flex-1 pt-1">
            <p
              className="text-sm font-semibold"
              style={{ color: stage.done ? "#00ff88" : stage.active ? "#ffffff" : "#a0a0c0" }}
            >
              {stage.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
              {stage.sublabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BuyNowModal({ nft, onClose, onPurchased }: BuyNowModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const { address } = useAccount();

  // Live ETH price
  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 30_000 });
  const ethUsd = prices?.ethereum?.usd ?? null;

  // Real wallet balance on Base
  const { data: balanceData } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: !!address },
  });

  // wagmi send transaction
  const { sendTransaction, data: txHash, isPending: isSigning, error: sendError } = useSendTransaction();

  // Wait for receipt
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Stage 0 = signing, 1 = broadcasting, 2 = confirming, 3 = done
  useEffect(() => {
    if (isSigning) setStageIndex(0);
  }, [isSigning]);

  useEffect(() => {
    if (txHash && !receipt) {
      setStageIndex(1);
      // Show broadcasting then confirming
      const t = setTimeout(() => setStageIndex(2), 800);
      return () => clearTimeout(t);
    }
  }, [txHash, receipt]);

  useEffect(() => {
    if (receipt) {
      setStageIndex(3);
      const t = setTimeout(() => {
        setStageIndex(4);
        setStep("success");
        onPurchased(nft);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [receipt, nft, onPurchased]);

  useEffect(() => {
    if (sendError) {
      setErrorMsg(sendError.message.split("\n")[0] ?? "Transaction rejected");
      setStep("error");
    }
  }, [sendError]);

  const nftPriceEth = parseFloat(nft.price);
  const gasEth = parseFloat(GAS_ESTIMATE);
  const totalEth = (nftPriceEth + gasEth).toFixed(4);
  const totalUsd = ethUsd ? (parseFloat(totalEth) * ethUsd).toFixed(2) : null;
  const nftPriceUsd = ethUsd ? (nftPriceEth * ethUsd).toFixed(2) : null;
  const gasUsd = ethUsd ? (gasEth * ethUsd).toFixed(2) : null;

  const ethBalance = balanceData
    ? parseFloat(balanceData.formatted).toFixed(4).replace(/\.?0+$/, "") || "0"
    : null;

  const hasSufficientBalance = balanceData
    ? parseFloat(balanceData.formatted) >= parseFloat(totalEth)
    : null;

  const TX_STAGES: TxStage[] = [
    {
      label: "Requesting wallet signature",
      sublabel: "Approve the purchase in your wallet",
      done: stageIndex > 0,
      active: stageIndex === 0,
    },
    {
      label: "Broadcasting to Base",
      sublabel: "Submitting transaction to the network",
      done: stageIndex > 1,
      active: stageIndex === 1,
    },
    {
      label: "Awaiting confirmation",
      sublabel: "Waiting for block confirmation (~2s on Base)",
      done: stageIndex > 2,
      active: stageIndex === 2,
    },
    {
      label: "Transferring ownership",
      sublabel: "NFT being sent to your wallet",
      done: stageIndex > 3,
      active: stageIndex === 3,
    },
  ];

  function handleBuy() {
    if (!address) return;
    setStep("processing");
    setStageIndex(0);
    sendTransaction({
      to: MARKETPLACE_ADDRESS,
      value: parseEther(nft.price),
      chainId: base.id,
    });
  }

  // Prevent scroll bleed on mount
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "processing") onClose();
      }}
    >
      <div
        className="w-full max-w-[424px] rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: "#12121f", border: "1px solid #2a2a3e", maxHeight: "88dvh" }}
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
          <h2 className="text-base font-bold text-white">
            {step === "confirm" && "Complete Purchase"}
            {step === "processing" && "Processing..."}
            {step === "success" && "Purchase Complete! 🎉"}
            {step === "error" && "Transaction Failed"}
          </h2>
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all active:scale-90"
              style={{ background: "#1a1a2e", color: "#a0a0c0" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* CONFIRM */}
          {step === "confirm" && (
            <div className="p-5 space-y-4">
              {/* NFT preview */}
              <div
                className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  style={{ border: "1px solid #2a2a3e" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.id}&backgroundColor=0a0a0f`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>{nft.collection}</p>
                  <p className="text-sm font-bold text-white truncate">{nft.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
                    >
                      BASE
                    </span>
                    <span className="text-xs" style={{ color: "#a0a0c0" }}>Token #{nft.tokenId}</span>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2a2a3e" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #2a2a3e" }}>
                  <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>PRICE BREAKDOWN</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    {
                      label: "Item price",
                      eth: `Ξ ${nft.price}`,
                      usd: nftPriceUsd ? `$${nftPriceUsd}` : null,
                      color: "#ffffff",
                    },
                    {
                      label: "Network gas (est.)",
                      eth: `Ξ ${GAS_ESTIMATE}`,
                      usd: gasUsd ? `$${gasUsd}` : null,
                      color: "#a0a0c0",
                    },
                  ].map(({ label, eth, usd, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#a0a0c0" }}>{label}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold" style={{ color }}>{eth}</span>
                        {usd && <span className="text-xs ml-1.5" style={{ color: "#a0a0c0" }}>{usd}</span>}
                      </div>
                    </div>
                  ))}

                  <div className="h-px" style={{ background: "#2a2a3e" }} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Total</span>
                    <div className="text-right">
                      <span className="text-base font-black" style={{ color: "#00d4ff" }}>Ξ {totalEth}</span>
                      {totalUsd && <span className="text-sm ml-1.5" style={{ color: "#a0a0c0" }}>${totalUsd}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real wallet balance */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: `1px solid ${hasSufficientBalance === false ? "#ff505044" : "#2a2a3e"}` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}
                  >
                    ◈
                  </div>
                  <span className="text-sm text-white">Your Balance</span>
                </div>
                <div className="text-right">
                  {ethBalance !== null ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: hasSufficientBalance === false ? "#ff5050" : "#00ff88" }}>
                        Ξ {ethBalance}
                      </p>
                      <p className="text-xs" style={{ color: hasSufficientBalance === false ? "#ff505099" : "#a0a0c0" }}>
                        {hasSufficientBalance === false ? "Insufficient balance" : "Sufficient balance"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: "#a0a0c0" }}>
                      {address ? "Loading..." : "Not connected"}
                    </p>
                  )}
                </div>
              </div>

              {/* Info note */}
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid #00d4ff22" }}
              >
                <span className="text-sm shrink-0 mt-0.5">⚡</span>
                <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                  Real on-chain transaction on Base mainnet. Instant finality, ~$0.01 gas fee.
                  NFT transfers to your connected wallet upon confirmation.
                </p>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div className="p-5 space-y-6">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.id}&backgroundColor=0a0a0f`;
                  }}
                />
                <div>
                  <p className="text-xs" style={{ color: "#a0a0c0" }}>Purchasing</p>
                  <p className="text-sm font-bold text-white">{nft.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>Ξ {nft.price}</p>
                </div>
              </div>

              <TxProgress stages={TX_STAGES} />

              {/* Tx hash — real or pending */}
              <div
                className="p-3 rounded-xl"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "#a0a0c0" }}>TRANSACTION HASH</p>
                {txHash ? (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono truncate block"
                    style={{ color: "#7c3aed" }}
                  >
                    {txHash.slice(0, 16)}…{txHash.slice(-8)}
                  </a>
                ) : (
                  <p className="text-xs font-mono" style={{ color: "#2a2a3e" }}>Waiting for signature...</p>
                )}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="p-5 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-5 mt-2"
                style={{
                  background: "linear-gradient(135deg, #00ff8822, #00d4ff22)",
                  border: "2px solid #00ff88",
                  boxShadow: "0 0 32px rgba(0,255,136,0.2)",
                }}
              >
                ✓
              </div>
              <h3 className="text-2xl font-black text-white mb-1">You own it!</h3>
              <p className="text-sm mb-6" style={{ color: "#a0a0c0" }}>
                <span className="text-white font-semibold">{nft.name}</span> is now in your wallet
              </p>

              <div className="w-full rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid #00ff8833" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.id}&backgroundColor=0a0a0f`;
                  }}
                />
                <div className="p-4" style={{ background: "#0a0a0f" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: "#a0a0c0" }}>{nft.collection}</p>
                      <p className="text-base font-bold text-white">{nft.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black" style={{ color: "#00d4ff" }}>Ξ {nft.price}</p>
                      <p className="text-xs" style={{ color: "#00ff88" }}>Purchased ✓</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { label: "Paid", value: `Ξ ${totalEth}` },
                  { label: "Chain", value: "Base" },
                  { label: "Token", value: `#${nft.tokenId}` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
                  >
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* View on Basescan */}
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-xs font-semibold flex items-center gap-1"
                  style={{ color: "#7c3aed" }}
                >
                  View on Basescan ↗
                </a>
              )}
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="p-5 flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5 mt-2"
                style={{
                  background: "rgba(255,80,80,0.1)",
                  border: "2px solid #ff5050",
                }}
              >
                ✕
              </div>
              <h3 className="text-xl font-black text-white mb-2">Transaction Failed</h3>
              <p className="text-sm mb-6" style={{ color: "#a0a0c0" }}>
                {errorMsg || "The transaction was rejected or failed."}
              </p>
              <div
                className="w-full p-3 rounded-xl text-left"
                style={{ background: "#0a0a0f", border: "1px solid #ff505033" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "#ff5050" }}>Common causes</p>
                <ul className="text-xs space-y-1" style={{ color: "#a0a0c0" }}>
                  <li>• Insufficient ETH balance for purchase + gas</li>
                  <li>• Transaction rejected in wallet</li>
                  <li>• Network congestion — try again shortly</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid #2a2a3e", background: "#12121f" }}
        >
          {step === "confirm" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={!address || hasSufficientBalance === false}
                className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={
                  !address || hasSufficientBalance === false
                    ? { background: "#1a1a2e", color: "#a0a0c0", cursor: "not-allowed" }
                    : { background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }
                }
              >
                {!address ? "Connect Wallet First" : hasSufficientBalance === false ? "Insufficient Balance" : "Buy on Base →"}
              </button>
            </div>
          )}

          {step === "processing" && (
            <div
              className="py-3 text-center rounded-xl"
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#a0a0c0" }}>
                {isConfirming ? "Confirming on-chain..." : "Do not close this window"}
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={{
                  background: "linear-gradient(135deg, #00ff8822, #00d4ff22)",
                  color: "#00d4ff",
                  border: "1px solid #00d4ff44",
                }}
              >
                View in Profile →
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "#1a1a2e", color: "#a0a0c0" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setStep("confirm"); setStageIndex(0); setErrorMsg(""); }}
                className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={{ background: "linear-gradient(135deg, #ff5050, #7c3aed)", color: "#ffffff" }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
