# AI Art Arena

x402-powered daily art competition by AsterPay.

## How It Works

1. **Submit** - Pay $0.05 via x402 (USDC) to enter your AI art
2. **Judge** - Claude AI evaluates all submissions
3. **Win** - Daily winner gets 90% of the prize pool
4. **AsterPay** - Keeps 10% fee, converted to EUR via SEPA Instant

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Wagmi
- **Backend**: Fastify + AsterPay x402 SDK
- **Contracts**: Foundry (Solidity) on Base
- **AI Judge**: Claude API (Anthropic)

## Project Structure

```
ai-art-arena/
├── contracts/          # Solidity smart contracts
│   └── PrizePool.sol   # Main escrow contract
├── frontend/           # Next.js app
│   ├── app/            # App router pages
│   └── components/     # React components
├── backend/            # API server
│   ├── api/            # Route handlers
│   └── services/       # Business logic
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Foundry (for contracts)
- Base Sepolia testnet ETH

### Development

```bash
# Install dependencies
pnpm install

# Start frontend
cd frontend && pnpm dev

# Start backend
cd backend && pnpm dev

# Deploy contracts (testnet)
cd contracts && forge script Deploy --rpc-url base-sepolia
```

## Environment Variables

```env
# Backend
ANTHROPIC_API_KEY=sk-ant-...
ASTERPAY_API_KEY=...
BASE_RPC_URL=https://sepolia.base.org

# Frontend
NEXT_PUBLIC_WALLET_CONNECT_ID=...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Contracts

### PrizePool.sol

Main contract handling:
- Entry fee deposits (USDC)
- Prize pool escrow
- Winner payouts
- Platform fee (10%)

### Addresses (Base Sepolia)

- PrizePool: `TBD`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## API Endpoints

### POST /api/submit
Submit artwork for competition.

```json
{
  "imageUrl": "ipfs://...",
  "title": "My AI Art",
  "walletAddress": "0x..."
}
```

### GET /api/leaderboard
Get current competition standings.

### POST /api/pay
Create x402 payment intent.

## License

MIT - AsterPay 2026
