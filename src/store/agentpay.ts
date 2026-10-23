/**
 * AgentPay — in-memory data store + types.
 * Real escrow/payment state is onchain; profile/task data is stored here
 * as a prototype foundation (replace with a backend or smart contract registry).
 */
import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AgentType = 'ai' | 'human';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
export type EscrowStatus = 'funded' | 'released' | 'refunded' | 'disputed';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  walletAddress: string;
  avatar?: string;
  bio: string;
  skills: string[];
  reputationScore: number;   // 0–100
  completedTasks: number;
  totalEarned: bigint;       // raw USDC (6 decimals)
  successRate: number;       // 0–100
  createdAt: number;
  isOnline: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  price: bigint;              // raw USDC (6 decimals)
  currency: 'USDC';
  status: TaskStatus;
  posterId: string;           // Agent.id
  assigneeId?: string;        // Agent.id
  escrowId?: string;          // EscrowRecord.id — set when funded
  submittedWork?: string;
  feedback?: string;
  rating?: number;            // 1–5
  createdAt: number;
  updatedAt: number;
  deadline?: number;
  tags: string[];
}

export interface EscrowRecord {
  id: string;
  taskId: string;
  payerId: string;
  payeeId: string;
  amount: bigint;             // raw USDC
  status: EscrowStatus;
  txHash?: string;
  releaseTxHash?: string;
  onchain: boolean;           // true = real contract; false = simulated
  createdAt: number;
  updatedAt: number;
}

export interface PaymentRecord {
  id: string;
  from: string;               // wallet address
  to: string;                 // wallet address
  amount: bigint;             // raw USDC
  status: PaymentStatus;
  txHash?: string;
  description: string;
  taskId?: string;
  createdAt: number;
}

// ─── Seed data ──────────────────────────────────────────────────────────────

const NOW = Date.now();
const H = 3_600_000;

const SEED_AGENTS: Agent[] = [
  {
    id: 'agent-alpha',
    name: 'Alpha-7 Research',
    type: 'ai',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    bio: 'Specialized in deep-web research, data synthesis, and report generation. Powered by a custom LLM pipeline.',
    skills: ['Research', 'Data Analysis', 'Report Writing', 'Web Scraping'],
    reputationScore: 94,
    completedTasks: 312,
    totalEarned: 48_250_000n,  // $48.25 USDC
    successRate: 97,
    createdAt: NOW - 30 * 24 * H,
    isOnline: true,
  },
  {
    id: 'agent-beta',
    name: 'Beta Coder',
    type: 'ai',
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    bio: 'Full-stack code generation, debugging, and refactoring. Specialized in Solidity and TypeScript.',
    skills: ['Solidity', 'TypeScript', 'React', 'Smart Contracts', 'Code Review'],
    reputationScore: 89,
    completedTasks: 178,
    totalEarned: 122_400_000n,  // $122.40 USDC
    successRate: 92,
    createdAt: NOW - 20 * 24 * H,
    isOnline: true,
  },
  {
    id: 'agent-gamma',
    name: 'Gamma Translate',
    type: 'ai',
    walletAddress: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    bio: 'Real-time translation and localization across 40+ languages. Optimized for technical documentation.',
    skills: ['Translation', 'Localization', 'Technical Writing', 'NLP'],
    reputationScore: 78,
    completedTasks: 94,
    totalEarned: 31_800_000n,
    successRate: 88,
    createdAt: NOW - 10 * 24 * H,
    isOnline: false,
  },
  {
    id: 'agent-delta',
    name: 'Delta Finance',
    type: 'ai',
    walletAddress: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    bio: 'DeFi analytics, portfolio risk assessment, and yield strategy optimization.',
    skills: ['DeFi Analysis', 'Risk Modeling', 'Portfolio Optimization', 'Tokenomics'],
    reputationScore: 86,
    completedTasks: 241,
    totalEarned: 890_120_000n,  // $890.12
    successRate: 95,
    createdAt: NOW - 45 * 24 * H,
    isOnline: true,
  },
  {
    id: 'user-human-1',
    name: 'Priya Sharma',
    type: 'human',
    walletAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835Cb2',
    bio: 'Product designer building at the intersection of AI and finance. Looking for autonomous agents to power my startup.',
    skills: ['UI/UX Design', 'Product Strategy', 'Figma', 'Web3'],
    reputationScore: 72,
    completedTasks: 12,
    totalEarned: 8_500_000n,
    successRate: 83,
    createdAt: NOW - 60 * 24 * H,
    isOnline: true,
  },
];

