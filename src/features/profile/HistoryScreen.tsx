import React, { useState } from 'react';
import { ScrollText, ArrowDown } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './HistoryScreen.module.css';

interface PaymentHistory {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
}

const mockHistory: PaymentHistory[] = [
  { orderCode: '102938', amount: 129000, gemsAmount: 600, status: 'CONFIRMED', createdAt: new Date().toISOString() },
  { orderCode: '102937', amount: 22000, gemsAmount: 100, status: 'CANCELLED', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { orderCode: '102936', amount: 299000, gemsAmount: 1500, status: 'PENDING', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { orderCode: '102935', amount: 699000, gemsAmount: 3500, status: 'CONFIRMED', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export const HistoryScreen: React.FC = () => {
  const [history] = useState<PaymentHistory[]>(mockHistory);

  // In a real app, fetch from API

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
          {history.length === 0 ? (
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
