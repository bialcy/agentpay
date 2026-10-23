import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { Bot, Briefcase, ShieldCheck, TrendingUp, Activity, ArrowUpRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAgentPayStore } from '@/store/agentpay';
import { useUsdcBalance } from '@/lib/onchain';
import { AgentAvatar } from './shared/AgentAvatar';
import { StatusBadge } from './shared/StatusBadge';
import { UsdcAmount } from './shared/UsdcAmount';
import { relativeTime } from '@/lib/utils';
import type { View } from '@/App';

interface DashboardProps {
  onNavigate: (v: View) => void;
}

const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function Dashboard({ onNavigate }: DashboardProps) {
  const { address, isConnected } = useAccount();
  const { raw: balance, isLoading: balLoading } = useUsdcBalance(
    isConnected ? (address) : undefined,
  );
  const { agents, tasks, payments, escrows } = useAgentPayStore();

  const openTasks = tasks.filter((t) => t.status === 'open').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalEscrowed = escrows
    .filter((e) => e.status === 'funded')
    .reduce((acc, e) => acc + e.amount, 0n);
  const onlineAgents = agents.filter((a) => a.isOnline).length;

  const recentTasks = tasks.slice(0, 4);
  const recentPayments = payments.slice(0, 3);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-6xl mx-auto space-y-6">
      {/* Accent strip */}
      <div className="accent-strip w-full rounded-full" />

      {/* Hero section */}
      <motion.div
        className="glass-strong rounded-2xl p-5 md:p-6"
        variants={fade}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--agent-teal)' }}>
              <Zap size={12} fill="currentColor" />
              Arc Testnet
            </div>
            <h1 className="display text-2xl md:text-3xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              AgentPay Economy
            </h1>
            <p className="text-sm max-w-md" style={{ color: 'var(--muted)' }}>
              Autonomous AI agents discover services, complete tasks, and settle payments in USDC on Arc.
            </p>
          </div>

          {/* Live USDC balance or connect prompt */}
          {isConnected ? (
            <div
              className="glass rounded-xl p-4 flex flex-col gap-1 min-w-[180px]"
              style={{ border: '1px solid rgba(172,198,233,0.18)' }}
            >
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
                Your Balance
              </span>
              {balLoading ? (
                <div className="shimmer h-7 w-28 rounded-lg mt-1" />
              ) : (
                <UsdcAmount raw={balance} size="lg" />
              )}
              <span className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
                Live on Arc Testnet
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect to see your balance</p>
              <ConnectKitButton />
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          { icon: <Bot size={18} />, label: 'Agents Online', value: `${onlineAgents}/${agents.length}`, color: 'var(--agent-teal)', onClick: () => onNavigate('agents') },
          { icon: <Briefcase size={18} />, label: 'Open Tasks', value: `${openTasks}`, color: 'var(--accent)', onClick: () => onNavigate('marketplace') },
          { icon: <Activity size={18} />, label: 'In Progress', value: `${inProgressTasks}`, color: 'var(--agent-amber)', onClick: () => onNavigate('marketplace') },
          { icon: <ShieldCheck size={18} />, label: 'Escrowed', value: `$${(Number(totalEscrowed) / 1e6).toFixed(2)}`, color: 'var(--agent-violet)', onClick: () => onNavigate('escrow') },
        ].map((stat) => (
          <motion.button
            key={stat.label}
            variants={fade}
            onClick={stat.onClick}
            className="glass rounded-xl p-4 flex flex-col gap-2 text-left hover:brightness-110 transition-all duration-150 group"
          >
            <div className="flex items-center justify-between">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--subtle)' }} />
            </div>
            <div className="display text-2xl font-bold tabular" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Two column: tasks + payments */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <motion.div
          className="glass rounded-xl overflow-hidden"
          variants={fade}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Recent Tasks</span>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              View all
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentTasks.map((task) => {
              const poster = agents.find((a) => a.id === task.posterId);
              return (
                <div key={task.id} className="px-4 py-3 flex items-start gap-3">
                  {poster && <AgentAvatar name={poster.name} type={poster.type} size={32} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={task.status} size="sm" />
                      <UsdcAmount raw={task.price} size="xs" showIcon={false} />
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--subtle)' }}>
                    {relativeTime(task.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
              <TrendingUp size={12} />
              {completedTasks} tasks completed total
            </div>
          </div>
        </motion.div>

        {/* Recent payments */}
        <motion.div
          className="glass rounded-xl overflow-hidden"
          variants={fade}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.28 }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Payment Activity</span>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              View all
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentPayments.map((pay) => (
              <div key={pay.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(172,198,233,0.10)', color: 'var(--accent)' }}
                >
                  <ArrowUpRight size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{pay.description}</p>
                  <StatusBadge status={pay.status} size="sm" />
                </div>
                <UsdcAmount raw={pay.amount} size="sm" showIcon={false} />
              </div>
            ))}
          </div>
          <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              All payments settled in USDC on Arc Testnet
            </div>
          </div>
        </motion.div>
      </div>

      {/* Network info banner */}
      <motion.div
        className="glass rounded-xl p-4 flex items-start gap-3"
        variants={fade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.35 }}
        style={{ borderColor: 'rgba(56,201,185,0.2)', borderWidth: 1 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(56,201,185,0.12)', color: 'var(--agent-teal)' }}
        >
          <Zap size={16} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Running on Arc Testnet — USDC as gas
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            On Arc, USDC is the native gas token. Every transaction, escrow, and payment uses USDC with sub-second finality. No ETH needed.
          </p>
        </div>
        <div
          className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded-lg"
          style={{ background: 'rgba(56,201,185,0.12)', color: 'var(--agent-teal)' }}
        >
          Test Mode
        </div>
      </motion.div>
    </div>
  );
}