const SEED_TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Analyze DeFi protocol security report',
    description: 'Review a 40-page DeFi audit report and summarize critical vulnerabilities, attack vectors, and mitigation recommendations in under 2 pages.',
    category: 'Research',
    price: 5_000_000n,  // $5 USDC
    currency: 'USDC',
    status: 'open',
    posterId: 'user-human-1',
    createdAt: NOW - 2 * H,
    updatedAt: NOW - 2 * H,
    tags: ['DeFi', 'Security', 'Research'],
  },
  {
    id: 'task-002',
    title: 'Write ERC-4337 paymaster contract',
    description: 'Implement a USDC-funded ERC-4337 paymaster in Solidity with gas abstraction support. Include unit tests using Foundry.',
    category: 'Development',
    price: 50_000_000n,  // $50 USDC
    currency: 'USDC',
    status: 'in_progress',
    posterId: 'user-human-1',
    assigneeId: 'agent-beta',
    createdAt: NOW - 6 * H,
    updatedAt: NOW - 1 * H,
    tags: ['Solidity', 'ERC-4337', 'Smart Contracts'],
  },
  {
    id: 'task-003',
    title: 'Translate whitepaper to Japanese',
    description: 'Translate a 12-page Arc protocol whitepaper from English to Japanese, maintaining technical accuracy and proper financial terminology.',
    category: 'Translation',
    price: 20_000_000n,  // $20 USDC
    currency: 'USDC',
    status: 'completed',
    posterId: 'agent-delta',
    assigneeId: 'agent-gamma',
    feedback: 'Excellent translation quality. Fast delivery.',
    rating: 5,
    createdAt: NOW - 3 * 24 * H,
    updatedAt: NOW - 1 * 24 * H,
    tags: ['Translation', 'Japanese', 'Whitepaper'],
  },
  {
    id: 'task-004',
    title: 'USDC yield strategy for treasury',
    description: 'Assess top 5 USDC yield protocols by risk-adjusted APY and recommend an allocation strategy for a $10k treasury.',
    category: 'Finance',
    price: 30_000_000n,  // $30 USDC
    currency: 'USDC',
    status: 'open',
    posterId: 'agent-alpha',
    createdAt: NOW - 30 * 60 * 1000,
    updatedAt: NOW - 30 * 60 * 1000,
    tags: ['DeFi', 'Yield', 'Treasury'],
  },
  {
    id: 'task-005',
    title: 'Market research: AI agent economy',
    description: 'Identify top 10 emerging use cases for autonomous AI agents in financial services. Include competitive landscape and TAM estimation.',
    category: 'Research',
    price: 15_000_000n,  // $15 USDC
    currency: 'USDC',
    status: 'open',
    posterId: 'agent-delta',
    createdAt: NOW - 45 * 60 * 1000,
    updatedAt: NOW - 45 * 60 * 1000,
    tags: ['Research', 'AI', 'Market Analysis'],
  },
  {
    id: 'task-006',
    title: 'Solidity gas optimization review',
    description: 'Audit a 500-line Solidity contract for gas inefficiencies. Provide optimized code snippets and a summary report.',
    category: 'Development',
    price: 25_000_000n,  // $25 USDC
    currency: 'USDC',
    status: 'disputed',
    posterId: 'agent-alpha',
    assigneeId: 'agent-beta',
    createdAt: NOW - 5 * 24 * H,
    updatedAt: NOW - 2 * 24 * H,
    tags: ['Solidity', 'Gas', 'Optimization'],
  },
];

