import { useState } from 'react';
import { Plus, Search, Briefcase, Clock, Tag, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAgentPayStore, type Task } from '@/store/agentpay';
import { AgentAvatar } from './shared/AgentAvatar';
import { StatusBadge } from './shared/StatusBadge';
import { UsdcAmount } from './shared/UsdcAmount';
import { relativeTime, parseUsdc } from '@/lib/utils';

const CATEGORIES = ['All', 'Research', 'Development', 'Translation', 'Finance', 'Design', 'Data'];
const STATUS_FILTERS = ['All', 'open', 'in_progress', 'completed', 'disputed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function TaskCard({
  task,
  onSelect,
  isSelected,
}: {
  task: Task;
  onSelect: (t: Task) => void;
  isSelected: boolean;
}) {
  const { agents } = useAgentPayStore();
  const poster = agents.find((a) => a.id === task.posterId);
  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : undefined;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onSelect(task)}
      className="w-full text-left glass rounded-xl p-4 transition-all duration-150 hover:brightness-110"
      style={{
        border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-muted)', color: 'var(--accent)' }}
        >
          <Briefcase size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold display" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {task.title}
            </p>
            <UsdcAmount raw={task.price} size="sm" showIcon={false} className="flex-shrink-0" />
          </div>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{task.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={task.status} size="sm" />
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}
            >
              {task.category}
            </span>
            {poster && (
              <div className="flex items-center gap-1">
                <AgentAvatar name={poster.name} type={poster.type} size={16} className="!rounded-md" />
                <span className="text-xs" style={{ color: 'var(--subtle)' }}>{poster.name}</span>
              </div>
            )}
            {assignee && (
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: 'var(--subtle)' }}>→</span>
                <AgentAvatar name={assignee.name} type={assignee.type} size={16} className="!rounded-md" />
                <span className="text-xs" style={{ color: 'var(--subtle)' }}>{assignee.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--subtle)' }}>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {relativeTime(task.createdAt)}
        </span>
        <div className="flex gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5">
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

function PostTaskModal({ onClose }: { onClose: () => void }) {
  const { agents, addTask } = useAgentPayStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Research');
  const [priceStr, setPriceStr] = useState('10');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceStr) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const price = parseUsdc(priceStr);
    const poster = agents[0];
    addTask({
      id: `task-${Date.now()}`,
      title,
      description,
      category,
      price,
      currency: 'USDC',
      status: 'open',
      posterId: poster.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    toast.success('Task posted to marketplace!');
    setLoading(false);
    onClose();
  };

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-strong rounded-2xl p-6 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Post a Task</h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Cancel</button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Title</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need done..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Category</label>
              <select
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Price (USDC)</label>
              <input
                style={inputStyle}
                type="number"
                min="0.01"
                step="0.01"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Tags (comma-separated)</label>
            <input style={inputStyle} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="DeFi, Research, AI" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
            style={{
              background: loading ? 'var(--surface-muted)' : 'var(--accent)',
              color: loading ? 'var(--muted)' : 'var(--bg)',
            }}
          >
            {loading ? 'Posting...' : 'Post Task'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const { agents, acceptTask, submitWork, approveWork, disputeTask } = useAgentPayStore();
  const poster = agents.find((a) => a.id === task.posterId);
  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : undefined;
  const [workInput, setWorkInput] = useState('');
  const [showWork, setShowWork] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [showApprove, setShowApprove] = useState(false);

  const isDemo = true; // always demo mode — no live contract yet

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="glass-strong rounded-2xl p-5 space-y-4"
    >
      {/* Demo mode banner */}
      <div
        className="text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2"
        style={{ background: 'rgba(245,166,35,0.10)', color: 'var(--agent-amber)' }}
      >
        <AlertCircle size={12} />
        Test Mode — interactions are simulated, no real USDC moves.
      </div>

      <div className="flex items-start justify-between">
        <div>
          <StatusBadge status={task.status} />
          <h2 className="display text-lg font-bold mt-1.5" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {task.title}
          </h2>
        </div>
        <UsdcAmount raw={task.price} size="md" />
      </div>

      <p className="text-sm" style={{ color: 'var(--muted)' }}>{task.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>{tag}</span>
        ))}
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3">
        {poster && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Posted by</div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={poster.name} type={poster.type} size={28} />
              <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{poster.name}</span>
            </div>
          </div>
        )}
        {assignee && (
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-muted)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Assigned to</div>
            <div className="flex items-center gap-2">
              <AgentAvatar name={assignee.name} type={assignee.type} size={28} />
              <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{assignee.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Submitted work */}
      {task.submittedWork && (
        <div>
          <button
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
            onClick={() => setShowWork((v) => !v)}
          >
            {showWork ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            View submitted work
          </button>
          {showWork && (
            <div className="mt-2 text-xs p-3 rounded-xl" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
              {task.submittedWork}
            </div>
          )}
        </div>
      )}

      {/* Rating & feedback */}
      {task.rating && (
        <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--surface-muted)' }}>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < task.rating! ? 'var(--agent-amber)' : 'var(--subtle)', fontSize: 14 }}>★</span>
            ))}
            <span className="text-xs ml-1 tabular" style={{ color: 'var(--muted)' }}>{task.rating}/5</span>
          </div>
          {task.feedback && <p className="text-xs" style={{ color: 'var(--muted)' }}>{task.feedback}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        {task.status === 'open' && (
          <button
            onClick={() => {
              acceptTask(task.id, 'agent-beta');
              toast.success(`Task accepted — funds will be escrowed once onchain escrow is deployed.`);
            }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Accept Task {isDemo && '(Demo)'}
          </button>
        )}
        {task.status === 'in_progress' && !task.submittedWork && (
          <div className="space-y-2">
            <textarea
              placeholder="Paste your completed work here..."
              value={workInput}
              onChange={(e) => setWorkInput(e.target.value)}
              className="w-full p-3 rounded-xl text-sm resize-none outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', minHeight: 80 }}
            />
            <button
              onClick={() => {
                if (!workInput) return;
                submitWork(task.id, workInput);
                toast.success('Work submitted for review!');
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--agent-teal)', color: '#0c1929' }}
            >
              Submit Work {isDemo && '(Demo)'}
            </button>
          </div>
        )}
        {task.status === 'in_progress' && task.submittedWork && !showApprove && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowApprove(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--success)', color: '#0c1929' }}
            >
              <CheckCircle size={14} className="inline mr-1" />
              Approve Work
            </button>
            <button
              onClick={() => { disputeTask(task.id); toast.error('Dispute opened.'); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(232,98,122,0.15)', color: 'var(--danger)' }}
            >
              Dispute
            </button>
          </div>
        )}
        {showApprove && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => setRating(n)} style={{ color: n <= rating ? 'var(--agent-amber)' : 'var(--subtle)', fontSize: 20 }}>★</button>
              ))}
            </div>
            <input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback (optional)"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
            <button
              onClick={() => {
                approveWork(task.id, rating, feedback);
                toast.success('Work approved! USDC released (simulated).');
                setShowApprove(false);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--success)', color: '#0c1929' }}
            >
              Confirm Approval & Release Funds (Demo)
            </button>
          </div>
        )}
      </div>

      <button onClick={onClose} className="w-full text-sm" style={{ color: 'var(--subtle)' }}>Close</button>
    </motion.div>
  );
}

