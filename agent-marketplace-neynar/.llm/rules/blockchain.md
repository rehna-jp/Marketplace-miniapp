# Neynar Farcaster Mini App Template - Blockchain Integration Rules

**CRITICAL**: This file contains blockchain integration guidance for Farcaster mini apps. Load this file when implementing token transfers, wallet interactions, or blockchain transactions.

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

## Overview

This guide covers how to integrate blockchain functionality into your Farcaster mini app using the Neynar blockchain SDK.

**This file covers**:

- Setting up the WagmiProvider in your app
- Available blockchain features and when to use them
- Where to find implementation details

**For detailed component APIs, props, and usage examples:**
→ See `src/neynar-web-sdk/src/blockchain/llms.txt`

---

## 🏗️ Provider Setup

### Step 1: Add NeynarWagmiProvider to Your App

The `NeynarWagmiProvider` must wrap your app components to enable blockchain functionality.

**Location**: `src/features/app/providers-and-initialization.tsx`

**CRITICAL**: The `NeynarWagmiProvider` must be added in the EXACT location marked by comments in the file.

**How to add it**:

1. Import: `import { NeynarWagmiProvider } from "@/neynar-web-sdk/blockchain";`
2. Add the provider between the comment markers (see below)
3. Use the basic `<NeynarWagmiProvider>` with NO props (uses sensible defaults)

**Integration Pattern**:

```tsx
"use client";

import { ReactNode, useState } from "react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InitializeFarcasterMiniApp } from "@/neynar-farcaster-sdk/mini";
import { NeynarWagmiProvider } from "@/neynar-web-sdk/blockchain";

export function ProvidersAndInitialization({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        {/* LLMs: Add additional providers between here */}
        <NeynarWagmiProvider>
          {/* and here */}
          {/* LLMs: Do not remove, initialization must be last, before children */}
          <InitializeFarcasterMiniApp />
          {children}
          {/* End Do not remove */}
        </NeynarWagmiProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
```

**Key Requirements**:

- NeynarWagmiProvider must be added between the comment markers `{/* LLMs: Add additional providers between here */}` and `{/* and here */}`
- NeynarWagmiProvider must be **inside** QueryClientProvider
- NeynarWagmiProvider must be **inside** JotaiProvider
- `<InitializeFarcasterMiniApp />` component must be used (NOT the `useInitializeFarcasterApp()` hook)
- `<InitializeFarcasterMiniApp />` and `{children}` must be **inside** NeynarWagmiProvider
- **DO NOT** customize the NeynarWagmiProvider with props - use default `<NeynarWagmiProvider>` with no configuration
- **DO NOT** pass `chains` prop - the default chain configuration is sufficient

---

## 💰 Available Features

### Experimental USDC Components

All blockchain transaction components are prefixed with "Experimental" to indicate active development.

#### ExperimentalUsdcBalance

Display USDC balance for any wallet address.

**When to use**: Show user's balance, display recipient balance before transfer

#### ExperimentalTransferUsdcButton

One-click USDC transfer button with automatic state management.

**When to use**: Simple payments, tips, donations, purchases with fixed amounts

#### ExperimentalTransferUsdcCard

Complete transfer interface with recipient lookup, balance checking, and transaction tracking.

**Features**:

- Recipient by Farcaster ID → shows user profile (avatar, name, username)
- Recipient by wallet address → shows ENS name or truncated address
- Balance checking with insufficient funds warnings
- Transaction lifecycle tracking

**When to use**: Full payment flows, send money features, complex transfers

#### ExperimentalTransactionStatus

Real-time transaction status display with block explorer links.

**When to use**: Show transaction confirmation progress to users

### Utility Components

#### ChainBadge (Non-Experimental)

Display blockchain network badge with icon.

**When to use**: Show current network, display supported chains

### Recipient Lookup

#### ExperimentalFarcasterIdInput

Input field with live Farcaster user lookup and display.

**When to use**: Let users select recipients by Farcaster ID

---

## 📖 Implementation Details

For complete component documentation including:

- Full prop lists and types
- Detailed usage examples
- Transaction lifecycle handling patterns
- Generated contract wrapper usage
- Best practices and common mistakes

**→ See `src/neynar-web-sdk/src/blockchain/llms.txt`**

---

## 🎯 Common Use Cases

### Simple Payment Button

```tsx
import { ExperimentalTransferUsdcButton } from "@/neynar-web-sdk/blockchain";

<ExperimentalTransferUsdcButton
  to="0xRecipient..."
  amountUsdc={10}
  onSuccess={(hash) => console.log("Paid!", hash)}
>
  Send 10 USDC
</ExperimentalTransferUsdcButton>;
```

