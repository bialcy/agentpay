/**
 * Thin wrappers around wagmi for AgentPay — Arc Testnet USDC.
 * All amounts in 6-decimal ERC-20 view (never native 18-decimal view).
 */
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { erc20Abi } from 'viem';
import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts';
import { Amount, parseAmount, usdcDecimalsFor } from '@/onchain-money';

export const ARC_TESTNET_ID = 5042002 as const;

const _usdcFact = getUsdc(ARC_TESTNET_ID);
export const USDC_ADDRESS = (_usdcFact?.address ?? '0x3600000000000000000000000000000000000000') as `0x${string}`;
export const USDC_DECIMALS = _usdcFact?.decimals ?? 6;
export const ARC_CHAIN = requireChain(ARC_TESTNET_ID);

export { buildTxExplorerUrl };

/** Parse a user-facing USDC string into raw bigint */
export function parseTxAmount(amount: string): bigint {
  return parseAmount(ARC_TESTNET_ID, amount).raw;
}

/** Format a raw USDC bigint into a display string like "12.50" */
export function formatTxAmount(raw: bigint): string {
  return Amount.fromRaw(raw, usdcDecimalsFor(ARC_TESTNET_ID)).toFixed(2);
}

/** Hook: live USDC balance of any address on Arc Testnet */
export function useUsdcBalance(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_ID,
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const raw = (data) ?? 0n;
  return {
    raw,
    formatted: formatTxAmount(raw),
    isLoading,
    refetch,
  };
}

/** Hook: USDC allowance */
export function useUsdcAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  const { data } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    chainId: ARC_TESTNET_ID,
    query: { enabled: !!owner, refetchInterval: 8000 },
  });
  return (data) ?? 0n;
}

/** Hook: approve USDC spend */
export function useApproveUsdc() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return; }
    writeContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [spender, amount] });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, isError, error, reset };
}

/** Hook: transfer USDC */
export function useTransferUsdc() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const transfer = (to: `0x${string}`, amount: bigint) => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return; }
    writeContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'transfer', args: [to, amount] });
  };

  return { transfer, hash, isPending, isConfirming, isSuccess, isError, error, reset };
}
