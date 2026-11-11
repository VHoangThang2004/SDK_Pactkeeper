import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollText, 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  XCircle, 
  Loader2, 
  Gem, 
  CheckCircle2
} from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { Button } from '../../components/Button/Button';
import { apiClient } from '../../core/network/apiClient';
import { useSyncStore } from '../../store/syncStore';
import styles from './HistoryScreen.module.css';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

  const { profileUpdateTimestamp } = useSyncStore();

  const fetchHistory = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  // Re-fetch when real-time profile update event arrives
  useEffect(() => {
    fetchHistory(false);
  }, [profileUpdateTimestamp, fetchHistory]);

  // Window focus listener
  useEffect(() => {
    const handleFocus = () => fetchHistory(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchHistory]);

  // Auto-poll every 5s while there is at least one pending order
  useEffect(() => {
    const hasPending = history.some((h) => h.status.toLowerCase() === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [history, fetchHistory]);

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
    return `${dt.getDate()} ${month} ${dt.getFullYear()}, ${hours}:${minutes}`;
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

  const handlePayNow = (checkoutUrl?: string) => {
    if (!checkoutUrl) {
      alert('Payment link unavailable for this order. Please initiate a new order.');
      return;
    }
    window.location.href = checkoutUrl;
  };

  const handleCancelOrder = async (orderCode: string) => {
    if (!window.confirm(`Are you sure you want to cancel pending order TXN-${orderCode}?`)) {
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
      alert(err.response?.data?.message || 'Failed to cancel the pending order.');
    } finally {
      setCancellingOrderCode(null);
    }
  };

  const filteredHistory = history.filter((txn) => {
    const isCompleted = txn.status.toUpperCase() === 'CONFIRMED' || txn.status.toUpperCase() === 'PAID';
    const isPending = txn.status.toUpperCase() === 'PENDING';
    const remainingSec = getRemainingSeconds(txn.createdAt);
    const isExpired = isPending && remainingSec <= 0;

    if (statusFilter === 'completed') return isCompleted;
    if (statusFilter === 'pending') return isPending && !isExpired;
    if (statusFilter === 'cancelled') return txn.status.toUpperCase() === 'CANCELLED' || isExpired;
    return true;
  });

  return (
    <ParchmentBackground padding="1.5rem 1rem 3rem">
      <div className={styles.container}>
        
        {/* Top Header & Reconcile Button */}
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.pageTitle}>Transaction Records</h2>
            <p className={styles.pageSubtitle}>Official payment history and real-time order ledger</p>
          </div>

          <button 
            onClick={() => fetchHistory(true)}
            disabled={isLoading}
            className={styles.syncBtn}
            title="Refresh and reconcile ledger records"
          >
            <RefreshCw size={14} className={isLoading ? styles.spinning : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Records'}</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Orders ({history.length})
          </button>
          <button 
            className={`${styles.filterBtn} ${statusFilter === 'completed' ? styles.filterActive : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.filterActive : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending Payment
          </button>
          <button 
            className={`${styles.filterBtn} ${statusFilter === 'cancelled' ? styles.filterActive : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled / Expired
          </button>
        </div>

        {/* Transactions List */}
        <div className={styles.ledgerList}>
          {isLoading && history.length === 0 ? (
            <div className={styles.emptyState}>
              <Loader2 size={32} className={styles.spinning} />
              <p>Reconciling official records with PayOS gateway...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <ScrollText size={42} className={styles.emptyIcon} />
              <h4>No Transactions Found</h4>
              <p>No orders match the selected filter. Visit the Treasury to acquire Gems.</p>
              <Button onClick={() => window.location.href = '/profile/topup'}>Go to Treasury</Button>
            </div>
          ) : (
            filteredHistory.map((txn) => {
              const isCompleted = txn.status.toUpperCase() === 'CONFIRMED' || txn.status.toUpperCase() === 'PAID';
              const isPending = txn.status.toUpperCase() === 'PENDING';
              const remainingSec = getRemainingSeconds(txn.createdAt);
              const isExpired = isPending && remainingSec <= 0;

              return (
                <div key={txn.orderCode} className={styles.txnCard}>
                  
                  {/* Card Header: Order Code & Date */}
                  <div className={styles.cardHeader}>
                    <div className={styles.orderIdentity}>
                      <span className={styles.orderCode}>TXN-{txn.orderCode}</span>
                      <span className={styles.orderDate}>{formatDate(txn.createdAt)}</span>
                    </div>

                    <div className={styles.statusWrap}>
                      {isCompleted && (
                        <span className={styles.badgeCompleted}>
                          <CheckCircle2 size={13} />
                          <span>Delivered</span>
                        </span>
                      )}
                      {isPending && !isExpired && (
                        <span className={styles.badgePending}>
                          <Clock size={13} />
                          <span>Pending ({formatCountdown(remainingSec)})</span>
                        </span>
                      )}
                      {(txn.status.toUpperCase() === 'CANCELLED' || isExpired) && (
                        <span className={styles.badgeFailed}>
                          <XCircle size={13} />
                          <span>{isExpired ? 'Expired' : 'Cancelled'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Items Acquired & Tithe Amount */}
                  <div className={styles.cardBody}>
                    <div className={styles.rewardCol}>
                      <div className={styles.gemIconCircle}>
                        <Gem size={20} className={styles.gemIcon} />
                      </div>
                      <div className={styles.rewardDetails}>
                        <div className={styles.gemTotal}>
                          {txn.gemsAmount > 0 ? `+${txn.gemsAmount.toLocaleString('en-US')} Gems` : 'Pact Package'}
                        </div>
                        <span className={styles.deliveryNote}>
                          {isCompleted ? 'Dispatched to In-Game Mail' : 'Awaiting Payment Clearance'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.amountCol}>
                      <span className={styles.amountLabel}>Paid Tithe</span>
                      <span className={styles.amountValue}>
                        {txn.amount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>

                  {/* Action Bar for Pending Orders */}
                  {isPending && !isExpired && (
                    <div className={styles.pendingBar}>
                      <div className={styles.pendingTimer}>
                        <Clock size={13} className={styles.clockPulse} />
                        <span>PayOS window closes in: <strong>{formatCountdown(remainingSec)}</strong></span>
                      </div>

                      <div className={styles.actionBtns}>
                        {txn.checkoutUrl && (
                          <button
                            type="button"
                            className={styles.payBtn}
                            onClick={() => handlePayNow(txn.checkoutUrl)}
                          >
                            <ExternalLink size={13} />
                            <span>Pay with VietQR</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => handleCancelOrder(txn.orderCode)}
                          disabled={cancellingOrderCode === txn.orderCode}
                        >
                          {cancellingOrderCode === txn.orderCode ? (
                            <Loader2 size={13} className={styles.spinning} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          <span>Cancel Order</span>
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
