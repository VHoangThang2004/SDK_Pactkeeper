import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ScrollText, 
  Gem, 
  ShieldCheck
} from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { Button } from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import styles from './PaymentResultScreen.module.css';

export const PaymentResultScreen: React.FC<{ isSuccess: boolean }> = ({ isSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, playerId } = useAuthStore();

  // Parse query params from PayOS redirect
  const searchParams = new URLSearchParams(location.search);
  const orderCode = searchParams.get('orderCode');
  const payOsStatus = searchParams.get('status');

  const [isSyncing, setIsSyncing] = useState<boolean>(Boolean(orderCode));

  useEffect(() => {
    if (!orderCode) return;

    const reconcileOrder = async () => {
      try {
        setIsSyncing(true);
        const targetStatus = isSuccess ? (payOsStatus || 'PAID') : 'CANCELLED';
        await apiClient.post(`/api/payment/sync/${orderCode}?status=${targetStatus}`);
      } catch (err) {
        console.warn('Reconciling payment order in background:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    reconcileOrder();
  }, [orderCode, isSuccess, payOsStatus]);

  return (
    <ParchmentBackground padding="2rem 1rem">
      <div className={styles.container}>
        <div className={`${styles.resultCard} ${isSuccess ? styles.cardSuccess : styles.cardFailed}`}>
          
          {/* Status Icon with Glowing Aura */}
          <div className={styles.iconWrapper}>
            {isSuccess ? (
              <div className={styles.auraSuccess}>
                <CheckCircle size={64} className={styles.iconSuccess} />
              </div>
            ) : (
              <div className={styles.auraFailed}>
                <XCircle size={64} className={styles.iconFailed} />
              </div>
            )}
          </div>

          <h2 className={styles.resultTitle}>
            {isSuccess ? 'Payment Successful!' : 'Payment Cancelled'}
          </h2>

          <p className={styles.resultSubtitle}>
            {isSuccess 
              ? 'Your tribute has been acknowledged. In-game currency and rewards have been delivered directly to your account.' 
              : 'The payment process was cancelled or timed out. No currency was deducted.'}
          </p>

          {isSyncing && (
            <div className={styles.syncIndicator}>
              <Loader2 size={16} className={styles.spinIcon} />
              <span>Syncing with Game Server & PayOS...</span>
            </div>
          )}

          {/* Transaction Metadata Box */}
          <div className={styles.receiptBox}>
            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>Transaction Status</span>
              <span className={`${styles.statusBadge} ${isSuccess ? styles.badgeSuccess : styles.badgeFailed}`}>
                {isSuccess ? 'CONFIRMED / PAID' : 'CANCELLED'}
              </span>
            </div>

            {orderCode && (
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Order Code</span>
                <span className={styles.receiptValue}>{orderCode}</span>
              </div>
            )}

            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>Target Character</span>
              <span className={styles.receiptValue}>{username || 'Player'}</span>
            </div>

            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>Player ID</span>
              <span className={styles.receiptValue}>{playerId || 'Current Account'}</span>
            </div>

            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>Delivery Channel</span>
              <span className={styles.receiptDeliver}>
                <ShieldCheck size={14} />
                <span>In-Game Mailbox & Inventory</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button 
              variant="primary" 
              onClick={() => navigate('/profile/topup')}
              className={styles.mainBtn}
            >
              <Gem size={18} />
              <span>Return to Treasury</span>
            </Button>

            <Button 
              variant="secondary" 
              onClick={() => navigate('/profile/history')}
              className={styles.subBtn}
            >
              <ScrollText size={18} />
              <span>View Ledger History</span>
            </Button>
          </div>

          <div className={styles.supportHint}>
            <span>Have questions regarding your order? </span>
            <a href="/profile/support" className={styles.supportLink}>Contact Counsel Support</a>
          </div>

        </div>
      </div>
    </ParchmentBackground>
  );
};
