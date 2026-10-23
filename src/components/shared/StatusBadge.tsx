import type { TaskStatus, EscrowStatus, PaymentStatus } from '@/store/agentpay';

type Status = TaskStatus | EscrowStatus | PaymentStatus;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot?: boolean }> = {
  open: { label: 'Open', color: 'var(--agent-teal)', bg: 'rgba(56,201,185,0.12)', dot: true },
  in_progress: { label: 'In Progress', color: 'var(--agent-amber)', bg: 'rgba(245,166,35,0.12)', dot: true },
  completed: { label: 'Completed', color: 'var(--success)', bg: 'rgba(95,201,138,0.12)' },
  disputed: { label: 'Disputed', color: 'var(--danger)', bg: 'rgba(232,98,122,0.12)', dot: true },
  cancelled: { label: 'Cancelled', color: 'var(--subtle)', bg: 'rgba(94,122,154,0.12)' },
  funded: { label: 'Funded', color: 'var(--agent-amber)', bg: 'rgba(245,166,35,0.12)', dot: true },
  released: { label: 'Released', color: 'var(--success)', bg: 'rgba(95,201,138,0.12)' },
  refunded: { label: 'Refunded', color: 'var(--subtle)', bg: 'rgba(94,122,154,0.12)' },
  pending: { label: 'Pending', color: 'var(--agent-amber)', bg: 'rgba(245,166,35,0.12)', dot: true },
  confirmed: { label: 'Confirmed', color: 'var(--success)', bg: 'rgba(95,201,138,0.12)' },
  failed: { label: 'Failed', color: 'var(--danger)', bg: 'rgba(232,98,122,0.12)' },
};

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'var(--subtle)',
    bg: 'rgba(94,122,154,0.12)',
  };

  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const text = size === 'sm' ? 'text-xs' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${text}`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.dot && (
        <span
          className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
}
