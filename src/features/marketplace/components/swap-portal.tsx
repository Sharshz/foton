"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";

// Base mainnet token addresses
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

type Token = "ETH" | "USDC";

const TOKEN_META: Record<Token, { symbol: string; label: string; color: string; decimals: number; address: string }> = {
  ETH: {
    symbol: "Ξ",
    label: "Ethereum",
    color: "#00d4ff",
    decimals: 18,
    address: ETH_ADDRESS,
  },
  USDC: {
    symbol: "$",
    label: "USD Coin",
    color: "#2775ca",
    decimals: 6,
    address: USDC_ADDRESS,
  },
};

function TokenIcon({ token }: { token: Token }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
      style={
        token === "ETH"
          ? { background: "linear-gradient(135deg, #00d4ff33, #7c3aed33)", color: "#00d4ff", border: "1px solid #00d4ff44" }
          : { background: "rgba(39,117,202,0.15)", color: "#2775ca", border: "1px solid #2775ca44" }
      }
    >
      {token === "ETH" ? "Ξ" : "$"}
    </div>
  );
}

interface SwapPortalProps {
  onClose: () => void;
}

export function SwapPortal({ onClose }: SwapPortalProps) {
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState<Token>("ETH");
  const [toToken, setToToken] = useState<Token>("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [animating, setAnimating] = useState(false);

  const toTokenComputed = fromToken === "ETH" ? "USDC" : "ETH";
  // keep toToken in sync
  useEffect(() => {
    setToToken(toTokenComputed);
  }, [fromToken, toTokenComputed]);

  const { data: prices } = useSimplePrice(
    ["ethereum"],
    ["usd"],
    { include24hrChange: true },
    { refetchInterval: 30_000 }
  );

  const ethUsd = prices?.ethereum?.usd ?? null;
  const ethChange = (prices?.ethereum as Record<string, number> | undefined)?.["usd_24h_change"] ?? null;

  // Estimated output
  const fromNum = parseFloat(fromAmount) || 0;
  const toAmount = (() => {
    if (!fromNum || !ethUsd) return "";
    if (fromToken === "ETH") return (fromNum * ethUsd).toFixed(2);
    return (fromNum / ethUsd).toFixed(6);
  })();

  const rate = ethUsd
    ? fromToken === "ETH"
      ? `1 ETH ≈ $${ethUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : `1 USDC ≈ Ξ ${(1 / ethUsd).toFixed(6)}`
    : null;

  function flip() {
    setAnimating(true);
    setTimeout(() => {
      setFromToken((t) => (t === "ETH" ? "USDC" : "ETH"));
      setFromAmount(toAmount);
      setAnimating(false);
    }, 180);
  }

  function openUniswap() {
    const inputCurrency = TOKEN_META[fromToken].address;
    const outputCurrency = TOKEN_META[toToken].address;
    const params = new URLSearchParams({
      inputCurrency,
      outputCurrency,
      chain: "base",
      ...(fromAmount ? { exactAmount: fromAmount, exactField: "input" } : {}),
    });
    window.open(`https://app.uniswap.org/swap?${params}`, "_blank");
  }

  const canSwap = fromNum > 0 && !!ethUsd;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl px-5 pt-4 pb-8"
        style={{ background: "#12121f", border: "1px solid #2a2a3e" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#2a2a3e" }} />

        {/* Title row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-white">Swap</h2>
            <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
              Powered by Uniswap · Base
            </p>
          </div>
          {/* Live rate badge */}
          {ethUsd && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid #2a2a3e",
                color: ethChange !== null && ethChange >= 0 ? "#00ff88" : "#ff5050",
              }}
            >
              ETH ${ethUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              {ethChange !== null && (
                <span>
                  {ethChange >= 0 ? " ▲" : " ▼"} {Math.abs(ethChange).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* From */}
        <div
          className="rounded-2xl p-4 mb-2"
          style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>From</span>
            {address && (
              <span className="text-xs" style={{ color: "#a0a0c0" }}>
                Wallet: {fromToken === "ETH" ? "Ξ" : "$"} —
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <TokenIcon token={fromToken} />
            <div className="flex-1">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-xl font-bold outline-none"
                style={{ color: "#ffffff", caretColor: TOKEN_META[fromToken].color }}
                inputMode="decimal"
              />
            </div>
            <div
              className="rounded-xl px-3 py-1.5 flex items-center gap-1.5 shrink-0"
              style={{ background: "#1a1a2e", border: "1px solid #2a2a3e" }}
            >
              <span className="text-sm font-bold" style={{ color: TOKEN_META[fromToken].color }}>
                {fromToken}
              </span>
            </div>
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center my-1 relative z-10">
          <button
            onClick={flip}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "#1a1a2e",
              border: "1px solid #2a2a3e",
              color: "#a0a0c0",
              transform: animating ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease",
            }}
          >
            ⇅
          </button>
        </div>

        {/* To */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>To (estimated)</span>
          </div>
          <div className="flex items-center gap-3">
            <TokenIcon token={toToken} />
            <div className="flex-1">
              <p
                className="text-xl font-bold"
                style={{ color: toAmount ? TOKEN_META[toToken].color : "#2a2a3e" }}
              >
                {toAmount || "0.00"}
              </p>
            </div>
            <div
              className="rounded-xl px-3 py-1.5 flex items-center gap-1.5 shrink-0"
              style={{ background: "#1a1a2e", border: "1px solid #2a2a3e" }}
            >
              <span className="text-sm font-bold" style={{ color: TOKEN_META[toToken].color }}>
                {toToken}
              </span>
            </div>
          </div>
        </div>

        {/* Rate info */}
        {rate && (
          <div className="flex items-center justify-between px-1 mb-4">
            <span className="text-xs" style={{ color: "#a0a0c0" }}>{rate}</span>
            <span className="text-xs" style={{ color: "#a0a0c0" }}>via Uniswap V3</span>
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={openUniswap}
          disabled={!canSwap}
          className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={
            canSwap
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
          {canSwap ? `Swap ${fromToken} → ${toToken} on Uniswap ↗` : "Enter an amount"}
        </button>

        <p className="text-xs text-center mt-3" style={{ color: "#7c7c9c" }}>
          Opens Uniswap · transaction executes on Base
        </p>
      </div>
    </div>
  );
}