### Pay Farcaster User

```tsx
import { ExperimentalTransferUsdcCard } from "@/neynar-web-sdk/blockchain";

<ExperimentalTransferUsdcCard
  recipientFid={3} // Can use number or string
  amountUsdc={5}
  onSuccess={(hash) => console.log("Sent to @dwr.eth")}
/>;
```

### Pay Wallet Address

```tsx
import { ExperimentalTransferUsdcCard } from "@/neynar-web-sdk/blockchain";

<ExperimentalTransferUsdcCard
  recipientAddress="0x123..."
  amountUsdc={10}
  lockAmount={true}
/>;
```

---

## ⚠️ CRITICAL SECURITY RULES

### NEVER Make Up Crypto Addresses

**ABSOLUTE RULE**: You must NEVER fabricate, guess, or make up cryptocurrency addresses under any circumstances.

**When implementing blockchain features, you MUST**:

1. **ASK the user explicitly** where funds should be sent:
   - "Should this send to your own account (FID {currentUserFid})?"
   - "Should this send to a specific wallet address? If so, which one?"
   - "Should the recipient be dynamic based on user interactions in the app?"

2. **Use ONLY verified sources** for addresses:
   - ✅ User-provided addresses (confirmed by user)
   - ✅ Current user's FID (available from `useFarcasterUser()`)
   - ✅ Addresses from Farcaster user lookups (via `recipientFid` prop)
   - ✅ Addresses stored in database (that user has configured)
   - ❌ NEVER placeholder addresses like "0x123..." or "0xRecipient..."
   - ❌ NEVER example addresses from documentation
   - ❌ NEVER addresses you generate or invent

3. **For example/demo apps**:
   - Use the current user's own FID as recipient
   - Make it clear in the UI that it's a self-send demo
   - Example: `recipientFid={currentUser?.fid}` (accepts number or string)

**Why this matters**: Sending crypto to the wrong address results in permanent, irreversible loss of funds. There is no undo button in blockchain transactions.

### ALWAYS Validate User-Provided Addresses

**ABSOLUTE RULE**: When a user provides an Ethereum address, you MUST validate it before using it in code.

**Validation checks (ALL must pass):**

1. **Length**: Exactly 42 characters total (`0x` prefix + 40 hex characters)
2. **Prefix**: Starts with `0x`
3. **Characters**: Only contains valid hex characters (0-9, a-f, A-F) after the prefix

**How to validate:**

```typescript
import { isAddress } from "viem";

// ✅ CORRECT — validate before using
const address = "0xUserProvidedAddress...";
if (!isAddress(address)) {
  // STOP — do not use this address
  // Tell the user: "This doesn't look like a valid Ethereum address.
  // Ethereum addresses must be exactly 42 characters (0x + 40 hex characters).
  // Please double-check and provide the full address."
}
```

**Common mistakes users make when providing addresses:**

- Truncated address (missing characters from copy-paste) — e.g. 41 chars instead of 42
- Extra whitespace or newline characters
- Missing `0x` prefix
- Including ENS names instead of resolved addresses (ENS must be resolved separately)

**If validation fails:**

- Do NOT silently use the invalid address
- Do NOT try to "fix" or pad the address
- IMMEDIATELY inform the user that the address appears invalid
- Explain that Ethereum addresses must be exactly 42 characters (0x + 40 hex digits)
- Ask them to re-copy the full address from their wallet

**Why this matters**: An invalid address will cause `writeContract` / `sendTransaction` to fail at the encoding step — the wallet prompt will never appear, and the user will see a generic "transaction failed" error with no clear cause.

---

## 🔀 Cross-Chain Transactions (Non-Base Chains)

The Farcaster wallet connects on **Base (chain ID 8453) by default**. If you need to interact with a contract on a different chain (e.g., Ethereum mainnet, Optimism), you must explicitly switch chains before sending the transaction.

### Required Steps

1. **Switch chains first**: Call `switchChainAsync({ chainId: targetChain.id })` before `writeContract`. The wallet will NOT auto-switch.
2. **Use viem chain objects**: Pass `chain: mainnet` (from `viem/chains`), NOT `chainId: 1`. Viem v2 requires the full chain object — a bare number causes `chain: undefined` errors.

### Pattern

