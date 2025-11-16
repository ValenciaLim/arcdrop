# Arcdrop

A universal embedded wallet platform for **USDC tipping and subscriptions** using **Circle Modular Wallets**, **CCTP**, and **Arc gasless smart wallet execution**.

## Features

- 🔐 **Passkey Authentication**: Secure, passwordless authentication using WebAuthn
- 💰 **USDC Payments**: Send tips and manage subscriptions with USDC
- 🌐 **Multi-chain Support**: Works across Base, Polygon, and Avalanche networks
- ⛽ **Gasless Transactions**: Powered by Arc for seamless user experience
- 🔄 **Cross-chain Bridging**: CCTP integration for multi-chain USDC transfers
- 📱 **Payment Links & QR Codes**: Simple payment links and QR codes for easy sharing

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Wallets**: Circle Modular Wallets (passkey-based smart contract accounts)
- **Blockchain**: viem for Ethereum interactions
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Docker recommended)
- Circle Modular Wallets account and credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Start PostgreSQL using Docker:

```bash
docker run --name arcdrop-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=arcdrop \
  -e POSTGRES_DB=arcdrop \
  -p 5434:5432 \
  -d postgres:15
```

Run migrations:

```bash
npx prisma migrate dev
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://arcdrop:secret@localhost:5434/arcdrop"

# Circle Modular Wallets
# Get these from: https://console.circle.com/modular-wallets
MODULAR_CLIENT_URL="https://api.circle.com/v1/w3s/modular"
MODULAR_CLIENT_KEY="your-client-key-here"
MODULAR_DEFAULT_CHAIN="base-sepolia"

# Application URL (optional, defaults to localhost:3000 in dev)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Getting Circle Modular Wallets Credentials:**

1. Sign up at [Circle Console](https://console.circle.com)
2. Navigate to Modular Wallets section
3. Create a new application
4. Copy your `Client URL` and `Client Key`
5. Add them to your `.env` file

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── modular/       # Modular wallet endpoints
│   │   └── pay/           # Payment processing
│   └── ...
├── components/
│   └── arcdrop/           # Arcdrop-specific components
│       └── arcdrop-modal.tsx  # Universal checkout modal
├── lib/
│   ├── modular/           # Modular wallet utilities
│   ├── payments.ts        # Payment processing logic
│   └── ...
└── types/                 # TypeScript type definitions
```

## How It Works

1. **User Flow**:
   - User clicks a payment link or scans QR code
   - Enters payment details
   - Authenticates with passkey (WebAuthn)
   - Modular wallet is automatically created/retrieved
   - Payment is processed via Circle + Arc (gasless)

2. **Wallet Creation**:
   - Uses Circle Modular Wallets SDK
   - Passkey-based authentication (no passwords)
   - Smart contract account wallets
   - Deterministic addresses per user/network

3. **Payment Processing**:
   - USDC transfer via Circle
   - Cross-chain bridging via CCTP (if needed)
   - Gasless execution via Arc
   - All transactions recorded in database

## API Endpoints

- `GET /api/modular/config` - Get modular wallet configuration
- `POST /api/modular/wallet` - Sync wallet address to database
- `POST /api/pay` - Process tip or subscription payment
- `GET /api/payment-link/:slug` - Get payment link details
- `POST /api/create-payment-link` - Create new payment link

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Type Checking

```bash
npm run lint
```

## Deployment

1. Set environment variables in your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Build the application: `npm run build`
4. Start the server: `npm start`

## License

MIT
