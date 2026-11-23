<p align="center"><img src="branding/Addrscan-Lavender.png" alt="Addrscan logo" width="96"></p>
<h1 align="center">Addrscan</h1>
<p align="center">Check public crypto addresses for reported risk, balances, and on-chain activity.</p>
<p align="center"><a href="https://clankclankclankclank.github.io/addrscan/"><strong>Open Addrscan</strong></a></p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&amp;logo=html5&amp;logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS-663399?style=for-the-badge&amp;logo=css&amp;logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&amp;logo=javascript&amp;logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js">
</p>

## What you can do

- Scan a public wallet or contract address on any of the 14 supported networks.
- Compare GoPlus risk flags with AnChain.AI risk scores in the same report.
- Look up native balances, transaction counts, and Ethereum NFT holdings where providers supply them.
- See individual provider results and coverage gaps. A report reflects the data returned at lookup time and cannot establish that an address is safe.

## Try it in a minute

Open the [GitHub Pages preview](https://clankclankclankclank.github.io/addrscan/) and select **Normal Address** or **Malicious Address**. The preview shows recorded Ethereum reports for the Wrapped Ether contract and a GoPlus example with reported theft and financial-crime flags. Live scans run through the local Node server.

## Run locally

Use **Node.js 22.9 or newer**. Addrscan runs without installing npm dependencies or building the frontend.

1. Download or clone the repository.
2. Copy `.env.example` to `.env` in the project folder. Fill in the API keys for the providers you want to use.
3. Start Addrscan using the launcher for your operating system.

| Platform | Start Addrscan |
| --- | --- |
| Windows | Install [Node.js](https://nodejs.org/en/download), then double-click **Start Addrscan.cmd**. Open [localhost:4317](http://127.0.0.1:4317) in your browser. |
| macOS | Double-click **Start Addrscan.command**. It opens the browser and can use the Node runtime bundled with the ChatGPT desktop app. |
| Linux or terminal | Run `node --env-file-if-exists=.env server.js` from the repository root and open [localhost:4317](http://127.0.0.1:4317). |

Keep the terminal open while scanning. Press **Ctrl+C** to stop the server.

### Provider keys

| Variable | Service |
| --- | --- |
| `ETHERSCAN_API_KEY` | [Etherscan](https://docs.etherscan.io/api-reference/endpoint/balance) native balances |
| `ANCHAIN_API_KEY` | [AnChain.AI](https://data.anchainai.com/docs/) risk scores |
| `BLOCKCYPHER_API_KEY` | [BlockCypher](https://www.blockcypher.com/apis.html) balances and activity |
| `ALCHEMY_API_KEY` | [Alchemy](https://www.alchemy.com/docs/reference/nft-api-quickstart) Ethereum NFT holdings |
| `GOPLUS_ACCESS_TOKEN` | Optional bearer token for [GoPlus](https://docs.gopluslabs.io/reference/addresscontractusingget_1) risk signals |

Keep credentials in the ignored `.env` file. The local service sends the public address to the applicable providers. Their plans can limit coverage or use credits.

## Network coverage

| Networks | Providers |
| --- | --- |
| Ethereum | GoPlus, AnChain.AI, Etherscan, BlockCypher, Alchemy |
| Base, Arbitrum One, Optimism | GoPlus, Etherscan |
| Polygon, BNB Smart Chain, Avalanche C-Chain | GoPlus, AnChain.AI, Etherscan |
| Bitcoin, Litecoin, Dogecoin, Dash | AnChain.AI, BlockCypher |
| Solana, XRP Ledger | AnChain.AI |
| Tron | GoPlus, AnChain.AI |

Select the intended network before scanning. The same EVM address can have different activity on different networks.

## Test the APIs

Run a live provider check on the default Ethereum sample, or query the first page of NFTs owned by an Ethereum address or ENS name.

```sh
node --env-file-if-exists=.env server.js --smoke
node --env-file-if-exists=.env alchemy-nfts.js vitalik.eth
```
