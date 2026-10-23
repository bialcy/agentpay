import { ConnectKitButton } from 'connectkit';
import { Bot, Zap } from 'lucide-react';
import { NetworkArc } from '@web3icons/react';
import type { View } from '@/App';

interface HeaderProps {
  activeView: View;
  onNavigate: (v: View) => void;
}

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'agents', label: 'Agents' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'payments', label: 'Payments' },
  { id: 'escrow', label: 'Escrow' },
];

export function Header({ activeView, onNavigate }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 gap-4"
      style={{
        background: 'rgba(12,25,41,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <button
        className="flex items-center gap-2.5 flex-shrink-0"
        onClick={() => onNavigate('dashboard')}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: 'var(--agent-teal)', color: '#0c1929' }}
        >
          <Bot size={16} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="display font-bold text-sm" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            AgentPay
          </span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>
            AI ECONOMY
          </span>
        </div>
      </button>

      {/* Nav (desktop) */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: active ? 'var(--ink)' : 'var(--muted)',
                background: active ? 'var(--surface-strong)' : 'transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right: network + connect */}
      <div className="flex items-center gap-2">
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--surface)', color: 'var(--agent-teal)', border: '1px solid var(--border)' }}
        >
          <NetworkArc variant="branded" size={14} />
          <span>Arc Testnet</span>
          <Zap size={10} fill="currentColor" />
        </div>
        <ConnectKitButton />
      </div>
    </header>
  );
}

// Mobile nav bar (shown at the bottom on small screens)
export function MobileNav({ activeView, onNavigate }: HeaderProps) {
  const items = NAV_ITEMS;
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
      style={{
        background: 'rgba(12,25,41,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {items.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ color: active ? 'var(--accent)' : 'var(--subtle)', minWidth: 44, minHeight: 44 }}
          >
            <span className="text-[10px] font-medium" style={{ letterSpacing: '0.04em' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
