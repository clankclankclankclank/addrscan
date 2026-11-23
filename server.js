import { networks } from './networks.js';
import { getOwnedNfts } from './alchemy.js';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const example = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const flags = {
  phishing_activities: 'Phishing',
  honeypot_related_address: 'Honeypot association',
  stealing_attack: 'Theft',
  blackmail_activities: 'Blackmail',
  fake_kyc: 'Fake KYC',
  malicious_mining_activities: 'Malicious mining',
  darkweb_transactions: 'Dark web transactions',
  cybercrime: 'Cybercrime',
  money_laundering: 'Money laundering',
  financial_crime: 'Financial crime',
  blacklist_doubt: 'Suspected malicious address',
  mixer: 'Coin mixer',
  sanctioned: 'Sanctioned address',
  gas_abuse: 'Gas abuse',
  reinit: 'Contract can be redeployed',
  fake_standard_interface: 'Fake standard interface',
  fake_token: 'Counterfeit token',
};

async function getJson(url, headers) {
  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(10000), redirect: 'error' });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError' ? 'Request timed out.' : 'Could not reach the provider.');
  }
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  try {
    return JSON.parse(await response.text(), (key, value, context) =>
      key === 'final_balance' && typeof value === 'number' ? context.source : value);
  } catch {
    throw new Error('Provider returned an invalid response.');
  }
}

async function getSecurity(address, network) {
  const token = process.env.GOPLUS_ACCESS_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const data = await getJson(`https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=${network.id}`, headers);
  if (String(data?.code) !== '1' || !data.result || typeof data.result !== 'object' || Array.isArray(data.result)) {
    throw new Error('GoPlus did not return address security data.');
  }
  const result = data.result;
  const signals = Object.entries(flags).map(([key, label]) => ({
    label,
    status: result[key] === '1' || result[key] === 1 ? 'Flagged'
      : result[key] === '0' || result[key] === 0 ? 'Clear' : 'Unknown',
  }));
  const maliciousContracts = result.number_of_malicious_contracts_created;
  if (/^\d+$/.test(String(maliciousContracts))) {
    signals.push({
      label: `Malicious contracts created (${maliciousContracts})`,
      status: BigInt(maliciousContracts) > 0n ? 'Flagged' : 'Clear',
    });
  }
  return { signals };
}

async function getBalance(address, network) {
  const apikey = process.env.ETHERSCAN_API_KEY?.trim();
  if (!apikey) throw new Error('Set ETHERSCAN_API_KEY in .env and restart.');
  const params = new URLSearchParams({ chainid: network.id, module: 'account', action: 'balance', address, tag: 'latest', apikey });
  const data = await getJson(`https://api.etherscan.io/v2/api?${params}`);
  if (String(data?.status) !== '1' || typeof data.result !== 'string' || !/^\d+$/.test(data.result)) {
    const reason = typeof data?.result === 'string' ? data.result : '';
    if (/api key/i.test(reason)) throw new Error('Etherscan rejected the API key.');
    if (/rate limit/i.test(reason)) throw new Error('Etherscan rate limit reached.');
    throw new Error('Etherscan did not return a balance.');
  }
  return formatBalance(data.result, 18, network.unit);
}

function formatBalance(raw, decimals, unit) {
  const atomic = BigInt(raw).toString();
  const digits = atomic.padStart(decimals + 1, '0');
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  const amount = digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
  return { atomic, amount, decimals, unit };
}

function requiredKey(name) {
  const key = process.env[name]?.trim();
  if (!key) throw new Error(`Set ${name} in .env.`);
  return key;
}

async function getChainRisk(address, network) {
  const apikey = requiredKey('ANCHAIN_API_KEY');
  const params = new URLSearchParams({ proto: network.proto, address });
  const data = await getJson(`https://api.anchainai.com/api/intel/address/score?${params}`, { 'x-api-key': apikey });
  if (String(data?.status) !== '200') throw new Error('AnChain.AI declined the risk lookup.');
  const record = data.data?.[address] ?? (Object.keys(data.data ?? {}).length === 1 ? Object.values(data.data)[0] : undefined);
  const score = record?.risk?.score;
  const level = record?.risk?.level;
  if (record?.is_address_valid === false) throw new Error('AnChain.AI rejected the address.');
  if (!Number.isFinite(score) || score < 0 || score > 100 || ![1, 2, 3, 4].includes(level)) {
    throw new Error('AnChain.AI returned no risk score.');
  }
  return { score, level, labels: Array.isArray(record.self?.category) ? record.self.category.filter(item => typeof item === 'string') : [] };
}

