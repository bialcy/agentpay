import { useState } from 'react';
import { Header, MobileNav } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AgentProfiles } from './components/AgentProfiles';
import { TaskMarketplace } from './components/TaskMarketplace';
import { PaymentsHistory } from './components/PaymentsHistory';
import { EscrowView } from './components/EscrowView';

export type View = 'dashboard' | 'agents' | 'marketplace' | 'payments' | 'escrow';

export default function App() {
  const [view, setView] = useState<View>('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNavigate={setView} />;
      case 'agents': return <AgentProfiles />;
      case 'marketplace': return <TaskMarketplace />;
      case 'payments': return <PaymentsHistory />;
      case 'escrow': return <EscrowView />;
    }
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}>
      <Header activeView={view} onNavigate={setView} />
      <main>{renderView()}</main>
      <MobileNav activeView={view} onNavigate={setView} />
    </div>
  );
}
