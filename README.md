# Addrscan

A local crypto address scanner inspired by VirusTotal's per-provider reports. Addrscan displays the risk assessments and on-chain data returned by each provider, including gaps and provider errors. A report is a snapshot. Address safety remains unverified.

## Run on macOS

Double-click **Start Addrscan.command** in Finder. The launcher can use the Node runtime that ships with ChatGPT for Mac. Keep the Terminal window open while scanning and press Control-C to stop it.

On other platforms, run `node --env-file-if-exists=.env server.js` with Node.js 22.9 or newer and open http://127.0.0.1:4317.

This checkout uses the supplied credentials from the server-side `.env` file. For a new copy, copy `.env.example` to `.env`, fill in the relevant keys, and restart. Submitted public addresses are sent to the applicable API providers. AnChain.AI charges credits for address risk requests.

## Coverage

Choose the address's network before scanning. An EVM address can exist independently on multiple networks, including as a wallet on one network and a contract on another. The checker routes by selected network, applies a basic format check, and relies on upstream providers for address data. The two samples always select Ethereum.

| Networks | Applicable providers |
| --- | --- |
| Ethereum | GoPlus, AnChain.AI, Etherscan, BlockCypher, Alchemy |
| Base, Arbitrum One, Optimism | GoPlus, Etherscan |
| Polygon, BNB Smart Chain, Avalanche C-Chain | GoPlus, AnChain.AI, Etherscan |
| Bitcoin, Litecoin, Dogecoin, Dash | AnChain.AI, BlockCypher |
| Solana, XRP Ledger | AnChain.AI |
| Tron | GoPlus, AnChain.AI |

Provider plans may limit networks or return no data. NFT counts are Ethereum-only. Other chains, testnets, and address types outside the listed formats have no scan coverage.

## Test Alchemy NFTs

Set `ALCHEMY_API_KEY` in `.env` before running the command. The supplied Ethereum `/v2/` URL is for Ethereum JSON-RPC calls. NFT ownership uses the separate NFT API v3 endpoint, `getNFTsForOwner`. The script prints the ownership count and the first page of up to five NFTs. It accepts an Ethereum address or a `.eth` name. Node loads `.env` directly.

```sh
./Start\ Addrscan.command --nfts vitalik.eth
```

On a machine with Node on PATH, run `node --env-file-if-exists=.env alchemy-nfts.js vitalik.eth`.

## Test providers

```sh
./Start\ Addrscan.command --smoke
./Start\ Addrscan.command --smoke bitcoin 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

The smoke command exits with a nonzero status if any applicable provider fails.

- [VirusTotal reports](https://docs.virustotal.com/docs/how-it-works)
- [GoPlus address security](https://docs.gopluslabs.io/reference/addresscontractusingget_1)
- [AnChain.AI Data API](https://data.anchainai.com/docs/)
- [Etherscan native balance](https://docs.etherscan.io/api-reference/endpoint/balance)
- [BlockCypher address API](https://www.blockcypher.com/apis.html)
- [Alchemy NFT API quickstart](https://www.alchemy.com/docs/reference/nft-api-quickstart)

## GitHub Pages preview

In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/docs`, then save. The preview includes two recorded Ethereum reports. Run the Node app locally for live address scans.
