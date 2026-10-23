import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAgentPayStore } from '@/store/agentpay';
import { useUsdcBalance, useTransferUsdc, buildTxExplorerUrl, parseTxAmount, ARC_TESTNET_ID } from '@/lib/onchain';
import { StatusBadge } from './shared/StatusBadge';
import { UsdcAmount } from './shared/UsdcAmount';
import { shortAddr, relativeTime, parseOnchainError } from '@/lib/utils';

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export function PaymentsHistory() {
  const { address, isConnected } = useAccount();
  const { payments, addPayment } = useAgentPayStore();
  const { raw: balance, isLoading: balLoading, refetch } = useUsdcBalance(
    isConnected ? (address) : undefined,
  );

  const { transfer, hash, isPending, isConfirming, isSuccess, isError, error, reset } = useTransferUsdc();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Capture latest form values for the effect below
  const formRef = useRef({ recipient, amount, description, address });
  formRef.current = { recipient, amount, description, address };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !isConnected) return;
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      toast.error('Invalid wallet address.');
      return;
    }
    const rawAmount = parseTxAmount(amount);
    if (rawAmount <= 0n) { toast.error('Amount must be greater than 0'); return; }
    if (rawAmount > balance) { toast.error('Insufficient USDC balance.'); return; }
    transfer(recipient as `0x${string}`, rawAmount);
  };

  // Record payment once confirmed (in effect to avoid render-time side effects)
  useEffect(() => {
    if (isSuccess && hash) {
      const { recipient: to, amount: amt, description: desc, address: from } = formRef.current;
      addPayment({
        id: `pay-${hash.slice(0, 10)}`,
        from: from ?? '',
        to,
        amount: parseTxAmount(amt),
        status: 'confirmed',
        txHash: hash,
        description: desc || 'USDC transfer',
        createdAt: Date.now(),
      });
      void refetch();
      toast.success('Payment confirmed onchain!');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isError) {
      const msg = parseOnchainError(error);
      if (msg !== 'Transaction cancelled.') toast.error(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, error]);

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

  const allPayments = [...payments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-8 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Payments</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Send USDC directly on Arc Testnet. Every transaction is settled onchain.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Send payment panel */}
        <motion.div
          className="glass-strong rounded-2xl p-5 space-y-4"
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-base font-semibold display" style={{ color: 'var(--ink)' }}>Send USDC</h2>

          {/* Balance */}
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--surface-muted)' }}>
            <div>
              <div className="text-xs" style={{ color: 'var(--subtle)' }}>Your Balance</div>
              {!isConnected ? (
                <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Not connected</div>
              ) : balLoading ? (
                <div className="shimmer h-6 w-24 rounded mt-1" />
              ) : (
                <UsdcAmount raw={balance} size="lg" className="mt-1" />
              )}
            </div>
            {!isConnected && <ConnectKitButton />}
          </div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="form"
                onSubmit={handleSend}
                className="space-y-3"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Recipient Address</label>
                  <input
                    style={inputStyle}
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={isPending || isConfirming}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Amount (USDC)</label>
                  <div className="relative">
                    <input
                      style={{ ...inputStyle, paddingRight: 56 }}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isPending || isConfirming}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'var(--surface-muted)', color: 'var(--accent)' }}
                      onClick={() => setAmount((Number(balance) / 1e6).toFixed(6))}
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Description (optional)</label>
                  <input
                    style={inputStyle}
                    placeholder="Payment note"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending || isConfirming}
                  />
                </div>

                {isPending && (
                  <div className="text-xs py-2 flex items-center gap-2" style={{ color: 'var(--agent-amber)' }}>
                    <Loader2 size={13} className="animate-spin" />
                    Confirm in your wallet...
                  </div>
                )}
                {isConfirming && (
                  <div className="text-xs py-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    <Loader2 size={13} className="animate-spin" />
                    Transaction submitted — waiting for confirmation...
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isConnected || isPending || isConfirming || !recipient || !amount}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                  style={{
                    background: (!isConnected || isPending || isConfirming) ? 'var(--surface-muted)' : 'var(--accent)',
                    color: (!isConnected || isPending || isConfirming) ? 'var(--muted)' : 'var(--bg)',
                  }}
                >
                  <Send size={14} />
                  {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Send USDC on Arc'}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="rounded-xl p-4 text-center space-y-2" style={{ background: 'rgba(95,201,138,0.10)' }}>
                  <div className="text-2xl">✓</div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Payment confirmed!</p>
                  {hash && (
                    <a
                      href={buildTxExplorerUrl(ARC_TESTNET_ID, hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center justify-center gap-1 hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      View on explorer
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => { reset(); setAmount(''); setRecipient(''); setDescription(''); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                >
                  Send another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Payment history */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          variants={fade}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold display" style={{ color: 'var(--ink)' }}>
              Payment History
            </h2>
          </div>
          <div className="divide-y overflow-y-auto max-h-[520px]" style={{ borderColor: 'var(--border)' }}>
            {allPayments.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--subtle)' }}>No payments yet.</div>
            )}
            {allPayments.map((pay) => {
              const isOutgoing = address && pay.from.toLowerCase() === address.toLowerCase();
              return (
                <div key={pay.id} className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isOutgoing ? 'rgba(232,98,122,0.10)' : 'rgba(95,201,138,0.10)',
                      color: isOutgoing ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {isOutgoing ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{pay.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                        {isOutgoing ? `To: ${shortAddr(pay.to)}` : `From: ${shortAddr(pay.from)}`}
                      </span>
                      <StatusBadge status={pay.status} size="sm" />
                    </div>
                    {pay.txHash && (
                      <a
                        href={buildTxExplorerUrl(ARC_TESTNET_ID, pay.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-0.5 mt-0.5 hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        <ExternalLink size={10} />
                        {shortAddr(pay.txHash)}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <UsdcAmount
                      raw={pay.amount}
                      size="sm"
                      showIcon={false}
                      className={isOutgoing ? '!text-[var(--danger)]' : '!text-[var(--success)]'}
                    />
                    <span className="text-xs" style={{ color: 'var(--subtle)' }}>{relativeTime(pay.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
