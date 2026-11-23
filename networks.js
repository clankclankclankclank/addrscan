import { ethereumAddress } from './alchemy.js';

const evm = (name, id, unit, proto, block, explorer) => ({
  name, id, unit, proto, block, explorer, address: ethereumAddress,
});
const base58 = '[1-9A-HJ-NP-Za-km-z]';

export const networks = new Map(Object.entries({
  ethereum: evm('Ethereum', '1', 'ETH', 'eth', 'eth', 'https://etherscan.io/address/'),
  base: evm('Base', '8453', 'ETH', null, null, 'https://basescan.org/address/'),
  arbitrum: evm('Arbitrum One', '42161', 'ETH', null, null, 'https://arbiscan.io/address/'),
  optimism: evm('Optimism', '10', 'ETH', null, null, 'https://optimistic.etherscan.io/address/'),
  polygon: evm('Polygon', '137', 'POL', 'matic', null, 'https://polygonscan.com/address/'),
  bnb: evm('BNB Smart Chain', '56', 'BNB', 'bnb', null, 'https://bscscan.com/address/'),
  avalanche: evm('Avalanche C-Chain', '43114', 'AVAX', 'avax', null, 'https://snowtrace.io/address/'),
  bitcoin: { name: 'Bitcoin', unit: 'BTC', proto: 'btc', block: 'btc', address: new RegExp(`^(?:[13]${base58}{25,34}|bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})$`) },
  solana: { name: 'Solana', proto: 'sol', address: new RegExp(`^${base58}{32,44}$`) },
  xrp: { name: 'XRP Ledger', proto: 'xrp', address: new RegExp(`^r${base58}{24,34}$`) },
  tron: { name: 'Tron', proto: 'trx', id: 'tron', address: new RegExp(`^T${base58}{33}$`) },
  litecoin: { name: 'Litecoin', unit: 'LTC', proto: 'ltc', block: 'ltc', address: new RegExp(`^(?:[LM3]${base58}{25,34}|ltc1[ac-hj-np-z02-9]{11,71}|LTC1[AC-HJ-NP-Z02-9]{11,71})$`) },
  dogecoin: { name: 'Dogecoin', unit: 'DOGE', proto: 'doge', block: 'doge', address: new RegExp(`^[DA9]${base58}{25,34}$`) },
  dash: { name: 'Dash', unit: 'DASH', proto: 'dash', block: 'dash', address: new RegExp(`^[X7]${base58}{25,34}$`) },
}));
