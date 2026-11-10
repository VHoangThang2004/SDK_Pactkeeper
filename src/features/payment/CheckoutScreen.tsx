import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  QrCode, 
  CreditCard, 
  Smartphone, 
  Check, 
  ShieldCheck, 
  Lock, 
  Gem, 
  AlertCircle
} from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { Button } from '../../components/Button/Button';
import { GemArt } from '../../components/GameIcons/GemArt';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import styles from './CheckoutScreen.module.css';

interface Pack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
  weaponDefinitionIds?: number[];
  trinketDefinitionIds?: number[];
  unitDefinitionIds?: number[];
  unitNames?: string[];
  weaponNames?: string[];
  trinketNames?: string[];
  resolvedUnitNames?: string[];
  resolvedWeaponNames?: string[];
  resolvedTrinketNames?: string[];
}

const PAYMENT_METHODS = [
  { 
    id: 'payos', 
    name: 'VietQR / Napas247 (PayOS)', 
    subtitle: 'Scan QR with any banking app • 0% Fee • Instant',
    badge: 'RECOMMENDED',
    icon: QrCode 
  },
  { 
    id: 'cc', 
    name: 'Credit / Debit Card', 
    subtitle: 'Visa, MasterCard, JCB',
    badge: 'GATEWAY',
    icon: CreditCard 
  },
  { 
    id: 'wallet', 
    name: 'Mobile E-Wallets', 
    subtitle: 'MoMo, ZaloPay, Apple Pay',
    badge: 'FAST',
    icon: Smartphone 
  },
];

