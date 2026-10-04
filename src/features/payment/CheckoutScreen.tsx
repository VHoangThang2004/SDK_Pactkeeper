import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, CreditCard, Smartphone, Check } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { Button } from '../../components/Button/Button';
import { apiClient } from '../../core/network/apiClient';
import styles from './CheckoutScreen.module.css';

// Type matching the mock data structure in TopUpScreen
interface Pack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
  isPopular: boolean;
  bonusPercentage?: number;
  resolvedUnitNames?: string[];
  resolvedWeaponNames?: string[];
  resolvedTrinketNames?: string[];
}

const PAYMENT_METHODS = [
  { id: 'payos', name: 'PayOS QR/Transfer', icon: QrCode },
  { id: 'cc', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'apple', name: 'Apple Pay', icon: Smartphone },
];

export const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pack = location.state?.pack as Pack;

  const [selectedMethodId, setSelectedMethodId] = useState('payos');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If no pack was passed, return to dashboard
  if (!pack) {
    return (
      <ParchmentBackground>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>No package selected</h3>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </ParchmentBackground>
    );
  }

  const formatPrice = (price: number) => {
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} VND`;
  };

  const handlePay = async () => {
    setIsLoading(true);
    setSuccessMessage(null);
    
    try {
      const response = await apiClient.post('/api/payment/create-order', { 
        packId: pack.id,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      });
      if (response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setSuccessMessage('Lỗi: Không nhận được link thanh toán từ server.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setSuccessMessage('Đã có lỗi xảy ra khi tạo giao dịch.');
      setIsLoading(false);
    }
  };

  return (
    <ParchmentBackground>
      <div className={styles.container}>
        {/* Return Button */}
        <button className={styles.returnBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Return</span>
        </button>

        {/* Scroll Receipt */}
        <div className={styles.scrollWrapper}>
          <div className={styles.rollerTop} />
          
          <div className={styles.receiptCard}>
            <h2 className={styles.receiptTitle}>Pact of Exchange</h2>
            <div className={styles.divider} />

            <div className={styles.receiptRow}>
              <span className={styles.label}>Pact Name</span>
              <span className={styles.value}>{pack.name.toUpperCase()}</span>
            </div>
            <div className={styles.receiptRow}>
              <span className={styles.label}>Amount</span>
              <span className={styles.value}>{pack.gemsAmount} GEMS</span>
            </div>

            {/* Inclusions (mock logic, if any) */}
            {(pack.resolvedUnitNames?.length || pack.resolvedWeaponNames?.length || pack.resolvedTrinketNames?.length) ? (
              <div className={styles.inclusions}>
                <h3 className={styles.inclusionsTitle}>Granted Inclusions:</h3>
                {pack.resolvedUnitNames?.map((n, i) => (
                  <div className={styles.receiptRow} key={`unit-${i}`}>
                    <span className={styles.label}>Hero Granted</span>
                    <span className={styles.value}>{n}</span>
                  </div>
                ))}
                {pack.resolvedWeaponNames?.map((n, i) => (
                  <div className={styles.receiptRow} key={`wpn-${i}`}>
                    <span className={styles.label}>Weapon Granted</span>
                    <span className={styles.value}>{n}</span>
                  </div>
                ))}
                {pack.resolvedTrinketNames?.map((n, i) => (
                  <div className={styles.receiptRow} key={`trk-${i}`}>
                    <span className={styles.label}>Trinket Granted</span>
                    <span className={styles.value}>{n}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.totalBox}>
              <span className={styles.totalLabel}>TOTAL TITHE</span>
              <span className={styles.totalValue}>{formatPrice(pack.priceVnd)}</span>
            </div>
          </div>
          
          <div className={styles.rollerBottom} />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        {/* Tribute Method */}
        <h3 className={styles.sectionTitle}>Tribute Method</h3>
        <div className={styles.methodsList}>
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = selectedMethodId === pm.id;
            const IconComponent = pm.icon;
            return (
              <div
                key={pm.id}
                className={`${styles.methodCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedMethodId(pm.id)}
              >
                <div className={styles.methodInfo}>
                  <IconComponent size={24} className={styles.methodIcon} />
                  <span className={styles.methodName}>{pm.name.toUpperCase()}</span>
                </div>
                <div className={styles.radioCircle}>
                  {isSelected && <Check size={14} strokeWidth={3} className={styles.checkIcon} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <Button 
          className={styles.sealBtn} 
          onClick={handlePay}
          isLoading={isLoading}
          disabled={isLoading}
        >
          SEAL THE PACT ({formatPrice(pack.priceVnd)})
        </Button>

        {successMessage && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => navigate('/')}>Quay lại Dashboard</Button>
          </div>
        )}

        <p className={styles.disclaimer}>
          By sealing this pact, you agree to the laws of the realm and acknowledge that tributes are non-refundable.
        </p>
      </div>
    </ParchmentBackground>
  );
};
