import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ScrollText, Gem, ShieldCheck } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';

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
      <Center minHeight="65vh">
        <Card elevation="med" padding={6} maxWidth={560} width="100%">
          <VStack gap={5} width="100%">
            <VStack gap={3} hAlign="center" width="100%">
              <Icon
                icon={isSuccess ? CheckCircle2 : XCircle}
                size="lg"
                color={isSuccess ? 'success' : 'error'}
              />

              <Heading level={2} justify="center">
                {isSuccess ? 'Payment Successful!' : 'Payment Cancelled'}
              </Heading>

              <Text type="supporting" color="secondary" justify="center" display="block">
                {isSuccess
                  ? 'Your tribute has been acknowledged. In-game currency and rewards have been delivered directly to your account.'
                  : 'The payment process was cancelled or timed out. No currency was deducted.'}
              </Text>
            </VStack>

            {isSyncing && (
              <Banner
                status="info"
                title="Reconciling Order"
                description="Syncing transaction status with Game Server and PayOS..."
                collapsible={false}
              >
                <HStack gap={2} vAlign="center">
                  <Spinner size="sm" />
                  <Text type="supporting" size="sm">
                    Please wait a moment
                  </Text>
                </HStack>
              </Banner>
            )}

            <Divider />

            <MetadataList>
              <MetadataListItem label="Transaction Status">
                <HStack gap={2} vAlign="center">
                  <StatusDot
                    variant={isSuccess ? 'success' : 'error'}
                    label={isSuccess ? 'Payment confirmed' : 'Payment cancelled'}
                  />
                  <Text weight="semibold">
                    {isSuccess ? 'CONFIRMED / PAID' : 'CANCELLED'}
                  </Text>
                </HStack>
              </MetadataListItem>

              {orderCode && (
                <MetadataListItem label="Order Code">
                  <Text type="code" hasTabularNumbers>
                    TXN-{orderCode}
                  </Text>
                </MetadataListItem>
              )}

              <MetadataListItem label="Player Name">
                {username || 'Player'}
              </MetadataListItem>

              <MetadataListItem label="Player ID">
                <Text type="code">{playerId || 'Current Account'}</Text>
              </MetadataListItem>

              <MetadataListItem
                label="Delivery Channel"
                icon={<Icon icon={ShieldCheck} size="xsm" color="success" />}
              >
                In-Game Mailbox &amp; Inventory
              </MetadataListItem>
            </MetadataList>

            <Divider />

            <VStack gap={2} width="100%">
              <Button
                variant="primary"
                size="lg"
                width="100%"
                icon={<Icon icon={Gem} size="sm" />}
                label="Return to Treasury"
                onClick={() => navigate('/profile/topup')}
              />
              <Button
                variant="secondary"
                size="md"
                width="100%"
                icon={<Icon icon={ScrollText} size="sm" />}
                label="View Ledger History"
                onClick={() => navigate('/profile/history')}
              />
            </VStack>

            <Center>
              <Text type="supporting" size="sm" color="secondary">
                Have questions regarding your order?{' '}
                <Link href="/profile/support">Contact Counsel Support</Link>
              </Text>
            </Center>
          </VStack>
        </Card>
      </Center>
    </LayoutWrapper>
  );
};
