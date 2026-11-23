import { getOwnedNfts } from './alchemy.js';

try {
  console.log(JSON.stringify(await getOwnedNfts(process.argv[2] ?? 'vitalik.eth'), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
