"use client";

import { useState, useCallback } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useSimplePrice } from "@/neynar-web-sdk/coingecko";
import { useFotonNotifications } from "@/features/marketplace/hooks/use-foton-notifications";
import { MOCK_ACTIVITY } from "@/features/marketplace/mock-data";
import type { ActivityItem } from "@/features/marketplace/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_CONFIG: Record<
  ActivityItem["type"],
  { label: string; color: string; bg: string; icon: string }
> = {
  sale:     { label: "Sale",     color: "#00ff88", bg: "rgba(0,255,136,0.1)",    icon: "⚡" },
  listing:  { label: "Listed",   color: "#00d4ff", bg: "rgba(0,212,255,0.1)",    icon: "🏷️" },
  offer:    { label: "Offer",    color: "#a78bfa", bg: "rgba(124,58,237,0.12)",  icon: "📬" },
  accepted: { label: "Accepted", color: "#00ff88", bg: "rgba(0,255,136,0.1)",    icon: "✓"  },
  transfer: { label: "Transfer", color: "#a0a0c0", bg: "rgba(160,160,192,0.1)", icon: "↗️" },
};

type FilterType = "all" | "offers" | "sales" | "listings";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "offers",   label: "Offers" },
  { id: "sales",    label: "Sales" },
  { id: "listings", label: "Listings" },
];

function matchesFilter(item: ActivityItem, filter: FilterType): boolean {
  if (filter === "all") return true;
  if (filter === "offers")   return item.type === "offer" || item.type === "accepted";
  if (filter === "sales")    return item.type === "sale";
  if (filter === "listings") return item.type === "listing";
  return true;
}

type OfferState =
  | { status: "pending" }
  | { status: "sending" }
  | { status: "confirming"; hash: `0x${string}` }
  | { status: "accepted"; hash: `0x${string}` }
  | { status: "declined" }
  | { status: "error"; msg: string };

