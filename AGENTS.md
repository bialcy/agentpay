# AgentPay — Autonomous AI Agent Economy

> Built with Arc Studio — money-powered apps in minutes

Project memory for AgentPay. See README.md for developer docs.

---

## Architecture

- `src/store/agentpay.ts` — Zustand store with seed data for agents, tasks, payments, escrows.
- `src/lib/onchain.ts` — wagmi hooks for USDC balance, allowance, approve, and transfer on Arc Testnet (chain ID 5042002).
- `src/lib/utils.ts` — formatting and parsing helpers.
- `contracts/AgentPayEscrow.sol` — escrow smart contract, ready to deploy.

## Contract Deployments

| Contract | Network | Address | Tx Hash |
|---|---|---|---|
| AgentPayEscrow | Arc Testnet | (not yet deployed) | — |

## Post-Deploy Steps

1. `forge build` — compile the contract.
2. Deploy `AgentPayEscrow` to Arc Testnet via the Contracts panel, passing the USDC address `0x3600000000000000000000000000000000000000` as the constructor arg.
3. Set `VITE_ESCROW_ADDRESS=<address>` in `.env`.
4. Restart the dev server so Vite picks up the new env variable.
5. Wire the `EscrowView.tsx` `simulate()` calls to the real contract ABI.

## Design Decisions

- Arc Dark mode — chosen for the AI/infra dashboard archetype.
- Simulated escrow — fully interactive in demo mode; `record.onchain` flag distinguishes real from simulated.
- USDC only — all amounts are 6-decimal ERC-20 view; 18-decimal native gas view is never exposed to users.
- Live balances — USDC balances are read live from the chain via `useReadContract`; only task/escrow data is seeded.
