import { NextRequest, NextResponse } from "next/server";
import { privateConfig } from "@/config/private-config";

export interface DeployCollectionRequest {
  name: string;
  symbol: string;
  description: string;
  artPrompt: string;
  mintPattern: "mystery" | "preview";
  priceTier: "free" | "paid";
  priceEth: string;
  maxSupply: string;
}

export interface DeployCollectionResponse {
  success: true;
  slug: string;
  contractAddress: string;
  network: string;
  collectionImageUrl: string;
  transactionHash: string;
}

export interface DeployCollectionError {
  success: false;
  error: string;
}

const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster/nft";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function ethToWei(eth: string): string {
  try {
    const val = parseFloat(eth);
    if (isNaN(val) || val <= 0) return "0";
    // BigInt-safe multiplication: eth * 10^18
    const [whole, frac = ""] = val.toFixed(18).split(".");
    const fracPadded = frac.padEnd(18, "0").slice(0, 18);
    const wei = BigInt(whole) * BigInt("1000000000000000000") + BigInt(fracPadded);
    return wei.toString();
  } catch {
    return "0";
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as DeployCollectionRequest;

    const { name, symbol, description, artPrompt, priceTier, priceEth, maxSupply } = body;

    if (!name?.trim() || !symbol?.trim()) {
      return NextResponse.json<DeployCollectionError>(
        { success: false, error: "name and symbol are required" },
        { status: 400 }
      );
    }

    const apiKey = privateConfig.neynarApiKey;
    const walletId = privateConfig.neynarWalletId;

    if (!apiKey || !walletId) {
      return NextResponse.json<DeployCollectionError>(
        { success: false, error: "Server wallet not configured" },
        { status: 500 }
      );
    }

    // ── Step 1: Generate collection cover image ───────────────────────────
    const imagePrompt =
      artPrompt?.trim() ||
      `Abstract digital art for an NFT collection called ${name}, dark background, neon accent colors`;

    const imageRes = await fetch(`${NEYNAR_BASE}/image`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "x-wallet-id": walletId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: imagePrompt }),
    });

    if (!imageRes.ok) {
      const errText = await imageRes.text();
      return NextResponse.json<DeployCollectionError>(
        { success: false, error: `Image generation failed: ${errText}` },
        { status: 502 }
      );
    }

    const imageData = (await imageRes.json()) as { image_url: string };
    const collectionImageUrl = imageData.image_url;

    // ── Step 2: Deploy ERC-721 contract ───────────────────────────────────
    const pricePerTokenWei =
      priceTier === "paid" ? ethToWei(priceEth || "0.001") : "0";
    const maxSupplyNum = parseInt(maxSupply || "0", 10) || 0;

    const deployRes = await fetch(`${NEYNAR_BASE}/deploy/erc721`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "x-wallet-id": walletId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: "base",
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: description?.trim() || "",
        image: collectionImageUrl,
        max_supply: maxSupplyNum,
        royalty_bps: 0,
        mint_config: {
          price_per_token: pricePerTokenWei,
          max_per_wallet: 0,
          max_per_tx: 0,
        },
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      let errorMsg = `Contract deploy failed (${deployRes.status})`;
      try {
        const errJson = JSON.parse(errText) as { message?: string; error?: string };
        errorMsg = errJson.message || errJson.error || errText;
      } catch {
        errorMsg = errText || errorMsg;
      }

      if (deployRes.status === 400 && errorMsg.toLowerCase().includes("insufficient")) {
        errorMsg =
          "InsufficientFunds — the server wallet needs ETH on Base for gas fees. Please fund the wallet and try again.";
      }

      return NextResponse.json<DeployCollectionError>(
        { success: false, error: errorMsg },
        { status: deployRes.status }
      );
    }

    const deployData = (await deployRes.json()) as {
      collection: {
        address: string;
        network: string;
        transaction_hash: string;
      };
    };

    const contractAddress = deployData.collection.address;
    const transactionHash = deployData.collection.transaction_hash;
    const network = deployData.collection.network;
    const slug = toSlug(name);

    return NextResponse.json<DeployCollectionResponse>({
      success: true,
      slug,
      contractAddress,
      network,
      collectionImageUrl,
      transactionHash,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<DeployCollectionError>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
