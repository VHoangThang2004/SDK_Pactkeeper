import React, { useState, useEffect } from 'react';
import { ScrollText, ArrowDown, RefreshCw, Clock, ExternalLink, XCircle, Loader2 } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './HistoryScreen.module.css';

import { apiClient } from '../../core/network/apiClient';

interface PaymentHistory {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
  checkoutUrl?: string;
}

const PAYOS_EXPIRY_MS = 15 * 60 * 1000; // Standard PayOS payment window: 15 minutes

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderCode, setCancellingOrderCode] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Update current time every second to drive real-time expiration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (dateString: string) => {
    const dt = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dt.getMonth()];
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    return `${dt.getDate()} ${month}, ${hours}:${minutes}`;
  };

  const getRemainingSeconds = (createdAtStr: string): number => {
    const createdTime = new Date(createdAtStr).getTime();
    const remainingMs = createdTime + PAYOS_EXPIRY_MS - currentTime;
    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const mapStatus = (status: string, isExpired: boolean) => {
    if (isExpired) return 'Expired';
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'CONFIRMED': return 'Completed';
      case 'CANCELLED': return 'Failed';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (isExpired) return 'var(--color-ink-muted, #8c7b6a)';
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'CONFIRMED': return '#1B5E20'; // Green
      case 'CANCELLED': return 'var(--color-ruby)';
      default: return '#b78103'; // Amber
    }
  };

  const handlePayNow = (checkoutUrl?: string) => {
    if (!checkoutUrl) {
      alert('Payment link unavailable for this order. Please try a new order.');
      return;
    }
    window.location.href = checkoutUrl;
  };

  const handleCancelOrder = async (orderCode: string) => {
    if (!window.confirm(`Are you sure you want to cancel tribute TXN-${orderCode}?`)) {
      return;
    }

    setCancellingOrderCode(orderCode);
    try {
      const res = await apiClient.post(`/api/payment/cancel-order/${orderCode}`);
      if (res.status === 200) {
        setHistory((prev) =>
          prev.map((item) =>
            item.orderCode === orderCode ? { ...item, status: 'CANCELLED' } : item
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      alert(err.response?.data?.message || 'Failed to cancel the pending tribute.');
    } finally {
      setCancellingOrderCode(null);
    }
  };

  return (
    <ParchmentBackground padding="1rem">
      <div className={styles.headerRow}>
        <ScrollText size={20} className={styles.headerIcon} />
        <h2 className={styles.headerTitle}>Treasury Ledger</h2>
        <button 
          onClick={fetchHistory}
          disabled={isLoading}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            color: 'var(--color-ink-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            padding: '0.2rem 0.5rem',
          }}
          title="Refresh and reconcile ledger records"
        >
          <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isLoading ? 'Syncing...' : 'Sync Ledger'}</span>
        </button>
      </div>

      <div className={styles.ledgerContainer}>
        {/* Table Header */}
        <div className={styles.tableHeader}>
          <div className={styles.colDate}>Date / Order ID</div>
          <div className={styles.colTithe}>Tithe</div>
          <div className={styles.colAcquired}>Acquired</div>
        </div>

        {/* Table Body */}
        <div>
          {isLoading && history.length === 0 ? (
            <div className={styles.emptyState}>Loading and reconciling ledger...</div>
          ) : history.length === 0 ? (
            <div className={styles.emptyState}>No entries found in the treasury ledger.</div>
          ) : (
            history.map((txn, index) => {
              const isEven = index % 2 === 0;
              const isCompleted = txn.status.toUpperCase() === 'CONFIRMED' || txn.status.toUpperCase() === 'PAID';
              const isPending = txn.status.toUpperCase() === 'PENDING';
              const remainingSec = getRemainingSeconds(txn.createdAt);
              const isExpired = isPending && remainingSec <= 0;

              return (
                <div key={txn.orderCode} className={`${styles.rowWrapper} ${isEven ? styles.evenRow : styles.oddRow}`}>
                  <div className={styles.tableRow}>
                    {/* Date / ID */}
                    <div className={styles.colDate}>
                      <div className={styles.dateText}>{formatDate(txn.createdAt)}</div>
                      <div className={styles.idText}>TXN-{txn.orderCode}</div>
                    </div>

                    {/* Tithe */}
                    <div className={styles.colTithe}>
                      <div className={styles.amountText}>{txn.amount.toLocaleString('vi-VN')} VND</div>
                      <div className={styles.statusText} style={{ color: getStatusColor(txn.status, isExpired) }}>
                        {mapStatus(txn.status, isExpired)}
                      </div>
                    </div>

                    {/* Acquired / Remaining time */}
                    <div className={styles.colAcquired}>
                      {isCompleted && txn.gemsAmount > 0 ? (
                        <div className={styles.acquiredGems}>
                          <ArrowDown size={12} className={styles.acquiredIcon} />
                          <span>+{txn.gemsAmount}</span>
                        </div>
                      ) : isPending && !isExpired ? (
                        <div className={styles.pendingBadge} title="Time left to pay on PayOS">
                          <Clock size={11} />
                          <span>{formatCountdown(remainingSec)}</span>
                        </div>
                      ) : (
                        <div className={styles.acquiredGems}>-</div>
                      )}
                    </div>
                  </div>

                  {/* Pending Action Bar for active pending orders */}
                  {isPending && !isExpired && (
                    <div className={styles.pendingActionBar}>
                      <div className={styles.expiryNote}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span>PayOS window: {formatCountdown(remainingSec)} remaining</span>
                      </div>
                      <div className={styles.actionButtonGroup}>
                        {txn.checkoutUrl && (
                          <button
                            type="button"
                            className={styles.payNowBtn}
                            onClick={() => handlePayNow(txn.checkoutUrl)}
                            title="Continue payment on PayOS"
                          >
                            <ExternalLink size={12} />
                            <span>Pay Now</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => handleCancelOrder(txn.orderCode)}
                          disabled={cancellingOrderCode === txn.orderCode}
                          title="Cancel this pending tribute immediately"
                        >
                          {cancellingOrderCode === txn.orderCode ? (
                            <Loader2 size={12} className={styles.spinning} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </ParchmentBackground>
  );
};