```tsx
import { useSwitchChain, useWriteContract } from "wagmi";
import { mainnet } from "viem/chains";

// Inside your component:
const { switchChainAsync } = useSwitchChain();
const { writeContract } = useWriteContract();

const handleTransaction = async () => {
  // Switch wallet to target chain
  await switchChainAsync({ chainId: mainnet.id });

  // Now write — use chain object, not chainId number
  writeContract({
    address: "0xContractAddress...",
    abi: CONTRACT_ABI,
    functionName: "someFunction",
    chain: mainnet, // CORRECT: viem chain object
  });
};
```

### Common Mistakes

```tsx
// ❌ WRONG - No chain switch, wallet stays on Base
writeContract({
  address: "0xMainnetContract...",
  abi: ABI,
  functionName: "mint",
  chainId: 1, // Also wrong: bare number, not chain object
});

// ❌ WRONG - chainId number instead of chain object
writeContract({
  chain: 1, // viem can't resolve this
});

// ✅ CORRECT - Switch first, then use chain object
await switchChainAsync({ chainId: mainnet.id });
writeContract({
  address: "0xMainnetContract...",
  abi: ABI,
  functionName: "mint",
  chain: mainnet, // Full viem chain object from 'viem/chains'
});
```

### NeynarWagmiProvider Chain Support

The default `NeynarWagmiProvider` (no props) includes `["base", "mainnet"]`. The chains are already configured — the wallet just needs to be switched to the target chain before transacting.

---

## 🔢 Token Amount & BigInt Safety

When computing token amounts in JavaScript/TypeScript, **stay in BigInt for the entire calculation**. JavaScript's `Number` type loses precision beyond `2^53`, and `10 ** 18` (= `1e18`) is already at the edge of safe integer range.

### The Bug

```typescript
// ❌ WRONG — 10 ** 18 is computed as a JS float first, may lose precision
const amountInWei = (BigInt(totalTokens) * BigInt(10 ** 18)).toString();

// ❌ WRONG — same problem, float intermediate
const amount = BigInt(Math.floor(value * 10 ** 18));
```

### The Fix

```typescript
// ✅ CORRECT — stay in BigInt throughout
const amountInWei = (BigInt(totalTokens) * BigInt(10) ** BigInt(18)).toString();

// ✅ CORRECT — use parseUnits from viem for human-readable → wei conversion
import { parseUnits } from "viem";
const amountInWei = parseUnits(totalTokens.toString(), 18).toString();
```

### Common Token Decimals

| Token | Decimals | 1 token in smallest unit |
| ----- | -------- | ------------------------ |
| USDC  | 6        | `"1000000"`              |
| DEGEN | 18       | `"1000000000000000000"`  |
| ETH   | 18       | `"1000000000000000000"`  |

**Best practice**: Use `parseUnits` from viem when converting human-readable amounts. For hardcoded constants (like reward amounts), use string literals to avoid any precision issues.

---

## 🔑 Environment Variable Names

Only use the pre-configured environment variables that exist in the platform. **Do NOT invent env var names.**

### Available Variables

These three env vars serve **different purposes** — do not confuse them:

| Variable                | What it is                           | Where it goes        | Purpose                                                         |
| ----------------------- | ------------------------------------ | -------------------- | --------------------------------------------------------------- |
| `NEYNAR_API_KEY`        | An API key (authenticates your app)  | `x-api-key` header   | Required for ALL Neynar API calls                               |
| `NEYNAR_WALLET_ID`      | A wallet identifier (NOT an API key) | `x-wallet-id` header | Tells Neynar WHICH server wallet to use for the transaction     |
| `NEYNAR_WALLET_ADDRESS` | An Ethereum address                  | Code/UI only         | The wallet's on-chain address (for display or sending funds to) |

**CRITICAL**: `NEYNAR_WALLET_ID` is a **wallet identifier**, not an API key. It identifies which server wallet to use. `NEYNAR_API_KEY` is the **API key** that authenticates your app. They are completely different values used in different headers. Never swap or combine them.

### Common Mistakes

```typescript
// ❌ WRONG — NEYNAR_WALLET_API_KEY does not exist, do not invent env vars
const apiKey = process.env.NEYNAR_WALLET_API_KEY || process.env.NEYNAR_API_KEY!;

// ❌ WRONG — using wallet ID as an API key or vice versa
headers: {
  "x-api-key": process.env.NEYNAR_WALLET_ID!,  // WRONG: wallet ID is not an API key
  "x-wallet-id": process.env.NEYNAR_API_KEY!,   // WRONG: API key is not a wallet ID
}

// ✅ CORRECT — each var in its proper header
headers: {
  "x-api-key": process.env.NEYNAR_API_KEY!,
  "x-wallet-id": process.env.NEYNAR_WALLET_ID!,
}
```

