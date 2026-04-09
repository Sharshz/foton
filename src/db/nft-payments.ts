// Stub — replaced by add-nft-price-route with full DB implementation if needed
export async function isPaymentTxUsed(_txHash: string): Promise<boolean> {
  return false;
}

export async function markPaymentTxUsed(
  _txHash: string,
  _fid: number,
  _collectionSlug: string,
): Promise<void> {}
