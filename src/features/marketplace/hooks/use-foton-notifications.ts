"use client";

import { useCallback } from "react";
import { usePublishFrameNotifications } from "@/neynar-web-sdk/neynar";
import { publicConfig } from "@/config/public-config";

/**
 * Foton marketplace notifications — send real Farcaster push notifications
 * to users when relevant marketplace events occur.
 */
export function useFotonNotifications() {
  const { mutate: publish } = usePublishFrameNotifications();

  /**
   * Notify a seller that someone placed a USDC bid on their NFT.
   * @param sellerFid - FID of the NFT owner to notify
   * @param bidderName - username of the bidder
   * @param nftName - name of the NFT being bid on
   * @param bidAmountUsdc - bid amount in USDC (e.g. "250")
   */
  const notifyBidReceived = useCallback((
    sellerFid: number,
    bidderName: string,
    nftName: string,
    bidAmountUsdc: string,
  ) => {
    publish({
      frame_url: publicConfig.homeUrl,
      title: "💜 New Bid on Your NFT!",
      message: `@${bidderName} bid $${bidAmountUsdc} USDC on your ${nftName}. Open Foton to accept or counter.`,
      target_fids: [sellerFid],
    });
  }, [publish]);

  /**
   * Notify a bidder that their bid was accepted.
   * @param buyerFid - FID of the winning bidder
   * @param nftName - name of the NFT
   * @param finalPrice - final sale price in ETH or USDC
   */
  const notifyBidAccepted = useCallback((
    buyerFid: number,
    nftName: string,
    finalPrice: string,
  ) => {
    publish({
      frame_url: publicConfig.homeUrl,
      title: "🎉 Bid Accepted!",
      message: `Your bid on ${nftName} was accepted for ${finalPrice}. The NFT is now in your wallet!`,
      target_fids: [buyerFid],
    });
  }, [publish]);

  /**
   * Notify a seller that their NFT was purchased.
   * @param sellerFid - FID of the seller
   * @param nftName - name of the sold NFT
   * @param priceEth - sale price in ETH
   */
  const notifySale = useCallback((
    sellerFid: number,
    nftName: string,
    priceEth: string,
  ) => {
    publish({
      frame_url: publicConfig.homeUrl,
      title: "⚡ Your NFT Sold!",
      message: `${nftName} sold for Ξ ${priceEth} on Foton. Funds are on their way to your wallet.`,
      target_fids: [sellerFid],
    });
  }, [publish]);

  /**
   * Notify a user that their bid expired without acceptance.
   * @param bidderFid - FID of the bidder
   * @param nftName - name of the NFT
   * @param refundUsdc - amount being refunded
   */
  const notifyBidExpired = useCallback((
    bidderFid: number,
    nftName: string,
    refundUsdc: string,
  ) => {
    publish({
      frame_url: publicConfig.homeUrl,
      title: "⏰ Bid Expired",
      message: `Your $${refundUsdc} USDC bid on ${nftName} expired. Funds returned to your wallet.`,
      target_fids: [bidderFid],
    });
  }, [publish]);

  /**
   * Notify a user that a collection they follow listed a new NFT.
   * @param followerFids - array of FIDs to notify
   * @param collectionName - name of the collection
   * @param nftName - name of the new listing
   * @param priceEth - listing price
   */
  const notifyNewListing = useCallback((
    followerFids: number[],
    collectionName: string,
    nftName: string,
    priceEth: string,
  ) => {
    if (followerFids.length === 0) return;
    publish({
      frame_url: publicConfig.homeUrl,
      title: `🏷️ New Listing in ${collectionName}`,
      message: `${nftName} just listed for Ξ ${priceEth}. Tap to buy or bid on Foton.`,
      target_fids: followerFids,
    });
  }, [publish]);

  /**
   * Notify all subscribers about a new genesis mint opportunity.
   * @param collectionName - name of the new collection
   * @param supply - total supply
   */
  const broadcastNewCollection = useCallback((
    collectionName: string,
    supply: string,
  ) => {
    publish({
      frame_url: publicConfig.homeUrl,
      title: "✨ New Collection on Foton!",
      message: `${collectionName} just launched with ${supply} supply. Mint now on Foton — Trade NFTs. Own Base. ⚡`,
      // No target_fids = broadcasts to all subscribers
    });
  }, [publish]);

  return {
    notifyBidReceived,
    notifyBidAccepted,
    notifySale,
    notifyBidExpired,
    notifyNewListing,
    broadcastNewCollection,
  };
}
