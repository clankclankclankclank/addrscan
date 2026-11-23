export const ethereumAddress = /^(?:0x)[0-9a-f]{40}$/i;
export const ensName = /^(?=.{5,255}$)(?:[a-z0-9-]+\.)+eth$/i;

export async function getOwnedNfts(owner) {
  if (!ethereumAddress.test(owner) && !ensName.test(owner)) throw new Error('Enter an Ethereum address or .eth name.');
  const key = process.env.ALCHEMY_API_KEY?.trim();
  if (!key) throw new Error('Set ALCHEMY_API_KEY in .env.');

  const query = new URLSearchParams({ owner, pageSize: '5', withMetadata: 'false' });
  let response;
  try {
    response = await fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/${encodeURIComponent(key)}/getNFTsForOwner?${query}`, {
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
  } catch {
    throw new Error('Could not reach Alchemy.');
  }
  if (!response.ok) throw new Error(`Alchemy returned HTTP ${response.status}.`);
  const data = await response.json().catch(() => null);
  if (!Array.isArray(data?.ownedNfts)) throw new Error('Alchemy returned no NFT ownership data.');
  return data;
}