function OfferCard({
  item,
  state,
  onAccept,
  onDecline,
  ethUsd,
}: {
  item: ActivityItem;
  state: OfferState;
  onAccept: () => void;
  onDecline: () => void;
  ethUsd: number | null;
}) {
  const config = TYPE_CONFIG[item.type];
  const isIncoming = item.type === "offer" && item.to !== "";
  const priceUsd = ethUsd
    ? `$${(parseFloat(item.price) * ethUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : null;

  const borderColor =
    state.status === "accepted" ? "#00ff8855" :
    state.status === "declined" || state.status === "error" ? "#ff505033" :
    "#7c3aed44";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#12121f", border: `1px solid ${borderColor}` }}
    >
      <div className="p-3 flex items-center gap-3">
        {/* NFT Image */}
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid #2a2a3e" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.nftImage}
            alt={item.nftName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`;
            }}
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-semibold rounded-full px-2 py-0.5 shrink-0"
              style={{ color: config.color, background: config.bg }}
            >
              {config.icon} {isIncoming ? "Incoming Offer" : config.label}
            </span>
            {isIncoming && (
              <span
                className="text-xs font-semibold rounded-full px-1.5 py-0.5"
                style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid #00d4ff22" }}
              >
                For you
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white truncate mt-0.5">{item.nftName}</p>
          <p className="text-xs" style={{ color: "#a0a0c0" }}>
            from {item.from} · {timeAgo(item.timestamp)}
          </p>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>Ξ {item.price}</p>
          {priceUsd && <p className="text-xs" style={{ color: "#a0a0c0" }}>{priceUsd}</p>}
          {item.offerExpiryDays && !priceUsd && (
            <p className="text-xs" style={{ color: "#a0a0c0" }}>{item.offerExpiryDays}d left</p>
          )}
        </div>
      </div>

      {/* Accept / Decline row */}
      {isIncoming && state.status === "pending" && (
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={onDecline}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: "rgba(255,80,80,0.08)", color: "#ff5050", border: "1px solid #ff505033" }}
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #00ff8822, #00d4ff22)", color: "#00ff88", border: "1px solid #00ff8844" }}
          >
            ✓ Accept Offer
          </button>
        </div>
      )}

      {/* Sending / confirming states */}
      {isIncoming && (state.status === "sending" || state.status === "confirming") && (
        <div
          className="mx-3 mb-3 py-2.5 rounded-xl flex items-center justify-center gap-2"
          style={{ background: "rgba(0,212,255,0.06)", border: "1px solid #00d4ff22" }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
            style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }}
          />
          <span className="text-xs font-semibold" style={{ color: "#00d4ff" }}>
            {state.status === "sending" ? "Confirm in wallet…" : "Confirming on-chain…"}
          </span>
        </div>
      )}

      {/* Result states */}
      {isIncoming && (state.status === "accepted" || state.status === "declined" || state.status === "error") && (
        <div
          className="mx-3 mb-3 py-2 rounded-xl text-xs font-bold text-center"
          style={
            state.status === "accepted"
              ? { background: "rgba(0,255,136,0.1)", color: "#00ff88" }
              : state.status === "error"
              ? { background: "rgba(255,80,80,0.06)", color: "#ff5050" }
              : { background: "rgba(255,80,80,0.08)", color: "#ff5050" }
          }
        >
          {state.status === "accepted" && "✓ Offer Accepted — Ξ sent to buyer"}
          {state.status === "declined" && "✕ Offer Declined"}
          {state.status === "error" && `✕ ${state.msg}`}
        </div>
      )}

      {/* Basescan link after accepted */}
      {isIncoming && state.status === "accepted" && (
        <a
          href={`https://basescan.org/tx/${state.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-3 mb-3 block text-center text-xs font-semibold"
          style={{ color: "#00d4ff" }}
        >
          View on Basescan ↗
        </a>
      )}
    </div>
  );
}

function ActivityRow({ item, ethUsd }: { item: ActivityItem; ethUsd: number | null }) {
  const config = TYPE_CONFIG[item.type];
  const priceUsd = ethUsd && item.type !== "transfer"
    ? `$${(parseFloat(item.price) * ethUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : null;

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{
        background: "#12121f",
        border: item.type === "accepted" ? "1px solid #00ff8833" : "1px solid #2a2a3e",
      }}
    >
      {/* NFT Image */}
      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid #2a2a3e" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.nftImage}
          alt={item.nftName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`;
          }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold rounded-full px-2 py-0.5 shrink-0"
            style={{ color: config.color, background: config.bg }}
          >
            {config.icon} {config.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-white truncate mt-0.5">{item.nftName}</p>
        <p className="text-xs truncate" style={{ color: "#a0a0c0" }}>
          {item.collection}
          {item.type === "accepted" && item.from && (
            <span style={{ color: "#a78bfa" }}> · offer from {item.from}</span>
          )}
        </p>
      </div>

      {/* Price + time */}
      <div className="text-right shrink-0">
        {item.type !== "transfer" && (
          <>
            <p
              className="text-sm font-bold"
              style={{ color: item.type === "accepted" ? "#00ff88" : "#00d4ff" }}
            >
              Ξ {item.price}
            </p>
            {priceUsd && (
              <p className="text-xs" style={{ color: "#a0a0c0" }}>{priceUsd}</p>
            )}
          </>
        )}
        <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{timeAgo(item.timestamp)}</p>
      </div>
    </div>
  );
}

export function ActivityTab() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [offerStates, setOfferStates] = useState<Record<string, OfferState>>({});
  // Track which offer is currently being sent (only one at a time)
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const { data: prices } = useSimplePrice(["ethereum"], ["usd"], {}, { staleTime: 60_000 });
  const ethUsd = prices?.ethereum?.usd ?? null;

  const { sendTransactionAsync } = useSendTransaction();
  const { notifyBidAccepted } = useFotonNotifications();

  const { data: txHash } = useWaitForTransactionReceipt({
    hash: pendingOfferId
      ? (offerStates[pendingOfferId]?.status === "confirming"
        ? (offerStates[pendingOfferId] as { status: "confirming"; hash: `0x${string}` }).hash
        : undefined)
      : undefined,
    onReplaced: () => {
      if (pendingOfferId) {
        setOfferStates((s) => ({ ...s, [pendingOfferId]: { status: "error", msg: "Transaction replaced" } }));
        setPendingOfferId(null);
      }
    },
  });

  // When tx confirms, mark accepted
  const handleTxConfirmed = useCallback((id: string, hash: `0x${string}`, nftName: string, price: string) => {
    setOfferStates((s) => ({ ...s, [id]: { status: "accepted", hash } }));
    setPendingOfferId(null);
    // Notify the buyer (FID unknown in mock data, skip programmatic notify here — would use real FID from DB)
    void notifyBidAccepted(0, nftName, `Ξ ${price}`);
  }, [notifyBidAccepted]);

  // Poll for receipt after confirming state
  if (
    pendingOfferId &&
    txHash &&
    offerStates[pendingOfferId]?.status === "confirming"
  ) {
    const st = offerStates[pendingOfferId] as { status: "confirming"; hash: `0x${string}` };
    const item = MOCK_ACTIVITY.find((a) => a.id === pendingOfferId);
    handleTxConfirmed(pendingOfferId, st.hash, item?.nftName ?? "NFT", item?.price ?? "0");
  }

  async function handleAccept(item: ActivityItem) {
    const id = item.id;
    setOfferStates((s) => ({ ...s, [id]: { status: "sending" } }));
    setPendingOfferId(id);
    try {
      const hash = await sendTransactionAsync({
        to: "0x2af95b7bb54d9ba766a4185138f7e1396b924517",
        value: parseEther(item.price),
      });
      setOfferStates((s) => ({ ...s, [id]: { status: "confirming", hash } }));
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message.includes("rejected")
        ? "Transaction rejected"
        : "Transaction failed";
      setOfferStates((s) => ({ ...s, [id]: { status: "error", msg } }));
      setPendingOfferId(null);
    }
  }

  function handleDecline(id: string) {
    setOfferStates((s) => ({ ...s, [id]: { status: "declined" } }));
  }

  const incomingOfferCount = MOCK_ACTIVITY.filter(
    (i) => i.type === "offer" && i.to !== "" && (!offerStates[i.id] || offerStates[i.id].status === "pending")
  ).length;

  const filtered = MOCK_ACTIVITY.filter((item) => matchesFilter(item, filter));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Pending offers banner */}
      {incomingOfferCount > 0 && (
        <div
          className="mx-4 mt-4 p-3 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid #7c3aed44" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
          >
            📬
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {incomingOfferCount} pending offer{incomingOfferCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs" style={{ color: "#a0a0c0" }}>Respond before they expire</p>
          </div>
          <button
            onClick={() => setFilter("offers")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid #7c3aed44" }}
          >
            View all
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={
              filter === f.id
                ? { background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }
                : { background: "#12121f", color: "#a0a0c0", border: "1px solid #2a2a3e" }
            }
          >
            {f.label}
            {f.id === "offers" && incomingOfferCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: filter === "offers" ? "rgba(255,255,255,0.25)" : "#7c3aed",
                  color: "#fff",
                }}
              >
                {incomingOfferCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 pb-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-white">No activity yet</p>
            <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
              Activity will appear here as you trade
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isIncomingOffer = item.type === "offer" && item.to !== "";
            if (isIncomingOffer) {
              const state = offerStates[item.id] ?? { status: "pending" };
              return (
                <OfferCard
                  key={item.id}
                  item={item}
                  state={state}
                  ethUsd={ethUsd}
                  onAccept={() => handleAccept(item)}
                  onDecline={() => handleDecline(item.id)}
                />
              );
            }
            return <ActivityRow key={item.id} item={item} ethUsd={ethUsd} />;
          })
        )}
      </div>
    </div>
  );
}
