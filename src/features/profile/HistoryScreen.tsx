import React, { useState, useEffect } from 'react';
import { ScrollText, ArrowDown, RefreshCw } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './HistoryScreen.module.css';

import { apiClient } from '../../core/network/apiClient';

interface PaymentHistory {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
}

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const dt = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dt.getMonth()];
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    return `${dt.getDate()} ${month}, ${hours}:${minutes}`;
  };

  const mapStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'CONFIRMED': return 'Completed';
      case 'CANCELLED': return 'Failed';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'CONFIRMED': return '#1B5E20'; // Green
      case 'CANCELLED': return 'var(--color-ruby)';
      default: return 'var(--color-ink-light)';
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
        <div className={styles.tableBody}>
          {isLoading && history.length === 0 ? (
            <div className={styles.emptyState}>Loading and reconciling ledger...</div>
          ) : history.length === 0 ? (
            <div className={styles.emptyState}>No entries found in the treasury ledger.</div>
          ) : (
            history.map((txn, index) => {
              const isEven = index % 2 === 0;
              const isCompleted = txn.status.toUpperCase() === 'CONFIRMED' || txn.status.toUpperCase() === 'PAID';

              return (
                <div key={txn.orderCode} className={`${styles.tableRow} ${isEven ? styles.evenRow : styles.oddRow}`}>
                  
                  {/* Date / ID */}
                  <div className={styles.colDate}>
                    <div className={styles.dateText}>{formatDate(txn.createdAt)}</div>
                    <div className={styles.idText}>TXN-{txn.orderCode}</div>
                  </div>

                  {/* Tithe */}
                  <div className={styles.colTithe}>
                    <div className={styles.amountText}>{txn.amount.toLocaleString('vi-VN')} VND</div>
                    <div className={styles.statusText} style={{ color: getStatusColor(txn.status) }}>
                      {mapStatus(txn.status)}
                    </div>
                  </div>

                  {/* Acquired */}
                  <div className={styles.colAcquired}>
                    {isCompleted && txn.gemsAmount > 0 ? (
                      <div className={styles.acquiredGems}>
                        <ArrowDown size={12} className={styles.acquiredIcon} />
                        <span>+{txn.gemsAmount}</span>
                      </div>
                    ) : (
                      <div className={styles.acquiredGems}>-</div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </ParchmentBackground>
  );
};
