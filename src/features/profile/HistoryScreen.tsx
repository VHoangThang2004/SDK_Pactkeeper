import React, { useState } from 'react';
import { ScrollText, ArrowDown } from 'lucide-react';
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

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };
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
      case 'CONFIRMED': return 'Completed';
      case 'CANCELLED': return 'Failed';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
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
          {isLoading ? (
            <div className={styles.emptyState}>Loading ledger...</div>
          ) : history.length === 0 ? (
            <div className={styles.emptyState}>No entries found in the treasury ledger.</div>
          ) : (
            history.map((txn, index) => {
              const isEven = index % 2 === 0;
              const isCompleted = txn.status.toUpperCase() === 'CONFIRMED';

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
