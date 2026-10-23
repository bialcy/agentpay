import { useState } from 'react';
import { ShieldCheck, Lock, Unlock, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAgentPayStore, type EscrowRecord } from '@/store/agentpay';
import { AgentAvatar } from './shared/AgentAvatar';
import { StatusBadge } from './shared/StatusBadge';
import { UsdcAmount } from './shared/UsdcAmount';
import { relativeTime, shortAddr } from '@/lib/utils';
import { buildTxExplorerUrl, ARC_TESTNET_ID } from '@/lib/onchain';

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const ESCROW_STATUS_ICON: Record<string, React.ReactNode> = {
  funded: <Lock size={14} />,
  released: <Unlock size={14} />,
  refunded: <Unlock size={14} />,
  disputed: <AlertTriangle size={14} />,
};

function EscrowCard({
  record,
  isSelected,
  onClick,
}: {
  record: EscrowRecord;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { agents, tasks } = useAgentPayStore();
  const payer = agents.find((a) => a.id === record.payerId);
  const payee = agents.find((a) => a.id === record.payeeId);
  const task = tasks.find((t) => t.id === record.taskId);

  return (
    <motion.button
      variants={fade}
      onClick={onClick}
      className="w-full text-left glass rounded-xl p-4 transition-all duration-150 hover:brightness-110"
      style={{
        border: isSelected ? '1.5px solid var(--agent-violet)' : '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(155,126,255,0.12)', color: 'var(--agent-violet)' }}
          >
            {ESCROW_STATUS_ICON[record.status] ?? <ShieldCheck size={14} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold display truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {task?.title ?? 'Task Escrow'}
            </p>
            <StatusBadge status={record.status} size="sm" />
          </div>
        </div>
        <UsdcAmount raw={record.amount} size="sm" showIcon={false} />
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--subtle)' }}>
        {payer && (
          <div className="flex items-center gap-1">
            <AgentAvatar name={payer.name} type={payer.type} size={16} className="!rounded-md" />
            <span>{payer.name}</span>
          </div>
        )}
        <span>→</span>
        {payee && (
          <div className="flex items-center gap-1">
            <AgentAvatar name={payee.name} type={payee.type} size={16} className="!rounded-md" />
            <span>{payee.name}</span>
          </div>
        )}
        <span className="ml-auto">{relativeTime(record.createdAt)}</span>
      </div>
    </motion.button>
  );
}

function EscrowDetail({ record }: { record: EscrowRecord }) {
  const { agents, tasks, releaseEscrow, refundEscrow, updateEscrow } = useAgentPayStore();
  const payer = agents.find((a) => a.id === record.payerId);
  const payee = agents.find((a) => a.id === record.payeeId);
  const task = tasks.find((t) => t.id === record.taskId);
  const [loading, setLoading] = useState<'release' | 'refund' | 'dispute' | null>(null);

  const simulate = async (action: 'release' | 'refund' | 'dispute') => {
    setLoading(action);
    await new Promise((r) => setTimeout(r, 1200));
    if (action === 'release') {
      releaseEscrow(record.id);
      toast.success('Funds released to payee (simulated).');
    } else if (action === 'refund') {
      refundEscrow(record.id);
      toast.success('Funds refunded to payer (simulated).');
    } else {
      updateEscrow(record.id, { status: 'disputed' });
      toast.error('Dispute opened — funds locked until resolved.');
    }
    setLoading(null);
  };

  return (
    <motion.div
      key={record.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="glass-strong rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <StatusBadge status={record.status} />
          <h2 className="display text-lg font-bold mt-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {task?.title ?? 'Escrow Contract'}
          </h2>
        </div>
        <UsdcAmount raw={record.amount} size="lg" />
      </div>

      {/* Onchain info */}
      <div
        className="flex items-start gap-2 rounded-xl p-3 text-xs"
        style={{ background: 'rgba(155,126,255,0.08)', color: 'var(--agent-violet)' }}
      >
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <div>
          {record.onchain
            ? 'Funds held in smart contract onchain. Release or refund is trustless.'
            : 'Demo mode — escrow is simulated. Deploy the AgentPayEscrow contract to go onchain.'}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3">
        {payer && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Payer (depositor)</div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={payer.name} type={payer.type} size={28} />
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{payer.name}</div>
                <div className="mono text-[10px]" style={{ color: 'var(--subtle)' }}>{shortAddr(payer.walletAddress)}</div>
              </div>
            </div>
          </div>
        )}
        {payee && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Payee (worker)</div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={payee.name} type={payee.type} size={28} />
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{payee.name}</div>
                <div className="mono text-[10px]" style={{ color: 'var(--subtle)' }}>{shortAddr(payee.walletAddress)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {[
          { label: 'Created', ts: record.createdAt, done: true },
          { label: 'Funded', ts: record.createdAt, done: record.status !== 'funded' || true },
          { label: 'Resolved', ts: record.updatedAt, done: record.status !== 'funded' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
              style={{
                background: step.done ? 'var(--agent-violet)' : 'var(--surface-muted)',
                color: step.done ? '#fff' : 'var(--subtle)',
              }}
            >
              {i + 1}
            </div>
            <span className="text-xs flex-1" style={{ color: step.done ? 'var(--ink)' : 'var(--subtle)' }}>
              {step.label}
            </span>
            {step.done && (
              <span className="text-xs tabular" style={{ color: 'var(--subtle)' }}>
                {relativeTime(step.ts)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tx hashes */}
      {record.txHash && (
        <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--surface-muted)' }}>
          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Deposit Tx</div>
          <a
            href={buildTxExplorerUrl(ARC_TESTNET_ID, record.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-xs flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            <ExternalLink size={11} />
            {shortAddr(record.txHash)}
          </a>
        </div>
      )}
      {record.releaseTxHash && (
        <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--surface-muted)' }}>
          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Release Tx</div>
          <a
            href={buildTxExplorerUrl(ARC_TESTNET_ID, record.releaseTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-xs flex items-center gap-1 hover:underline"
            style={{ color: 'var(--success)' }}
          >
            <ExternalLink size={11} />
            {shortAddr(record.releaseTxHash)}
          </a>
        </div>
      )}

      {/* Actions */}
      {record.status === 'funded' && (
        <div className="space-y-2">
          <button
            onClick={() => void simulate('release')}
            disabled={!!loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: loading ? 'var(--surface-muted)' : 'var(--success)',
              color: loading ? 'var(--muted)' : '#0c1929',
            }}
          >
            <Unlock size={14} />
            {loading === 'release' ? 'Releasing...' : 'Release Funds to Payee (Demo)'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => void simulate('refund')}
              disabled={!!loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(172,198,233,0.10)', color: 'var(--accent)' }}
            >
              {loading === 'refund' ? 'Refunding...' : 'Refund to Payer (Demo)'}
            </button>
            <button
              onClick={() => void simulate('dispute')}
              disabled={!!loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(232,98,122,0.10)', color: 'var(--danger)' }}
            >
              {loading === 'dispute' ? 'Opening...' : 'Open Dispute (Demo)'}
            </button>
          </div>
        </div>
      )}

      {record.status === 'disputed' && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: 'rgba(232,98,122,0.08)', color: 'var(--danger)' }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={14} />
            Dispute in progress
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Funds are locked until a resolution is reached. A human or DAO arbiter can release or refund.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => void simulate('release')}
              disabled={!!loading}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(95,201,138,0.12)', color: 'var(--success)' }}
            >
              Arbiter: Release (Demo)
            </button>
            <button
              onClick={() => void simulate('refund')}
              disabled={!!loading}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(172,198,233,0.10)', color: 'var(--accent)' }}
            >
              Arbiter: Refund (Demo)
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function EscrowView() {
  const { escrows } = useAgentPayStore();
  const [selected, setSelected] = useState<EscrowRecord | null>(escrows[0] ?? null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'funded' | 'released' | 'disputed'>('all');

  const filtered = escrows.filter((e) => filterStatus === 'all' || e.status === filterStatus);

  const totalFunded = escrows.filter((e) => e.status === 'funded').reduce((s, e) => s + e.amount, 0n);
  const totalReleased = escrows.filter((e) => e.status === 'released').reduce((s, e) => s + e.amount, 0n);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Escrow</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          USDC held trustlessly until task completion. Simulated now — deploy the smart contract to go onchain.
        </p>
      </div>

      {/* Summary row */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {[
          { label: 'Currently Locked', value: totalFunded, color: 'var(--agent-amber)' },
          { label: 'Total Released', value: totalReleased, color: 'var(--success)' },
          { label: 'Active Disputes', value: BigInt(escrows.filter((e) => e.status === 'disputed').length) * 1_000_000n, color: 'var(--danger)', isCount: true },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <div className="text-xs" style={{ color: 'var(--subtle)' }}>{s.label}</div>
            {s.isCount ? (
              <div className="display text-xl font-bold mt-1 tabular" style={{ color: s.color, letterSpacing: '-0.02em' }}>
                {escrows.filter((e) => e.status === 'disputed').length}
              </div>
            ) : (
              <UsdcAmount raw={s.value} size="md" showIcon={false} className="mt-1" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'funded', 'released', 'disputed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filterStatus === f ? 'var(--surface-strong)' : 'var(--surface)',
              color: filterStatus === f ? 'var(--ink)' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* List */}
        <motion.div
          className="md:col-span-2 space-y-2"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
        >
          {filtered.length === 0 && (
            <div className="text-sm py-8 text-center" style={{ color: 'var(--subtle)' }}>No escrows match this filter.</div>
          )}
          {filtered.map((e) => (
            <EscrowCard key={e.id} record={e} isSelected={selected?.id === e.id} onClick={() => setSelected(e)} />
          ))}
        </motion.div>

        {/* Detail */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <EscrowDetail key={selected.id} record={selected} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
                style={{ color: 'var(--subtle)' }}
              >
                Select an escrow to manage it
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deploy contract CTA */}
      <motion.div
        className="glass rounded-xl p-5 flex items-start gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ borderColor: 'rgba(155,126,255,0.25)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(155,126,255,0.12)', color: 'var(--agent-violet)' }}
        >
          <ShieldCheck size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Deploy AgentPayEscrow to Arc Testnet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            The <span className="mono">AgentPayEscrow.sol</span> contract is ready in <span className="mono">contracts/</span>. Deploy it to make escrow trustless and onchain. Once deployed, update <span className="mono">VITE_ESCROW_ADDRESS</span> in <span className="mono">.env</span>.
          </p>
        </div>
        <div
          className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(155,126,255,0.12)', color: 'var(--agent-violet)' }}
        >
          Ready to Deploy
        </div>
      </motion.div>
    </div>
  );
}
