import { createNftMintHandler } from '@/neynar-web-sdk/nextjs';
import { privateConfig } from '@/config/private-config';
import { getCollection } from '@/config/nft-config';
import { isPaymentTxUsed, markPaymentTxUsed } from '@/db/nft-payments';

export const { POST } = createNftMintHandler({
  config: ({ collectionSlug }) => {
    const c = getCollection(collectionSlug);
    return {
      apiKey: privateConfig.neynarApiKey,
      walletId: privateConfig.neynarWalletId,
      network: c.network,
      contractAddress: c.contractAddress,
    };
  },
  imagePrompt: ({ collectionSlug, tokenId }) => {
    const c = getCollection(collectionSlug);
    return `${c.tokenImagePrompt}, token #${tokenId}`;
  },
  metadata: (tokenId, imageUrl, { collectionSlug }) => {
    const c = getCollection(collectionSlug);
    return {
      name: `${c.tokenNamePrefix} #${tokenId}`,
      description: c.description,
      image: imageUrl,
    };
  },
  paymentVerification: {
    rpcUrl: { base: privateConfig.baseRpcUrl },
    serverWalletAddress: privateConfig.neynarWalletAddress,
    expectedCost: async (ctx) => {
      const c = getCollection(ctx.collectionSlug);
      if (c.pricingTier === 'free') return null;
      return null;
    },
    txHashStore: {
      isUsed: (txHash) => isPaymentTxUsed(txHash),
      markUsed: (txHash, ctx) =>
        markPaymentTxUsed(txHash, ctx.fid, ctx.collectionSlug),
    },
  },
});