const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    from: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835Cb2',
    to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    amount: 20_000_000n,
    status: 'confirmed',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    description: 'Payment for whitepaper translation',
    taskId: 'task-003',
    createdAt: NOW - 1 * 24 * H,
  },
  {
    id: 'pay-002',
    from: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835Cb2',
    to: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    amount: 25_000_000n,
    status: 'pending',
    description: 'Escrow deposit for ERC-4337 paymaster',
    taskId: 'task-002',
    createdAt: NOW - 6 * H,
  },
  {
    id: 'pay-003',
    from: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    to: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    amount: 8_000_000n,
    status: 'confirmed',
    txHash: '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    description: 'API data purchase: market intelligence feed',
    createdAt: NOW - 3 * H,
  },
];

const SEED_ESCROWS: EscrowRecord[] = [
  {
    id: 'escrow-001',
    taskId: 'task-002',
    payerId: 'user-human-1',
    payeeId: 'agent-beta',
    amount: 50_000_000n,
    status: 'funded',
    txHash: undefined,
    onchain: false,
    createdAt: NOW - 6 * H,
    updatedAt: NOW - 6 * H,
  },
  {
    id: 'escrow-002',
    taskId: 'task-003',
    payerId: 'agent-delta',
    payeeId: 'agent-gamma',
    amount: 20_000_000n,
    status: 'released',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    releaseTxHash: '0xfeedf00ddeadbeef1234567890abcdef1234567890abcdef1234567890abcdef',
    onchain: false,
    createdAt: NOW - 3 * 24 * H,
    updatedAt: NOW - 1 * 24 * H,
  },
  {
    id: 'escrow-003',
    taskId: 'task-006',
    payerId: 'agent-alpha',
    payeeId: 'agent-beta',
    amount: 25_000_000n,
    status: 'disputed',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    onchain: false,
    createdAt: NOW - 5 * 24 * H,
    updatedAt: NOW - 2 * 24 * H,
  },
];

// ─── Store ───────────────────────────────────────────────────────────────────

interface AgentPayState {
  agents: Agent[];
  tasks: Task[];
  payments: PaymentRecord[];
  escrows: EscrowRecord[];

  // Actions
  addAgent: (agent: Agent) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  acceptTask: (taskId: string, agentId: string) => void;
  submitWork: (taskId: string, work: string) => void;
  approveWork: (taskId: string, rating: number, feedback: string) => void;
  disputeTask: (taskId: string) => void;
  addPayment: (payment: PaymentRecord) => void;
  addEscrow: (escrow: EscrowRecord) => void;
  updateEscrow: (id: string, patch: Partial<EscrowRecord>) => void;
  releaseEscrow: (escrowId: string, txHash?: string) => void;
  refundEscrow: (escrowId: string, txHash?: string) => void;
}

export const useAgentPayStore = create<AgentPayState>((set) => ({
  agents: SEED_AGENTS,
  tasks: SEED_TASKS,
  payments: SEED_PAYMENTS,
  escrows: SEED_ESCROWS,

  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),

  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t,
      ),
    })),

  acceptTask: (taskId, agentId) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'in_progress', assigneeId: agentId, updatedAt: Date.now() }
          : t,
      ),
    })),

  submitWork: (taskId, work) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, submittedWork: work, updatedAt: Date.now() } : t,
      ),
    })),

  approveWork: (taskId, rating, feedback) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed', rating, feedback, updatedAt: Date.now() }
          : t,
      ),
    })),

  disputeTask: (taskId) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'disputed', updatedAt: Date.now() } : t,
      ),
    })),

  addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),

  addEscrow: (escrow) => set((s) => ({ escrows: [escrow, ...s.escrows] })),

  updateEscrow: (id, patch) =>
    set((s) => ({
      escrows: s.escrows.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
      ),
    })),

  releaseEscrow: (escrowId, txHash) =>
    set((s) => ({
      escrows: s.escrows.map((e) =>
        e.id === escrowId
          ? { ...e, status: 'released', releaseTxHash: txHash, updatedAt: Date.now() }
          : e,
      ),
    })),

  refundEscrow: (escrowId, txHash) =>
    set((s) => ({
      escrows: s.escrows.map((e) =>
        e.id === escrowId
          ? { ...e, status: 'refunded', releaseTxHash: txHash, updatedAt: Date.now() }
          : e,
      ),
    })),
}));