async function getBlockBalance(address, network) {
  const token = requiredKey('BLOCKCYPHER_API_KEY');
  const query = new URLSearchParams({ token });
  const data = await getJson(`https://api.blockcypher.com/v1/${network.block}/main/addrs/${encodeURIComponent(address)}/balance?${query}`);
  if (!/^\d+$/.test(String(data?.final_balance))) throw new Error('BlockCypher returned no address balance.');
  const decimals = network.block === 'eth' ? 18 : 8;
  return { ...formatBalance(data.final_balance, decimals, network.unit), transactions: data.final_n_tx };
}

async function getNftSummary(address) {
  const data = await getOwnedNfts(address);
  if (!Number.isSafeInteger(data.totalCount) || data.totalCount < 0) throw new Error('Alchemy returned no NFT count.');
  return { count: data.totalCount };
}

async function checkAddress(address, networkKey) {
  const network = networks.get(networkKey);
  const providers = [
    ['goplus', 'GoPlus', 'Risk signals', network.id, getSecurity],
    ['anchain', 'AnChain.AI', 'Risk score', network.proto, getChainRisk],
    ['etherscan', 'Etherscan', 'Native balance', network.unit && network.id, getBalance],
    ['blockcypher', 'BlockCypher', 'Balance and activity', network.block, getBlockBalance],
    ['alchemy', 'Alchemy', 'NFT holdings', networkKey === 'ethereum', getNftSummary],
  ];
  const reports = await Promise.all(providers.map(async ([id, name, metric, available, lookup]) => {
    const provider = { id, name, metric };
    if (!available) return { ...provider, state: 'unsupported' };
    try {
      return { ...provider, state: 'ok', ...await lookup(address, network) };
    } catch (error) {
      return { ...provider, state: 'error', error: error.message };
    }
  }));
  return { address, network: network.name, explorer: network.explorer ? network.explorer + address : null, reports };
}

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/logo.svg', ['logo.svg', 'image/svg+xml']],
]);

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

if (process.argv.includes('--smoke')) {
  const networkKey = process.argv[3] ?? 'ethereum';
  const address = process.argv[4] ?? example;
  if (!networks.get(networkKey)?.address.test(address)) {
    console.error('Enter a supported network and a matching address.');
    process.exitCode = 1;
  } else {
    const result = await checkAddress(address, networkKey);
    console.log(JSON.stringify(result, null, 2));
    if (result.reports.some(report => report.state === 'error')) process.exitCode = 1;
  }
} else {
  const port = Number(process.env.PORT || 4317);
  createServer(async (req, res) => {
    try {
      if (req.method !== 'GET') return json(res, 405, { error: 'Only GET is supported.' });
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/api/networks') {
        return json(res, 200, Array.from(networks, ([id, network]) => ({ id, name: network.name })));
      }
      if (url.pathname === '/api/check') {
        const address = url.searchParams.get('address')?.trim();
        const networkKey = url.searchParams.get('network') ?? 'ethereum';
        const network = networks.get(networkKey);
        if (!network) return json(res, 400, { error: 'Choose a supported network.' });
        if (!address || !network.address.test(address)) {
          return json(res, 400, { error: `Enter a public ${network.name} address.` });
        }
        return json(res, 200, await checkAddress(address, networkKey));
      }
      const asset = assets.get(url.pathname);
      if (!asset) return json(res, 404, { error: 'Page not found.' });
      const [file, type] = asset;
      const body = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      res.end(body);
    } catch {
      json(res, 500, { error: 'The local server could not complete this request.' });
    }
  }).listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Addrscan: ${url}\nPress Control-C to stop.`);
    if (process.argv.includes('--open') && process.platform === 'darwin') {
      execFile('/usr/bin/open', [url], error => {
        if (error) console.log('Open the local URL above in your browser.');
      });
    }
  });
}