Do not create fallback chains with invented env var names — if someone accidentally sets a non-existent variable, the real key gets silently ignored.

### Troubleshooting 401 Errors on Wallet Endpoints

A 401 from `/v2/farcaster/fungible/send` or other wallet endpoints can mean:

1. **Wrong `NEYNAR_API_KEY`** — the API key is invalid or doesn't have permission
2. **Wrong `NEYNAR_WALLET_ID`** — the wallet ID doesn't match an actual funded wallet, or belongs to a different app

**Do NOT** try to fix 401 errors by inventing new env vars (like `NEYNAR_WALLET_API_KEY`) or adding fallback logic. Instead, verify that both `NEYNAR_API_KEY` and `NEYNAR_WALLET_ID` are set to the correct values. These are pre-configured by the platform — if they're wrong, the user needs to update them in the Studio UI or app environment settings.

**The wallet ID identifies the wallet, the API key authenticates the request. A 401 can come from either being wrong.**

---

## ✅ Quick Checklist

**Before implementing blockchain features:**

1. ✅ Add NeynarWagmiProvider to `src/features/app/providers-and-initialization.tsx`
2. ✅ Ensure it's inside QueryClientProvider and JotaiProvider
3. ✅ Use InitializeFarcasterMiniApp component (not useInitializeFarcasterApp hook)
4. ✅ Import blockchain components from `@/neynar-web-sdk/blockchain`
5. ✅ Handle transaction lifecycle with callbacks (onSuccess, onError, etc.)
6. ✅ Test on testnet first if needed

**For implementation:**

→ Refer to `src/neynar-web-sdk/src/blockchain/llms.txt` for complete API documentation

---

## 🚫 Common Setup Mistakes

```tsx
// ❌ WRONG - NeynarWagmiProvider outside QueryClientProvider
<NeynarWagmiProvider>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</NeynarWagmiProvider>

// ❌ WRONG - Using the hook instead of component
export function ProvidersAndInitialization({ children }: { children: ReactNode }) {
  useInitializeFarcasterApp(); // WRONG - use component instead
  // ...
}

// ❌ WRONG - Missing InitializeFarcasterMiniApp component
<NeynarWagmiProvider>
  {children}
</NeynarWagmiProvider>

// ❌ WRONG - InitializeFarcasterMiniApp not directly above children
<NeynarWagmiProvider>
  <SomeOtherComponent />
  <InitializeFarcasterMiniApp />
  {children}
</NeynarWagmiProvider>

// ❌ WRONG - Customizing with chains prop
<NeynarWagmiProvider chains={["base", "ethereum"]}>
  <InitializeFarcasterMiniApp />
  {children}
</NeynarWagmiProvider>

// ✅ CORRECT - Complete setup with proper nesting and initialization
<QueryClientProvider client={queryClient}>
  <NeynarWagmiProvider>
    <InitializeFarcasterMiniApp />
    {children}
  </NeynarWagmiProvider>
</QueryClientProvider>

// ✅ CORRECT - InitializeFarcasterMiniApp directly above children
<NeynarWagmiProvider>
  <InitializeFarcasterMiniApp />
  {children}
</NeynarWagmiProvider>

// ✅ CORRECT - No props, use defaults
<NeynarWagmiProvider>
  <InitializeFarcasterMiniApp />
  {children}
</NeynarWagmiProvider>
```

---

## 🚫 Error Handling Guidelines

### User Rejected Request - DO NOT Show Error

When a user rejects a transaction in their wallet, you'll see:

```
Provider.UserRejectedRequestError: The user rejected the request.
```

**This is NOT an error to display to the user.** The user intentionally cancelled - they know what happened.

**Handling Pattern**:

```tsx
import { toast } from "@neynar/ui";

onError={(error) => {
  // Don't show error for user rejection - they cancelled intentionally
  if (error.name === 'UserRejectedRequestError' ||
      error.message?.includes('user rejected')) {
    return; // Silent return - no error toast/message
  }

  // Show error for actual problems
  toast.error("Transaction failed. Please try again.");
}}
```

### Errors TO Show

- Network errors (connection issues)
- Insufficient funds
- Contract errors
- Timeout errors

### Errors NOT to Show

- `UserRejectedRequestError` - User cancelled intentionally
- `UserDeniedAccount` - User denied wallet connection

---

## 🏦 Server Wallet (App-Owned Wallet)

