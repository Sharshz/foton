import { NextRequest } from "next/server";
import { publicConfig } from "@/config/public-config";
import { getShareImageResponse } from "@/neynar-farcaster-sdk/nextjs";

// Cache for 1 hour - query strings create separate cache entries
export const revalidate = 3600;

const { appEnv, heroImageUrl, imageUrl } = publicConfig;
const showDevWarning = appEnv !== "production";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const { searchParams } = request.nextUrl;

  // Dynamic params for personalized share cards
  const nftName = searchParams.get("nft") ?? null;
  const collection = searchParams.get("collection") ?? null;
  const price = searchParams.get("price") ?? null;
  const action = searchParams.get("action") ?? null; // "mint" | "buy" | "bid" | "list"

  return getShareImageResponse(
    { type, heroImageUrl, imageUrl, showDevWarning },
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0f",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Purple glow top-right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -160,
          right: -100,
          width: 560,
          height: 560,
          borderRadius: "50%",
          backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)",
        }}
      />

      {/* Cyan glow bottom-left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -100,
          left: -80,
          width: 440,
          height: 440,
          borderRadius: "50%",
          backgroundImage: "radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Green accent bottom-right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 40,
          right: 60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          backgroundImage: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 52,
        }}
      >
        {/* Top — logo + chain badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Foton logo mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundImage: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              F
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -0.5,
              }}
            >
              Foton
            </div>
          </div>

          {/* Action badge */}
          {action && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(0,212,255,0.12)",
                border: "1.5px solid rgba(0,212,255,0.35)",
                borderRadius: 100,
                padding: "10px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#00d4ff",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {action === "mint" ? "✨ Minted" : action === "buy" ? "⚡ Purchased" : action === "bid" ? "💜 Bid Placed" : action === "list" ? "🏷️ Listed" : action}
              </div>
            </div>
          )}
        </div>

        {/* Middle — NFT info or default tagline */}
        {nftName ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {collection && (
              <div
                style={{
                  display: "flex",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#7c3aed",
                  letterSpacing: 0.5,
                }}
              >
                {collection}
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -2,
                lineHeight: 1.05,
              }}
            >
              {nftName.length > 22 ? nftName.slice(0, 22) + "…" : nftName}
            </div>
            {price && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 40,
                    fontWeight: 900,
                    color: "#00d4ff",
                  }}
                >
                  Ξ {price}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#2a2a3e",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#a0a0c0",
                  }}
                >
                  on Base
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -3,
                lineHeight: 1,
              }}
            >
              Trade NFTs.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                fontWeight: 900,
                backgroundImage: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                backgroundClip: "text",
                color: "transparent",
                letterSpacing: -3,
                lineHeight: 1,
              }}
            >
              Own Base.
            </div>
          </div>
        )}

        {/* Bottom — stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Chain", value: "Base" },
            { label: "Free Mint", value: "Genesis" },
            { label: "Bids", value: "USDC" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: "#ffffff" }}>
                {value}
              </div>
              <div style={{ display: "flex", fontSize: 14, fontWeight: 500, color: "#a0a0c0" }}>
                {label}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              flex: 1,
              height: 1,
              backgroundImage: "linear-gradient(90deg, #2a2a3e, transparent)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(0,255,136,0.08)",
              border: "1px solid rgba(0,255,136,0.25)",
              borderRadius: 100,
              padding: "8px 16px",
            }}
          >
            <div style={{ display: "flex", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#00ff88" }} />
            <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: "#00ff88" }}>
              Live on Base
            </div>
          </div>
        </div>
      </div>
    </div>,
  );
}
