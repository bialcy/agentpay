/** Truncate a hex address to 0x1234…abcd */
export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format a USDC amount (6 decimals raw bigint or number) */
export function formatUsdc(raw: bigint | number, decimals = 6): string {
  const n = typeof raw === 'bigint' ? raw : BigInt(Math.round(Number(raw)));
  const factor = BigInt(10 ** decimals);
  const whole = n / factor;
  const frac = n % factor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

/** Parse a user-facing USDC string to raw bigint (6 decimals) */
export function parseUsdc(value: string): bigint {
  const [whole, frac = ''] = value.replace(/,/g, '').split('.');
  const fracPadded = frac.padEnd(6, '0').slice(0, 6);
  return BigInt(whole || '0') * 1_000_000n + BigInt(fracPadded || '0');
}

/** Returns a relative time string like "2 min ago" */
export function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Clamp a number between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Generate a deterministic avatar color from a string */
export function avatarColor(seed: string): string {
  const colors = [
    '#38c9b9', '#acc6e9', '#9b7eff', '#f5a623',
    '#5fc98a', '#e8627a', '#4fb3e8', '#c07aff',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

/** Capitalize first letter */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Parse an onchain error into a user-friendly message */
export function parseOnchainError(error: unknown): string {
  const err = error as { message?: string; code?: number } | null;
  const msg = err?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || err?.code === 4001) return 'Transaction cancelled.';
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance'))
    return 'Insufficient USDC balance.';
  if (msg.includes('reverted')) {
    const m = msg.match(/reason="([^"]+)"/);
    return m ? `Transaction failed: ${m[1]}` : 'Transaction failed. Please try again.';
  }
  if (msg.includes('network') || msg.includes('timeout'))
    return 'Network error. Please retry.';
  return 'Something went wrong. Please try again.';
}