For operations where the **app itself** needs to execute blockchain transactions (not the user), use the Neynar server wallet.

### When to Use Server Wallet vs User Wallet

| Use Case                    | Wallet Type       | How                           |
| --------------------------- | ----------------- | ----------------------------- |
| User sends USDC to someone  | **User's wallet** | wagmi/viem components above   |
| App sends tokens as rewards | **Server wallet** | Neynar API with `x-wallet-id` |
| User pays for something     | **User's wallet** | wagmi/viem components above   |
| App buys storage for user   | **Server wallet** | Neynar API with `x-wallet-id` |

### Pre-Configured Environment Variables

Every app has these automatically available:

- `NEYNAR_WALLET_ID` - Pass in `x-wallet-id` header for Neynar API calls
- `NEYNAR_WALLET_ADDRESS` - The wallet's Ethereum address

### Server Wallet Operations

**Supported operations** (all require `x-wallet-id` header):

| Operation        | Endpoint                           | Use Case                      |
| ---------------- | ---------------------------------- | ----------------------------- |
| Send Fungibles   | `POST /v2/farcaster/fungible/send` | Send tokens as prizes/rewards |
| Buy Storage      | `POST /v2/farcaster/storage/buy`   | Provision storage for users   |
| Register Account | `POST /v2/farcaster/user/`         | Create Farcaster accounts     |

### Example: Sending Tokens as Reward

**⚠️ SECURITY**: Server wallet endpoints can drain funds if unprotected. Always:

1. Authenticate the caller (verify FID or use server-side logic only)
2. Validate and limit amounts
3. Use fixed token addresses (never accept from request)

**⚠️ RECIPIENT FORMAT**: The raw Neynar API (`/v2/farcaster/fungible/send`) requires `address` in recipients — NOT `fid`. If you have an FID, look up the user's verified address first via the Neynar user API. (The `useSendFungibles()` SDK hook handles FID→address resolution internally, but raw API calls do not.)

```typescript
// src/app/api/send-reward/route.ts
import { NextResponse } from "next/server";

// Fixed reward amount and token - NEVER accept these from client
const REWARD_AMOUNT = "1000000"; // 1 USDC (6 decimals)
const REWARD_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base

export async function POST(request: Request) {
  const { recipientFid, gameScore } = await request.json();

  // SECURITY: Validate inputs
  if (typeof recipientFid !== "number" || recipientFid <= 0) {
    return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
  }

  // SECURITY: Only reward if game logic permits (e.g., high score threshold)
  // This prevents arbitrary reward claims - adapt to your app's logic
  if (typeof gameScore !== "number" || gameScore < 1000) {
    return NextResponse.json(
      { error: "Score too low for reward" },
      { status: 400 },
    );
  }

  // TODO: Add additional checks as needed:
  // - Rate limiting per FID
  // - Check if user already claimed reward
  // - Verify game score against database

  // Step 1: Resolve FID to verified wallet address
  const userResponse = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${recipientFid}`,
    {
      headers: { "x-api-key": process.env.NEYNAR_API_KEY! },
    },
  );
  const userData = await userResponse.json();
  const recipientAddress =
    userData.users?.[0]?.verified_addresses?.primary?.eth_address;

  if (!recipientAddress) {
    return NextResponse.json(
      { error: "User has no verified wallet address" },
      { status: 400 },
    );
  }

  // Step 2: Send tokens using address (NOT fid) — the raw API only accepts address
  const response = await fetch(
    "https://api.neynar.com/v2/farcaster/fungible/send",
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.NEYNAR_API_KEY!,
        "x-wallet-id": process.env.NEYNAR_WALLET_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients: [{ address: recipientAddress, amount: REWARD_AMOUNT }],
        token_address: REWARD_TOKEN,
        network: "base",
      }),
    },
  );

  return NextResponse.json(await response.json());
}
```

**CRITICAL**: The server wallet is pre-configured. Do NOT ask users to set up wallet IDs.

**If user asks about their server wallet address or funding:**
Display the **Server Wallet Address** from `<system-context>`. This is the Ethereum address they can send funds to if they need to top up the wallet for gas fees.

---

## 🔗 Related Documentation

- `src/neynar-web-sdk/src/blockchain/llms.txt` - Complete blockchain SDK documentation
- [wagmi Documentation](https://wagmi.sh) - Underlying blockchain library
- [viem Documentation](https://viem.sh) - TypeScript utilities for Ethereum
- [Neynar Wallet Docs](https://docs.neynar.com/docs/managing-onchain-wallets) - Server wallet operations
