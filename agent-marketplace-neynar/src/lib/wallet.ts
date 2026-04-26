"use client";

import { ethers } from "ethers";
import { CHAIN_ID } from "@/lib/contracts";
import { blockchainConfig } from "@/config/blockchain-config";

const RPC_URL = blockchainConfig.baseSepolia.rpcUrl;
const chainHex = `0x${CHAIN_ID.toString(16)}`;

export interface WalletConnection {
  signer: ethers.Signer;
  address: string;
  provider: ethers.JsonRpcProvider;
}

type RawProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

async function rawRequest<T>(p: RawProvider, method: string, params?: unknown[]): Promise<T> {
  return p.request({ method, params: params ?? [] }) as Promise<T>;
}

/**
 * Builds a rawSigner from any injected provider (Farcaster or MetaMask).
 * Never creates ethers.BrowserProvider — avoids eth_chainId crash on MetaMask.
 */
function buildRawSigner(raw: RawProvider, address: string): ethers.Signer {
  const publicRpc = new ethers.JsonRpcProvider(RPC_URL);

  const rawSigner: ethers.Signer = {
    provider: publicRpc,
    getAddress: async () => address,
    signTransaction: async () => { throw new Error("signTransaction not supported"); },
    signMessage: async (msg: string | Uint8Array) => {
      const data = typeof msg === "string"
        ? ethers.hexlify(ethers.toUtf8Bytes(msg))
        : ethers.hexlify(msg);
      return rawRequest<string>(raw, "personal_sign", [data, address]);
    },
    signTypedData: async () => { throw new Error("signTypedData not supported"); },
    sendTransaction: async (tx: ethers.TransactionRequest) => {
      let gasLimit: string;
      try {
        const est = await publicRpc.estimateGas({ ...tx, from: address });
        gasLimit = ethers.toBeHex((est * 120n) / 100n);
      } catch {
        gasLimit = tx.gasLimit ? ethers.toBeHex(BigInt(tx.gasLimit.toString())) : ethers.toBeHex(400000n);
      }

      const txParams: Record<string, unknown> = {
        from: address,
        to: tx.to ?? undefined,
        data: tx.data ?? "0x",
        gas: gasLimit,
      };
      if (tx.value !== undefined && tx.value !== null && tx.value !== 0n && tx.value !== 0) {
        txParams.value = ethers.toBeHex(BigInt(tx.value.toString()));
      }

      const txHash = await rawRequest<string>(raw, "eth_sendTransaction", [txParams]);

      const response = await publicRpc.getTransaction(txHash);
      if (!response) {
        return {
          hash: txHash,
          wait: () => waitForTx(txHash),
        } as unknown as ethers.TransactionResponse;
      }
      return response;
    },
    connect: function() { return rawSigner; },
  } as unknown as ethers.Signer;

  return rawSigner;
}

export async function getWallet(): Promise<WalletConnection> {
  const publicRpc = new ethers.JsonRpcProvider(RPC_URL);

  // ── Try Farcaster SDK provider first (Warpcast) ────────────────────────────
  try {
    const { default: miniappSdk } = await import("@farcaster/miniapp-sdk");
    const context = await miniappSdk.context;
    if (context?.user) {
      const ethProvider = await miniappSdk.wallet.getEthereumProvider();
      if (ethProvider) {
        const raw = ethProvider as RawProvider;
        // Switch chain via raw request — no BrowserProvider
        const currentChain = await rawRequest<string>(raw, "eth_chainId");
        if (parseInt(currentChain, 16) !== CHAIN_ID) {
          try {
            await rawRequest(raw, "wallet_switchEthereumChain", [{ chainId: chainHex }]);
          } catch (e: unknown) {
            const err = e as { code?: number };
            if (err?.code === 4902) {
              await rawRequest(raw, "wallet_addEthereumChain", [{
                chainId: chainHex,
                chainName: "Base Sepolia",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: [RPC_URL],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              }]);
            } else {
              throw new Error("Please switch to Base Sepolia to continue.");
            }
          }
        }
        const accounts = await rawRequest<string[]>(raw, "eth_accounts");
        const address = ethers.getAddress(accounts[0]);
        return { signer: buildRawSigner(raw, address), address, provider: publicRpc };
      }
    }
  } catch {
    // Not in Warpcast or SDK unavailable — fall through to MetaMask
  }

  // ── MetaMask / injected wallet ─────────────────────────────────────────────
  const win = typeof window !== "undefined" ? window as unknown as { ethereum?: RawProvider } : null;
  const raw = win?.ethereum;
  if (!raw) throw new Error("No wallet found. Open in Warpcast or install MetaMask.");

  // Connect
  try {
    await rawRequest(raw, "eth_requestAccounts");
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err?.code === -32002) {
      const accs = await rawRequest<string[]>(raw, "eth_accounts");
      if (!accs?.length) throw new Error("MetaMask approval pending — approve then try again.");
    } else {
      throw e;
    }
  }

  // Switch to Base Sepolia
  try {
    await rawRequest(raw, "wallet_addEthereumChain", [{
      chainId: chainHex,
      chainName: "Base Sepolia",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: [RPC_URL],
      blockExplorerUrls: ["https://sepolia.basescan.org"],
    }]);
  } catch {
    try {
      await rawRequest(raw, "wallet_switchEthereumChain", [{ chainId: chainHex }]);
    } catch {
      throw new Error("Please switch to Base Sepolia in MetaMask to continue.");
    }
  }

  const accounts = await rawRequest<string[]>(raw, "eth_accounts");
  if (!accounts?.length) throw new Error("No accounts found. Connect your wallet first.");
  const address = ethers.getAddress(accounts[0]);

  return { signer: buildRawSigner(raw, address), address, provider: publicRpc };
}

export async function getReadProvider(): Promise<ethers.JsonRpcProvider> {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function waitForTx(txHash: string): Promise<ethers.TransactionReceipt | null> {
  const rpc = new ethers.JsonRpcProvider(RPC_URL);
  for (let i = 0; i < 60; i++) {
    const receipt = await rpc.getTransactionReceipt(txHash);
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
