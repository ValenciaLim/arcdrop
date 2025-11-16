# Arcdrop

Universal embedded wallet flows for USDC tipping and subscriptions, with developer-controlled wallets (Circle), Arc gasless execution, and CCTP bridging. Includes full mock mode for local demos.

## Key Features

- 💼 Developer-controlled wallets (Circle) with DB storage
- 💸 USDC tips and subscriptions
- ⛽ Gasless execution (Arc) in checkout flow
- 🔀 CCTP cross-chain bridging with progress UI (mocked)
- 🧪 Mock mode for end-to-end demos without Circle creds

## Tech

- Next.js 16 (App Router), React 19, TypeScript
- PostgreSQL + Prisma
- Zod validation

## Quick Start

1) Install

```bash
npm install
```

2) Database

```bash
docker run --name arcdrop-db -e POSTGRES_PASSWORD=secret -e POSTGRES_USER=arcdrop -e POSTGRES_DB=arcdrop -p 5434:5432 -d postgres:15
npx prisma migrate dev
```

3) Environment

Create `.env`:

```env
# Database
DATABASE_URL="postgresql://arcdrop:secret@localhost:5434/arcdrop"

# Mock mode (recommended for local demo)
ARCDROP_MOCK_WALLETS=true

# Circle (only needed when not mocking)
CIRCLE_API_BASE=https://api.circle.com
CIRCLE_API_KEY=
CIRCLE_BLOCKCHAIN=MATIC-AMOY
# Either derive per-request via SDK or provide a fresh one-time ciphertext
CIRCLE_ENTITY_SECRET=
CIRCLE_ENTITY_SECRET_CIPHERTEXT=
```

4) Dev

```bash
npm run dev
```

Open http://localhost:3000

## Real vs Mock

- Mock mode (`ARCDROP_MOCK_WALLETS=true`): All wallet ops and transfers are simulated in-memory; balances reflect transfers and fall back to DB-settled tips.
- Real mode: Provide Circle envs. You can generate ciphertext via:

```bash
npm run circle:ciphertext
```

Copy the output to `CIRCLE_ENTITY_SECRET_CIPHERTEXT`.

## API Surface

- Wallet
  - `POST /api/wallet/init`: Initialize/return wallet for an email
  - `POST /api/wallet/balance`: { email? | walletAddress? } → balances
- Payments
  - `POST /api/payments/tip`: Tip flow
  - `POST /api/payments/subscribe`: Subscription flow
- CCTP
  - `POST /api/cctp-transfer`: Mocked Burn → Attest → Mint steps
- Creators
  - `GET /api/creators/[id]`: Creator details by id or handle
  - `GET /api/creators/id/[id]/wallets`: Auto-provision wallet if none

## UI

- `ArcdropModal` (checkout): server-driven wallet init; no passkey prompts
- Creator page → Wallet tab:
  - Shows wallet address + balance
  - Withdraw button opens CCTP modal (mock flow)

## Dev Tips

- Reset DB:

```bash
npx prisma migrate reset --force --skip-generate
```

- Lint:

```bash
npm run lint
```

## Notes

- In mock mode, balances are in-memory and also fall back to summing SETTLED tips if needed.
- In real mode, implement Circle “get balances by wallet id” if you want live onchain balances (stubbed in code).

## License

MIT
