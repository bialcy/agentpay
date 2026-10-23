import { TokenUSDC } from '@web3icons/react';

interface UsdcAmountProps {
  raw: bigint;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { text: 'text-xs', icon: 14 },
  sm: { text: 'text-sm', icon: 16 },
  md: { text: 'text-base', icon: 18 },
  lg: { text: 'text-xl', icon: 20 },
  xl: { text: 'text-3xl', icon: 28 },
};

export function UsdcAmount({ raw, size = 'md', showIcon = true, className = '' }: UsdcAmountProps) {
  const { text, icon } = SIZE_MAP[size];
  const whole = raw / 1_000_000n;
  const frac = raw % 1_000_000n;
  const fracStr = frac.toString().padStart(6, '0').slice(0, 2);
  const formatted = `${whole.toLocaleString()}.${fracStr}`;

  return (
    <span className={`inline-flex items-center gap-1.5 tabular ${text} font-semibold ${className}`}>
      {showIcon && <TokenUSDC variant="branded" size={icon} />}
      <span className="display" style={{ letterSpacing: '-0.02em' }}>{formatted}</span>
      <span className="text-[0.75em] font-normal" style={{ color: 'var(--muted)' }}>USDC</span>
    </span>
  );
}
