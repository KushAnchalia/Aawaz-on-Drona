# Deploying Aawaz on DronaHQ

Aawaz is now a **general multi-chain platform** (Ethereum · Solana · Monad) and is
**embed-ready** for DronaHQ portals. Two supported paths:

## Option A — Embed (fastest, recommended)

1. Deploy Aawaz anywhere (Vercel / Docker / your VM) and copy the URL, e.g.
   `https://your-aawaz.vercel.app`.
2. In DronaHQ Studio → add a **Custom HTML / Embed** control → paste:

```html
<iframe
  src="https://your-aawaz.vercel.app?embed=1&chain=monad-testnet"
  width="100%" height="900"
  allow="microphone; clipboard-write; camera"
  style="border:0;border-radius:16px">
</iframe>
```

Query params supported:

| Param | Values | Effect |
|---|---|---|
| `embed=1` | `1` | skips landing page, opens agent directly |
| `chain` | `ethereum` `sepolia` `monad-testnet` `monad-mainnet` `solana-devnet` `solana-mainnet` | pre-selects chain |
| `cmd` | any text | pre-fills first voice/text command, e.g. `cmd=send 0.1 to $mom` |

3. Wallet note: MetaMask/Phantom popups work in iframes as long as the embed
   allows popups. In DronaHQ embed settings enable **“Allow popups / modals”**.

## Option B — Self-host with Docker (for DronaHQ on-prem / VPC)

```bash
cp env.example .env.local   # fill GROQ_API_KEY etc.
docker build -t aawaz .
docker run -p 3000:3000 --env-file .env.local aawaz
```

Health check: `GET /api/health` → `{ app: "aawaz", chains: [...] }`.

Then in DronaHQ use the Docker URL as an **External App / Web URL micro-app**,
or iframe it per Option A.

## DronaHQ data connector — Address Book + Activity

Expose saved bookmarks and payment history as REST data sources:

- `GET /api/dronahq/contacts?user=<id>&q=<search>` → `{ contacts: [...] }`
- `POST /api/dronahq/contacts` `{ name, label, address, chain, user }` → upsert (`200`/`201`), old code returned `409`, now upserts
- `PUT /api/dronahq/contacts` `{ contacts: [...], user }` → bulk replace (browser pushes its book here on every save)
- `DELETE /api/dronahq/contacts?name=<handle>&user=<id>` → remove
- `GET /api/dronahq/activity?user=<id>&limit=50` → recent sends
- `POST /api/dronahq/activity` `{ type:"send", amount, symbol, to, label, tx, chain, user }` → logged on every successful transfer

### Pushing into manageddb / Sheets

Set in `.env.local` (server-only):

```bash
DRONAHQ_SYNC_URL=https://<your-dronahq>/api/aawaz/ingest   # your REST endpoint / automation webhook
DRONAHQ_SYNC_KEY=<token>
DRONAHQ_SYNC_TABLE_CONTACTS=aawaz_contacts   # sheet/table names your endpoint maps
DRONAHQ_SYNC_TABLE_ACTIVITY=aawaz_activity
```

Every mutation then fans out as `{ table, action, contacts|entry, at }`.
Leave unset for offline-first local mode — responses include `synced:false`.
In DronaHQ: **Connectors → REST API →** base URL = your Aawaz URL, add the
endpoints above, then bind to a Table/Form or Sheet.

## Security notes

- `next.config.js` ships with `output: "standalone"` + permissive CORS/iframe
  headers so DronaHQ can embed it. In production, tighten
  `Content-Security-Policy: frame-ancestors https://<your-dronahq-domain>`.
- Never expose `PRIVATE_KEY` / `GROQ_API_KEY` to the browser — keep them in
  server env only.
- Solana signing happens in **Phantom** (never on server); the
  `POST /api/solana/transfer` helper only fetches a fresh blockhash.
