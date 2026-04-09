export const NFT_COLLECTIONS = {
  'foton-genesis': {
    contractAddress: '0xec63f0d5d0a3518b8f66534b5f8b1eaa668f6114',
    network: 'base' as const,
    name: 'Foton Genesis',
    description: 'The genesis collection of Foton — the Base-native NFT marketplace. Free mint for early users, pay gas only. 2000 unique pieces.',
    tokenNamePrefix: 'Foton Genesis',
    tokenImagePrompt: 'A photon particle portrait with light wave energy trails, dark cosmic background, neon cyan and electric purple glow, futuristic digital art, square 1:1 composition, no text, unique light patterns and energy fields for each piece',
    pricingTier: 'free' as const,
    maxSupply: 2000,
    collectionImageUrl: 'https://cdn.neynar.com/nft/generated/5ca6abcb-0ae3-443d-8fae-6d7c0ecc23a3/1775741269036-a9ffe328-f517-4cb4-8108-223811106d1d.png',
    transactionHash: '0x3348fdf58dff41e216ac9b8ab4c4847338bc98bb2a08e400ba81f7d8500fb07b',
  },
  'basemarket-genesis': {
    contractAddress: '0xe2e80e6fbc821052a5ba8a308eb5db9ffd07d084',
    network: 'base' as const,
    name: 'BaseMarket Genesis',
    description: '1-of-1 cyber beings from the BaseMarket genesis drop.',
    tokenNamePrefix: 'BaseMarket Genesis',
    tokenImagePrompt: 'A dark futuristic robot portrait, neon accent lighting in cyan and purple, cyberpunk aesthetic, deep dark background with subtle grid lines, glowing eyes, dramatic lighting, highly detailed digital art, square 1:1 composition, no text or labels on the image, unique mechanical features and armor plating for each individual',
    pricingTier: 'free' as const,
  },
} as const;

export function getCollection(slug: string) {
  const collection = NFT_COLLECTIONS[slug as keyof typeof NFT_COLLECTIONS];
  if (!collection) throw new Error(`Unknown collection: ${slug}`);
  return collection;
}
