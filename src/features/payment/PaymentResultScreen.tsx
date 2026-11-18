import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ScrollText, Gem, ShieldCheck } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import styles from './PaymentResultScreen.module.css';

export const PaymentResultScreen: React.FC<{ isSuccess: boolean }> = ({ isSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, playerId } = useAuthStore();

  const searchParams = new URLSearchParams(location.search);
  const orderCode = searchParams.get('orderCode');
  const payOsStatus = searchParams.get('status');

  const [isSyncing, setIsSyncing] = useState<boolean>(Boolean(orderCode));

  useEffect(() => {
    if (!orderCode) return;

    const reconcileOrder = async () => {
      try {
        setIsSyncing(true);
        const targetStatus = isSuccess ? payOsStatus || 'PAID' : 'CANCELLED';
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
    <LayoutWrapper>
      <div className={styles.pageCenter}>
        <Card
          variant="default"
          elevation="med"
          padding={6}
          maxWidth={560}
          width="100%"
          className={isSuccess ? styles.cardSuccess : styles.cardFailed}
        >
          <VStack gap={4} hAlign="center" width="100%">
            <div className={isSuccess ? styles.auraSuccess : styles.auraFailed} aria-hidden="true">
              {isSuccess ? <CheckCircle size={48} /> : <XCircle size={48} />}
            </div>

            <VStack gap={1.5} hAlign="center">
              <Heading level={1} justify="center">
                {isSuccess ? 'Payment Successful!' : 'Payment Cancelled'}
              </Heading>
              <Text type="body" color="secondary" justify="center" display="block">
                {isSuccess
                  ? 'Your tribute has been acknowledged. In-game currency and rewards have been delivered directly to your account.'
                  : 'The payment process was cancelled or timed out. No currency was deducted.'}
              </Text>
            </VStack>

            {isSyncing && (
              <Banner
                status="info"
                icon={<Spinner size="sm" aria-label="Syncing order" />}
                title="Syncing with Game Server & PayOS"
                description="Reconciling transaction state and refreshing inventory..."
              />
            )}

            <Card variant="muted" padding={4} width="100%">
              <MetadataList columns="single" label={{ position: 'start', width: 150 }}>
                <MetadataListItem label="Transaction Status">
                  <Badge
                    variant={isSuccess ? 'success' : 'error'}
                    label={isSuccess ? 'CONFIRMED / PAID' : 'CANCELLED'}
                  />
                </MetadataListItem>
                {orderCode && (
                  <MetadataListItem label="Order Code">
                    <Text type="code" weight="semibold">
                      {orderCode}
                    </Text>
                  </MetadataListItem>
                )}
                <MetadataListItem label="Target Character">
                  <Text weight="semibold">{username || 'Player'}</Text>
                </MetadataListItem>
                <MetadataListItem label="Player ID">
                  <Text type="code" size="sm">
                    {playerId || 'Current Account'}
                  </Text>
                </MetadataListItem>
                <MetadataListItem label="Delivery Channel">
                  <HStack gap={1.5} vAlign="center">
                    <ShieldCheck size={14} className={styles.deliverIcon} aria-hidden="true" />
                    <Text weight="medium">In-Game Mailbox & Inventory</Text>
                  </HStack>
                </MetadataListItem>
              </MetadataList>
            </Card>

            <HStack gap={3} hAlign="center" wrap="wrap" width="100%">
              <Button
                label="Return to Treasury"
                variant="primary"
                size="lg"
                icon={<Gem size={17} />}
                onClick={() => navigate('/profile/topup')}
              />
              <Button
                label="View Ledger History"
                variant="secondary"
                size="lg"
                icon={<ScrollText size={17} />}
                onClick={() => navigate('/profile/history')}
              />
            </HStack>

            <HStack gap={1} vAlign="center" hAlign="center" wrap="wrap">
              <Text type="supporting" size="sm" color="secondary">
                Have questions regarding your order?
              </Text>
              <Button
                label="Contact Counsel Support"
                variant="ghost"
                size="sm"
                href="/profile/support"
              />
            </HStack>
          </VStack>
        </Card>
      </div>
    </LayoutWrapper>
  );
};