export const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pack = location.state?.pack as Pack;

  const { username, playerId } = useAuthStore();
  const [selectedMethodId, setSelectedMethodId] = useState('payos');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!pack) {
    return (
      <ParchmentBackground padding="3rem 1rem">
        <div className={styles.emptyContainer}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Package Selected</h3>
          <p className={styles.emptyDesc}>Please select a Gem tier or Bundle from the Treasury catalog.</p>
          <Button onClick={() => navigate('/profile/topup')}>Return to Treasury</Button>
        </div>
      </ParchmentBackground>
    );
  }

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('vi-VN')} VND`;
  };

  const unitList = pack.unitNames || pack.resolvedUnitNames || [];
  const weaponList = pack.weaponNames || pack.resolvedWeaponNames || [];
  const trinketList = pack.trinketNames || pack.resolvedTrinketNames || [];
  const hasInclusions = unitList.length > 0 || weaponList.length > 0 || trinketList.length > 0;

  const handlePay = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await apiClient.post('/api/payment/create-order', { 
        packId: pack.id,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        ReturnUrl: `${window.location.origin}/payment/success`,
        CancelUrl: `${window.location.origin}/payment/cancel`
      });

      if (response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setErrorMessage('Failed to obtain PayOS payment gateway link from server.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setErrorMessage(error?.response?.data?.message || 'Error occurred while creating payment order.');
      setIsLoading(false);
    }
  };

  return (
    <ParchmentBackground padding="1.5rem 1rem 3rem">
      <div className={styles.container}>
        
        {/* Navigation Breadcrumb / Return */}
        <div className={styles.topNavRow}>
          <button className={styles.returnBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Return to Treasury</span>
          </button>
          <div className={styles.orderLabel}>
            <Lock size={14} className={styles.lockIcon} />
            <span>Secure 256-Bit SSL Checkout</span>
          </div>
        </div>

        {/* Character Destination Card (Real Data) */}
        <div className={styles.recipientCard}>
          <div className={styles.recipientLeft}>
            <div className={styles.recipientAvatar}>
              <img 
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Player'}`} 
                alt="avatar" 
              />
            </div>
            <div>
              <div className={styles.recipientTitleRow}>
                <span className={styles.recipientName}>{username || 'Player'}</span>
                <span className={styles.serverBadge}>Pactkeeper Official Server</span>
              </div>
              <span className={styles.recipientUid}>Target Player ID: {playerId || 'Current Account'}</span>
            </div>
          </div>
          <div className={styles.recipientVerified}>
            <ShieldCheck size={16} />
            <span>Delivery Destination Confirmed</span>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className={styles.checkoutGrid}>
          
          {/* Left Column: Order Information & Payment Method */}
          <div className={styles.leftCol}>
            
            {/* 1. Item Details Card (Real Backend Package Data) */}
            <div className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span className={styles.stepNum}>1</span>
                <h3>Order Item Details</h3>
              </div>

              <div className={styles.itemBody}>
                <div className={styles.itemArtWrap}>
                  <GemArt gemsAmount={pack.gemsAmount} size={80} />
                </div>

                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>{pack.name}</h4>
                  
                  <div className={styles.itemGemsRow}>
                    <Gem size={18} className={styles.gemIcon} />
                    <span className={styles.itemGemsAmount}>
                      {pack.gemsAmount.toLocaleString('en-US')} Gems
                    </span>
                  </div>

                  {/* Real Inclusions from Backend */}
                  {hasInclusions && (
                    <div className={styles.inclusionsBox}>
                      <span className={styles.inclusionsTitle}>Included In Package:</span>
                      <div className={styles.inclusionsChips}>
                        {unitList.map((n, i) => (
                          <span key={`u-${i}`} className={styles.inclusionChip}>⚔️ Hero: {n}</span>
                        ))}
                        {weaponList.map((n, i) => (
                          <span key={`w-${i}`} className={styles.inclusionChip}>🛡️ Weapon: {n}</span>
                        ))}
                        {trinketList.map((n, i) => (
                          <span key={`t-${i}`} className={styles.inclusionChip}>💍 Trinket: {n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector */}
            <div className={styles.methodSection}>
              <div className={styles.itemHeader}>
                <span className={styles.stepNum}>2</span>
                <h3>Select Payment Method</h3>
              </div>

              <div className={styles.methodList}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = selectedMethodId === pm.id;
                  const IconComp = pm.icon;
                  return (
                    <div
                      key={pm.id}
                      className={`${styles.methodCard} ${isSelected ? styles.methodSelected : ''}`}
                      onClick={() => setSelectedMethodId(pm.id)}
                    >
                      <div className={styles.methodLeft}>
                        <div className={`${styles.radioCircle} ${isSelected ? styles.radioActive : ''}`}>
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div className={styles.methodIconWrapper}>
                          <IconComp size={22} className={styles.methodIcon} />
                        </div>
                        <div className={styles.methodDetails}>
                          <div className={styles.methodTitleRow}>
                            <span className={styles.methodName}>{pm.name}</span>
                            <span className={`${styles.methodBadge} ${pm.id === 'payos' ? styles.badgeRecommend : ''}`}>
                              {pm.badge}
                            </span>
                          </div>
                          <span className={styles.methodSub}>{pm.subtitle}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Action */}
          <div className={styles.rightCol}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Payment Summary</h3>
              <div className={styles.summaryDivider} />

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Package</span>
                <span className={styles.summaryVal}>{pack.name}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Gems Granted</span>
                <span className={styles.summaryVal}>{pack.gemsAmount.toLocaleString('en-US')} Gems</span>
              </div>

              {hasInclusions && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Bonus Items</span>
                  <span className={styles.summaryBonus}>
                    {unitList.length + weaponList.length + trinketList.length} Items Included
                  </span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Gateway Fee</span>
                <span className={styles.summaryFree}>0 VND (Free)</span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Price:</span>
                <span className={styles.totalAmount}>{formatPrice(pack.priceVnd)}</span>
              </div>

              {errorMessage && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                className={styles.payBtn}
                onClick={handlePay}
                isLoading={isLoading}
                disabled={isLoading}
              >
                PROCEED TO PAY ({formatPrice(pack.priceVnd)})
              </Button>

              <div className={styles.guaranteeBox}>
                <ShieldCheck size={18} className={styles.guaranteeIcon} />
                <p>
                  100% Instant Delivery via PayOS. In-game currency and items are automatically credited directly to your player account upon transaction confirmation.
                </p>
              </div>

              <p className={styles.termsNote}>
                By clicking "Proceed to Pay", you agree to the Pactkeeper Payment Terms & Conditions. All sales are processed directly into the designated player account.
              </p>
            </div>
          </div>

        </div>

      </div>
    </ParchmentBackground>
  );
};
