import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Star, CheckCircle, Zap, Activity, Search, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentPayStore, type Agent } from '@/store/agentpay';
import { useUsdcBalance } from '@/lib/onchain';
import { AgentAvatar } from './shared/AgentAvatar';
import { UsdcAmount } from './shared/UsdcAmount';
import { shortAddr } from '@/lib/utils';

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function ReputationBar({ score }: { score: number }) {
  const color =
    score >= 90 ? 'var(--success)' : score >= 75 ? 'var(--agent-teal)' : score >= 60 ? 'var(--agent-amber)' : 'var(--danger)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs tabular font-semibold" style={{ color }}>{score}</span>
    </div>
  );
}

function AgentCard({ agent, isSelected, onClick }: { agent: Agent; isSelected: boolean; onClick: () => void }) {
  return (
    <motion.button
      variants={fade}
      onClick={onClick}
      className="w-full text-left glass rounded-xl p-4 transition-all duration-150 hover:brightness-110"
      style={{
        border: isSelected ? '1.5px solid var(--agent-teal)' : '1px solid var(--border)',
        background: isSelected ? 'rgba(56,201,185,0.06)' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar name={agent.name} type={agent.type} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold display truncate" style={{ color: 'var(--ink)' }}>{agent.name}</span>
            {agent.type === 'ai' && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(56,201,185,0.12)', color: 'var(--agent-teal)' }}
              >
                AI
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{agent.bio}</p>
          <div className="mt-2">
            <ReputationBar score={agent.reputationScore} />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--subtle)' }}>
            <span className="flex items-center gap-1">
              <CheckCircle size={11} />
              {agent.completedTasks} tasks
            </span>
            <span className="flex items-center gap-1">
              <Star size={11} />
              {agent.successRate}%
            </span>
            <span className="flex items-center gap-1">
              <Activity size={11} />
              {agent.isOnline ? (
                <span style={{ color: 'var(--success)' }}>Online</span>
              ) : (
                <span>Offline</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  const { address } = useAccount();
  const { raw: agentBalance, isLoading: balLoading } = useUsdcBalance(agent.walletAddress as `0x${string}`);

  return (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-strong rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <AgentAvatar name={agent.name} type={agent.type} size={64} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {agent.name}
            </h2>
            {agent.type === 'ai' ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(56,201,185,0.12)', color: 'var(--agent-teal)' }}
              >
                <Bot size={11} /> AI Agent
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(172,198,233,0.12)', color: 'var(--accent)' }}
              >
                <User size={11} /> Human
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{agent.bio}</p>
          <div className="mono text-xs mt-2 px-2 py-1 rounded-lg inline-block" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
            {shortAddr(agent.walletAddress)}
          </div>
        </div>
      </div>

      {/* Reputation */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--muted)' }}>
          <span>Reputation Score</span>
          <span className="tabular">{agent.reputationScore}/100</span>
        </div>
        <ReputationBar score={agent.reputationScore} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tasks Done', value: agent.completedTasks.toLocaleString() },
          { label: 'Success Rate', value: `${agent.successRate}%` },
          { label: 'Status', value: agent.isOnline ? 'Online' : 'Offline', highlight: agent.isOnline },
          { label: 'Type', value: agent.type === 'ai' ? 'AI Agent' : 'Human' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
            <div className="text-xs" style={{ color: 'var(--subtle)' }}>{s.label}</div>
            <div
              className="text-sm font-semibold tabular mt-0.5"
              style={{ color: s.highlight ? 'var(--success)' : 'var(--ink)' }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Balance (live) */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--surface-muted)' }}>
        <div>
          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Wallet Balance (Arc Testnet)</div>
          {balLoading ? (
            <div className="shimmer h-5 w-24 rounded mt-1" />
          ) : (
            <UsdcAmount raw={agentBalance} size="md" className="mt-0.5" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--agent-teal)' }}>
          <Zap size={11} fill="currentColor" />
          Live
        </div>
      </div>

      {/* Total earned */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Lifetime Earned (demo)</div>
          <UsdcAmount raw={agent.totalEarned} size="md" className="mt-0.5" />
        </div>
        <CheckCircle size={18} style={{ color: 'var(--success)' }} />
      </div>

      {/* Skills */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Is self */}
      {address && agent.walletAddress.toLowerCase() === address.toLowerCase() && (
        <div
          className="text-xs font-medium px-3 py-2 rounded-lg text-center"
          style={{ background: 'rgba(172,198,233,0.10)', color: 'var(--accent)' }}
        >
          This is your agent profile
        </div>
      )}
    </motion.div>
  );
}

export function AgentProfiles() {
  const { agents } = useAgentPayStore();
  const [selected, setSelected] = useState<Agent | null>(agents[0] ?? null);
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all');
  const [search, setSearch] = useState('');

  const filtered = agents.filter((a) => {
    const matchType = filter === 'all' || a.type === filter;
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Agent Profiles</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Discover autonomous AI agents and humans available to complete tasks on AgentPay.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--subtle)' }} />
          <input
            type="text"
            placeholder="Search agents or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
          />
        </div>
        {(['all', 'ai', 'human'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: filter === f ? 'var(--surface-strong)' : 'var(--surface)',
              color: filter === f ? 'var(--ink)' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {f === 'all' ? 'All' : f === 'ai' ? 'AI Agents' : 'Humans'}
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
            <div className="text-sm py-8 text-center" style={{ color: 'var(--subtle)' }}>
              No agents match your search.
            </div>
          )}
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selected?.id === agent.id}
              onClick={() => setSelected(agent)}
            />
          ))}
        </motion.div>

        {/* Detail panel */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <AgentDetail key={selected.id} agent={selected} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
                style={{ color: 'var(--subtle)' }}
              >
                Select an agent to view their profile
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
