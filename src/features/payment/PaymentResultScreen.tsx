import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { Button } from '../../components/Button/Button';
import styles from './CheckoutScreen.module.css';

export const PaymentResultScreen: React.FC<{ isSuccess: boolean }> = ({ isSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Optionally parse query params from PayOS
  const searchParams = new URLSearchParams(location.search);
  const orderCode = searchParams.get('orderCode');

  return (
    <ParchmentBackground>
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', display: 'flex' }}>
        <div className={styles.receiptCard} style={{ maxWidth: '400px', textAlign: 'center' }}>
          {isSuccess ? (
            <>
              <CheckCircle size={64} color="#1b5e20" style={{ margin: '0 auto 1rem' }} />
              <h2 className={styles.receiptTitle} style={{ color: '#1b5e20' }}>Tribute Accepted!</h2>
              <p style={{ margin: '1rem 0', color: '#5c4b3a' }}>
                Your payment was successful (Order: {orderCode}). The Gems and items have been magically added to your treasury.
              </p>
            </>
          ) : (
            <>
              <XCircle size={64} color="#d32f2f" style={{ margin: '0 auto 1rem' }} />
              <h2 className={styles.receiptTitle} style={{ color: '#d32f2f' }}>Pact Cancelled</h2>
              <p style={{ margin: '1rem 0', color: '#5c4b3a' }}>
                The transaction was disrupted or cancelled. No gold was taken from your vault.
              </p>
            </>
          )}

          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontStyle: 'italic', color: '#8c7b6a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              If you are on a mobile device, you can safely close this browser tab and return to the game.
            </p>
            <Button onClick={() => navigate('/profile/history')}>
              <Home size={18} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Return to Ledger
            </Button>
          </div>
        </div>
      </div>
    </ParchmentBackground>
  );
};
