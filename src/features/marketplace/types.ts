export type NFTCategory = "art" | "collectibles" | "gaming" | "music" | "photography" | "all";

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export type NFTRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  collectionSlug: string;
  price: string; // ETH amount as string
  priceUsd: number;
  owner: string;
  creator: string;
  category: NFTCategory;
  attributes: NFTAttribute[];
  likes: number;
  isLiked: boolean;
  listedAt: Date;
  chain: "base";
  rarity?: NFTRarity;
  isListed?: boolean;
  listingPrice?: string;
}

export interface PricePoint {
  date: string; // "MMM DD"
  floor: number; // ETH
  volume: number; // ETH
}

export interface NFTCollection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  banner: string;
  floorPrice: string;
  volumeETH: string;
  items: number;
  owners: number;
  verified: boolean;
  category: NFTCategory;
  priceHistory: PricePoint[];
}

export type MarketTab = "explore" | "collections" | "genesis" | "mint" | "activity" | "profile" | "admin";

export interface ActivityItem {
  id: string;
  type: "sale" | "listing" | "offer" | "accepted" | "transfer";
  nftName: string;
  nftImage: string;
  collection: string;
  price: string;
  from: string;
  to: string;
  timestamp: Date;
  offerExpiryDays?: number; // for incoming offers
}

export interface FilterState {
  category: NFTCategory;
  sortBy: "recent" | "price_asc" | "price_desc" | "most_liked";
  priceMin: string;
  priceMax: string;
}

export interface ListingDraft {
  nft: NFTItem;
  priceEth: string;
  priceUsd: number;
  durationDays: number;
  listedAt: Date;
}

export interface OfferDraft {
  nft: NFTItem;
  offerEth: string;
  offerUsd: number;
  expiryDays: number;
  placedAt: Date;
}