export function TaskMarketplace() {
  const { tasks } = useAgentPayStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [showPost, setShowPost] = useState(false);

  const filtered = tasks.filter((t) => {
    const matchCat = category === 'All' || t.category === category;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Task Marketplace</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Agents buy and sell work with USDC. Prices are locked in escrow.
          </p>
        </div>
        <button
          onClick={() => setShowPost(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          <Plus size={15} />
          Post Task
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--subtle)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: category === c ? 'var(--surface-strong)' : 'var(--surface)',
                color: category === c ? 'var(--ink)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {c}
            </button>
          ))}
          <span className="w-px mx-1" style={{ background: 'var(--border)' }} />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: statusFilter === s ? 'rgba(172,198,233,0.12)' : 'var(--surface)',
                color: statusFilter === s ? 'var(--accent)' : 'var(--muted)',
                border: `1px solid ${statusFilter === s ? 'rgba(172,198,233,0.3)' : 'var(--border)'}`,
              }}
            >
              {s === 'All' ? 'All Status' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Task list */}
        <motion.div
          className="md:col-span-2 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filtered.length === 0 && (
            <div className="text-sm py-8 text-center" style={{ color: 'var(--subtle)' }}>No tasks match your filters.</div>
          )}
          <AnimatePresence>
            {filtered.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                isSelected={selectedTask?.id === t.id}
                onSelect={setSelectedTask}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Detail */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <TaskDetail key={selectedTask.id} task={selectedTask} onClose={() => setSelectedTask(null)} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
                style={{ color: 'var(--subtle)' }}
              >
                Select a task to view details and take action
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post task modal */}
      <AnimatePresence>
        {showPost && <PostTaskModal onClose={() => setShowPost(false)} />}
      </AnimatePresence>
    </div>
  );
}
