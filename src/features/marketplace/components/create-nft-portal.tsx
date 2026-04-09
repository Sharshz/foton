"use client";

import { useState, useCallback } from "react";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";
import type {
  DeployCollectionResponse,
  DeployCollectionError,
} from "@/app/api/nft/deploy-collection/route";

type CreateStep = "basics" | "art" | "settings" | "review" | "deploying" | "done";

type ArtStyle = {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
};

type MintPattern = "mystery" | "preview";
type PriceTier = "free" | "paid";

interface CollectionDraft {
  name: string;
  symbol: string;
  description: string;
  artStyle: ArtStyle | null;
  customPrompt: string;
  mintPattern: MintPattern;
  priceTier: PriceTier;
  priceEth: string;
  maxSupply: string;
}

const ART_STYLES: ArtStyle[] = [
  {
    id: "cyber",
    label: "Cyberpunk",
    emoji: "🤖",
    prompt: "futuristic cyberpunk portrait, neon accents, dark background, glowing eyes",
  },
  {
    id: "cosmic",
    label: "Cosmic",
    emoji: "🌌",
    prompt: "ethereal cosmic entity floating in deep space, nebula colors, neon glow",
  },
  {
    id: "pixel",
    label: "Pixel Art",
    emoji: "👾",
    prompt: "pixel art character, 16-bit retro style, vibrant colors, game sprite",
  },
  {
    id: "abstract",
    label: "Abstract",
    emoji: "💠",
    prompt: "abstract geometric art, neon gradients, dark void background, minimal",
  },
  {
    id: "creature",
    label: "Creatures",
    emoji: "🐉",
    prompt: "fantasy creature portrait, detailed illustration, mythical being, dramatic lighting",
  },
  {
    id: "custom",
    label: "Custom",
    emoji: "✏️",
    prompt: "",
  },
];

const DEPLOY_STAGES = [
  { label: "Generating collection art",     sublabel: "AI creating your cover image"         },
  { label: "Deploying ERC-721 contract",    sublabel: "Sending tx to Base mainnet"            },
  { label: "Configuring mint settings",     sublabel: "Setting price, supply & wallet limits" },
  { label: "Verifying on-chain",            sublabel: "Awaiting block confirmation"            },
];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current ? "#00d4ff" : i < current ? "#7c3aed" : "#2a2a3e",
          }}
        />
      ))}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
          {label}
        </label>
        {maxLength && (
          <span className="text-xs" style={{ color: value.length > maxLength * 0.9 ? "#ff5050" : "#a0a0c0" }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${mono ? "font-mono" : ""}`}
        style={{
          background: "#0a0a0f",
          border: `1px solid ${value ? "#00d4ff33" : "#2a2a3e"}`,
          color: "#ffffff",
          caretColor: "#00d4ff",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#00d4ff55")}
        onBlur={(e) => (e.currentTarget.style.borderColor = value ? "#00d4ff33" : "#2a2a3e")}
      />
      {hint && <p className="text-xs mt-1 pl-1" style={{ color: "#a0a0c0" }}>{hint}</p>}
    </div>
  );
}

export function CreateNFTPortal({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<CreateStep>("basics");
  const [stageIdx, setStageIdx] = useState(0);
  const [deployResult, setDeployResult] = useState<DeployCollectionResponse | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CollectionDraft>({
    name: "",
    symbol: "",
    description: "",
    artStyle: null,
    customPrompt: "",
    mintPattern: "mystery",
    priceTier: "free",
    priceEth: "0.001",
    maxSupply: "0",
  });

  const update = (patch: Partial<CollectionDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const canAdvanceBasics =
    draft.name.trim().length >= 2 &&
    draft.symbol.trim().length >= 2 &&
    draft.description.trim().length >= 5;

  const canAdvanceArt =
    draft.artStyle !== null &&
    (draft.artStyle.id !== "custom" || draft.customPrompt.trim().length >= 10);

  const runDeploy = useCallback(async () => {
    setStep("deploying");
    setDeployError(null);

    // Stage 0: generating art (longest — waits for API)
    setStageIdx(0);

    const artPrompt =
      draft.artStyle?.id === "custom"
        ? draft.customPrompt
        : draft.artStyle?.prompt ?? "";

    try {
      const res = await fetch("/api/nft/deploy-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          symbol: draft.symbol,
          description: draft.description,
          artPrompt,
          mintPattern: draft.mintPattern,
          priceTier: draft.priceTier,
          priceEth: draft.priceEth,
          maxSupply: draft.maxSupply,
        }),
      });

      // Stage 1: deploying contract (show while waiting for response)
      setStageIdx(1);
      await new Promise((r) => setTimeout(r, 600));

      const data = (await res.json()) as DeployCollectionResponse | DeployCollectionError;

      if (!data.success) {
        setDeployError((data as DeployCollectionError).error);
        setStep("review");
        return;
      }

      const result = data as DeployCollectionResponse;
      setDeployResult(result);

      // Stages 2 & 3: configure + verify (cosmetic progression)
      setStageIdx(2);
      await new Promise((r) => setTimeout(r, 900));
      setStageIdx(3);
      await new Promise((r) => setTimeout(r, 800));

      setStep("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error — please try again";
      setDeployError(msg);
      setStep("review");
    }
  }, [draft]);

  const STEP_ORDER: CreateStep[] = ["basics", "art", "settings", "review"];
  const stepIndex = STEP_ORDER.indexOf(step as CreateStep);

  // --- DONE ---
  if (step === "done") {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-center text-center p-6 pt-8">
          {/* Collection image */}
          {deployResult?.collectionImageUrl ? (
            <div
              className="w-28 h-28 rounded-2xl overflow-hidden mb-5"
              style={{ border: "2px solid #00ff88", boxShadow: "0 0 30px rgba(0,255,136,0.15)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deployResult.collectionImageUrl}
                alt={draft.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-5"
              style={{
                background: "linear-gradient(135deg, #00ff8822, #00d4ff22)",
                border: "2px solid #00ff88",
                boxShadow: "0 0 40px rgba(0,255,136,0.15)",
              }}
            >
              🚀
            </div>
          )}

          <h2 className="text-2xl font-black text-white mb-2">Collection Live!</h2>
          <p className="text-sm mb-5" style={{ color: "#a0a0c0" }}>
            <span className="text-white font-semibold">{draft.name}</span> is now
            deployed on Base mainnet and ready to mint
          </p>

          {/* Collection summary card */}
          <div
            className="w-full rounded-2xl p-4 mb-3 text-left space-y-3"
            style={{ background: "#0a0a0f", border: "1px solid #00ff8833" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
              COLLECTION DETAILS
            </p>
            {[
              { label: "Name",    value: draft.name },
              { label: "Symbol",  value: draft.symbol.toUpperCase() },
              { label: "Chain",   value: "Base Mainnet" },
              { label: "Supply",  value: draft.maxSupply === "0" ? "Unlimited" : draft.maxSupply },
              { label: "Price",   value: draft.priceTier === "free" ? "Free" : `Ξ ${draft.priceEth}` },
              { label: "Pattern", value: draft.mintPattern === "mystery" ? "Mystery Mint" : "Preview First" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm" style={{ color: "#a0a0c0" }}>{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>

          {/* Contract address */}
          {deployResult?.contractAddress && (
            <div
              className="w-full rounded-xl p-3 mb-4 text-left"
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#a0a0c0" }}>CONTRACT</p>
              <p className="text-xs font-mono break-all" style={{ color: "#7c3aed" }}>
                {deployResult.contractAddress}
              </p>
              {deployResult.transactionHash && (
                <p className="text-xs font-mono mt-1 truncate" style={{ color: "#a0a0c0" }}>
                  tx: {deployResult.transactionHash}
                </p>
              )}
            </div>
          )}

          {/* Share to Farcaster */}
          <ShareButton
            text={`Just deployed my own NFT collection "${draft.name}" (${draft.symbol.toUpperCase()}) on Base via Foton! ${draft.priceTier === "free" ? "Free mint 🎁" : `Ξ ${draft.priceEth} per token`} — ${draft.maxSupply === "0" ? "unlimited supply" : `${draft.maxSupply} supply`}. Trade NFTs. Own Base. ⚡`}
            className="w-full py-3.5 rounded-xl font-bold text-sm mb-1"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.2))", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}
          >
            Share Collection on Farcaster 🟣
          </ShareButton>

          <div className="flex gap-3 w-full">
            <button
              onClick={onBack}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: "#1a1a2e", color: "#a0a0c0" }}
            >
              Back to Mint
            </button>
            <button
              onClick={() => {
                setStep("basics");
                setDeployResult(null);
                setDeployError(null);
                setDraft({
                  name: "", symbol: "", description: "",
                  artStyle: null, customPrompt: "",
                  mintPattern: "mystery", priceTier: "free",
                  priceEth: "0.001", maxSupply: "0",
                });
              }}
              className="flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
                color: "#00d4ff",
                border: "1px solid #00d4ff44",
              }}
            >
              Create Another ✦
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DEPLOYING ---
  if (step === "deploying") {
    return (
      <div className="flex-1 min-h-0 flex flex-col p-5 pt-8 overflow-y-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
            style={{
              background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
              border: "1px solid #00d4ff44",
            }}
          >
            ⚡
          </div>
          <h2 className="text-xl font-black text-white">Deploying to Base</h2>
          <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>
            Creating <span className="text-white">{draft.name}</span>...
          </p>
        </div>

        <div className="space-y-4">
          {DEPLOY_STAGES.map((stage, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-500"
                style={{
                  background: i < stageIdx
                    ? "rgba(0,255,136,0.15)"
                    : i === stageIdx
                    ? "rgba(0,212,255,0.15)"
                    : "#12121f",
                  border: i < stageIdx
                    ? "1.5px solid #00ff88"
                    : i === stageIdx
                    ? "1.5px solid #00d4ff"
                    : "1.5px solid #2a2a3e",
                }}
              >
                {i < stageIdx ? (
                  <span style={{ color: "#00ff88", fontSize: 13 }}>✓</span>
                ) : i === stageIdx ? (
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#00d4ff44", borderTopColor: "#00d4ff" }}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ background: "#2a2a3e" }} />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: i < stageIdx ? "#00ff88" : i === stageIdx ? "#ffffff" : "#a0a0c0",
                  }}
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

        <div
          className="mt-8 py-3 text-center rounded-xl text-sm"
          style={{ background: "#0a0a0f", border: "1px solid #2a2a3e", color: "#a0a0c0" }}
        >
          Do not close this screen
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid #2a2a3e" }}
      >
        <button
          onClick={() => {
            if (step === "basics") onBack();
            else if (step === "art") setStep("basics");
            else if (step === "settings") setStep("art");
            else if (step === "review") setStep("settings");
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "#1a1a2e", color: "#a0a0c0" }}
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-white">Create NFT Collection</h2>
          <p className="text-xs" style={{ color: "#a0a0c0" }}>
            {step === "basics" && "Name your collection"}
            {step === "art" && "Choose an art style"}
            {step === "settings" && "Configure mint settings"}
            {step === "review" && "Review & deploy"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="shrink-0 px-4 py-2.5">
        <StepDots current={stepIndex} total={4} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* BASICS */}
        {step === "basics" && (
          <>
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(0,212,255,0.05)", border: "1px solid #00d4ff22" }}
            >
              <span className="text-2xl">🎨</span>
              <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                Deploy your own ERC-721 collection on Base. Each mint generates a
                unique AI image on-chain.
              </p>
            </div>
            <InputField
              label="COLLECTION NAME"
              value={draft.name}
              onChange={(v) => update({ name: v })}
              placeholder="e.g. Cosmic Cats"
              maxLength={32}
            />
            <InputField
              label="SYMBOL"
              value={draft.symbol}
              onChange={(v) => update({ symbol: v.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
              placeholder="e.g. CCAT"
              maxLength={8}
              hint="Short ticker shown on-chain (letters & numbers only)"
              mono
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
                  DESCRIPTION
                </label>
                <span className="text-xs" style={{ color: draft.description.length > 140 ? "#ff5050" : "#a0a0c0" }}>
                  {draft.description.length}/160
                </span>
              </div>
              <textarea
                value={draft.description}
                onChange={(e) => update({ description: e.target.value.slice(0, 160) })}
                placeholder="What is this collection about?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{
                  background: "#0a0a0f",
                  border: `1px solid ${draft.description ? "#00d4ff33" : "#2a2a3e"}`,
                  color: "#ffffff",
                  caretColor: "#00d4ff",
                }}
              />
            </div>
          </>
        )}

        {/* ART STYLE */}
        {step === "art" && (
          <>
            <p className="text-xs" style={{ color: "#a0a0c0" }}>
              Every token gets a unique AI-generated image using this style.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {ART_STYLES.map((style) => {
                const selected = draft.artStyle?.id === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => update({ artStyle: style })}
                    className="p-4 rounded-2xl text-left transition-all active:scale-95"
                    style={{
                      background: selected ? "rgba(0,212,255,0.08)" : "#12121f",
                      border: selected ? "1.5px solid #00d4ff66" : "1px solid #2a2a3e",
                    }}
                  >
                    <div className="text-2xl mb-2">{style.emoji}</div>
                    <p className="text-sm font-bold text-white">{style.label}</p>
                    {style.id !== "custom" && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#a0a0c0" }}>
                        {style.prompt}
                      </p>
                    )}
                    {style.id === "custom" && (
                      <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>
                        Write your own prompt
                      </p>
                    )}
                    {selected && (
                      <div
                        className="mt-2 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                        style={{ background: "#00d4ff", color: "#0a0a0f" }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {draft.artStyle?.id === "custom" && (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#a0a0c0" }}>
                  YOUR IMAGE PROMPT
                </label>
                <textarea
                  value={draft.customPrompt}
                  onChange={(e) => update({ customPrompt: e.target.value })}
                  placeholder="e.g. watercolor portrait of a fox with glowing eyes, forest background, soft colors..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: "#0a0a0f",
                    border: "1px solid #00d4ff33",
                    color: "#ffffff",
                    caretColor: "#00d4ff",
                  }}
                />
                <p className="text-xs mt-1 pl-1" style={{ color: "#a0a0c0" }}>
                  Tip: include art style, subject, colors, and composition. No text in images.
                </p>
              </div>
            )}
          </>
        )}

        {/* SETTINGS */}
        {step === "settings" && (
          <>
            {/* Mint pattern */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#a0a0c0" }}>
                MINT PATTERN
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { id: "mystery" as MintPattern, label: "Mystery Mint", emoji: "🎲", desc: "Reveal after mint" },
                  { id: "preview" as MintPattern,  label: "Preview First", emoji: "👁",  desc: "See before minting" },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => update({ mintPattern: opt.id })}
                    className="p-3.5 rounded-xl text-left transition-all active:scale-95"
                    style={{
                      background: draft.mintPattern === opt.id ? "rgba(0,212,255,0.08)" : "#12121f",
                      border: draft.mintPattern === opt.id ? "1.5px solid #00d4ff55" : "1px solid #2a2a3e",
                    }}
                  >
                    <span className="text-xl block mb-1">{opt.emoji}</span>
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#a0a0c0" }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#a0a0c0" }}>
                MINT PRICE
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {([
                  { id: "free" as PriceTier, label: "Free Mint", emoji: "🎁" },
                  { id: "paid" as PriceTier, label: "Paid Mint", emoji: "💰" },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => update({ priceTier: opt.id })}
                    className="p-3.5 rounded-xl text-left transition-all active:scale-95"
                    style={{
                      background: draft.priceTier === opt.id ? "rgba(0,212,255,0.08)" : "#12121f",
                      border: draft.priceTier === opt.id ? "1.5px solid #00d4ff55" : "1px solid #2a2a3e",
                    }}
                  >
                    <span className="text-xl block mb-1">{opt.emoji}</span>
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                  </button>
                ))}
              </div>
              {draft.priceTier === "paid" && (
                <InputField
                  label="PRICE PER MINT (ETH)"
                  value={draft.priceEth}
                  onChange={(v) => update({ priceEth: v })}
                  placeholder="0.001"
                  mono
                />
              )}
            </div>

            {/* Max supply */}
            <InputField
              label="MAX SUPPLY"
              value={draft.maxSupply}
              onChange={(v) => update({ maxSupply: v.replace(/[^0-9]/g, "") })}
              placeholder="0"
              hint="Enter 0 for unlimited supply"
              mono
            />
          </>
        )}

        {/* REVIEW */}
        {step === "review" && (
          <>
            {/* Deploy error */}
            {deployError && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,80,80,0.3)" }}
              >
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#ff5050" }}>
                    Deployment Failed
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#fca5a5" }}>
                    {deployError}
                  </p>
                </div>
              </div>
            )}

            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #2a2a3e" }}
            >
              {/* Art style preview placeholder */}
              <div
                className="aspect-video flex flex-col items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #0f0f1a, #1a1a2e)",
                }}
              >
                <span className="text-5xl">{draft.artStyle?.emoji ?? "🎨"}</span>
                <p className="text-sm font-semibold text-white">{draft.artStyle?.label} Style</p>
                <p className="text-xs" style={{ color: "#a0a0c0" }}>
                  Image generated at mint time
                </p>
              </div>
              <div className="p-4" style={{ background: "#0a0a0f" }}>
                <p className="text-base font-black text-white">{draft.name}</p>
                <p className="text-sm mt-0.5" style={{ color: "#7c3aed" }}>
                  ${draft.symbol.toUpperCase()} · Base Mainnet
                </p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#a0a0c0" }}>
                  {draft.description}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "#0a0a0f", border: "1px solid #2a2a3e" }}
            >
              <p className="text-xs font-semibold" style={{ color: "#a0a0c0" }}>
                DEPLOYMENT SUMMARY
              </p>
              {[
                { label: "Contract type", value: "ERC-721" },
                { label: "Network", value: "Base Mainnet" },
                { label: "Mint pattern", value: draft.mintPattern === "mystery" ? "Mystery" : "Preview-first" },
                { label: "Price", value: draft.priceTier === "free" ? "Free" : `Ξ ${draft.priceEth}` },
                { label: "Max supply", value: draft.maxSupply === "0" ? "Unlimited" : draft.maxSupply },
                { label: "Royalties", value: "0%" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#a0a0c0" }}>{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>

            <div
              className="flex items-start gap-2 p-3 rounded-xl"
              style={{ background: "rgba(0,212,255,0.05)", border: "1px solid #00d4ff22" }}
            >
              <span className="text-sm shrink-0 mt-0.5">ℹ️</span>
              <p className="text-xs leading-relaxed" style={{ color: "#a0a0c0" }}>
                Deploying requires a small amount of ETH on Base for gas fees. The
                app&apos;s server wallet covers this automatically.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid #2a2a3e" }}
      >
        {step === "basics" && (
          <button
            onClick={() => setStep("art")}
            disabled={!canAdvanceBasics}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
            style={
              canAdvanceBasics
                ? { background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }
                : { background: "#1a1a2e", color: "#a0a0c0", cursor: "not-allowed" }
            }
          >
            Choose Art Style →
          </button>
        )}
        {step === "art" && (
          <button
            onClick={() => setStep("settings")}
            disabled={!canAdvanceArt}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
            style={
              canAdvanceArt
                ? { background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }
                : { background: "#1a1a2e", color: "#a0a0c0", cursor: "not-allowed" }
            }
          >
            Set Mint Settings →
          </button>
        )}
        {step === "settings" && (
          <button
            onClick={() => setStep("review")}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98"
            style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#ffffff" }}
          >
            Review Collection →
          </button>
        )}
        {step === "review" && (
          <button
            onClick={runDeploy}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-98 flex items-center justify-center gap-2"
            style={{
              background: deployError
                ? "linear-gradient(135deg, #ff5050, #ff8800)"
                : "linear-gradient(135deg, #00ff88, #00d4ff)",
              color: "#0a0a0f",
            }}
          >
            {deployError ? "🔄 Retry Deploy" : "🚀 Deploy to Base"}
          </button>
        )}
      </div>
    </div>
  );
}
