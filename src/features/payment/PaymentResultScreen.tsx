import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ScrollText, Gem, ShieldCheck } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import { useTranslation } from '../../core/i18n';

export const PaymentResultScreen: React.FC<{ isSuccess: boolean }> = ({ isSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, playerId } = useAuthStore();
  const { t, isVietnamese } = useTranslation();

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
          <VStack gap={5}>
            <VStack gap={3} hAlign="center">
              {isSuccess ? (
                <CheckCircle2
                  size={56}
                  style={{ color: 'var(--color-positive)' }}
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  size={56}
                  style={{ color: 'var(--color-negative)' }}
                  aria-hidden="true"
                />
              )}

              <Heading level={2}>
                {isSuccess ? t('paymentResult.successTitle') : t('paymentResult.cancelTitle')}
              </Heading>

              <Center>
                <Text type="supporting" color="secondary">
                  {isSuccess
                    ? t('paymentResult.successSubtitle')
                    : t('paymentResult.cancelSubtitle')}
                </Text>
              </Center>
            </VStack>

            {isSyncing && (
              <Banner
                status="info"
                title={t('paymentResult.reconcilingOrder')}
                description={t('paymentResult.reconcilingDesc')}
                collapsible={false}
              >
                <HStack gap={2} vAlign="center">
                  <Spinner size="sm" />
                  <Text type="supporting" size="sm">
                    {isVietnamese ? 'Vui lòng chờ trong giây lát' : 'Please wait a moment'}
                  </Text>
                </HStack>
              </Banner>
            )}

            <Divider />

            <MetadataList>
              <MetadataListItem label={t('paymentResult.transactionStatus')}>
                <HStack gap={2} vAlign="center">
                  <StatusDot
                    variant={isSuccess ? 'success' : 'error'}
                    label={isSuccess ? 'Payment confirmed' : 'Payment cancelled'}
                  />
                  <Text weight="semibold">
                    {isSuccess
                      ? (isVietnamese ? 'ĐÃ XÁC NHẬN / HOÀN TẤT' : 'CONFIRMED / PAID')
                      : (isVietnamese ? 'ĐÃ HỦY' : 'CANCELLED')}
                  </Text>
                </HStack>
              </MetadataListItem>

              {orderCode && (
                <MetadataListItem label={t('history.order')}>
                  <Text type="code" hasTabularNumbers>
                    TXN-{orderCode}
                  </Text>
                </MetadataListItem>
              )}

              <MetadataListItem label={t('paymentResult.targetCharacter')}>
                {username || t('common.player')}
              </MetadataListItem>

              <MetadataListItem label={t('common.uid')}>
                <Text type="code">{playerId || (isVietnamese ? 'Tài khoản hiện tại' : 'Current Account')}</Text>
              </MetadataListItem>

              <MetadataListItem
                label={t('paymentResult.deliveryChannel')}
                icon={<ShieldCheck size={14} aria-hidden="true" />}
              >
                {t('paymentResult.inGameMailbox')}
              </MetadataListItem>
            </MetadataList>

            <Divider />

            <VStack gap={2}>
              <Button
                variant="primary"
                size="lg"
                width="fill"
                icon={<Gem size={16} aria-hidden="true" />}
                label={t('paymentResult.returnToTreasury')}
                onClick={() => navigate('/profile/topup')}
              />
              <Button
                variant="secondary"
                size="md"
                width="fill"
                icon={<ScrollText size={16} aria-hidden="true" />}
                label={t('paymentResult.viewLedgerHistory')}
                onClick={() => navigate('/profile/history')}
              />
            </VStack>

            <Center>
              <Text type="supporting" size="sm" color="secondary">
                {t('paymentResult.supportPrompt')}{' '}
                <Link href="/profile/support">{t('paymentResult.contactSupport')}</Link>
              </Text>
            </Center>
          </VStack>
        </Card>
      </Center>
    </LayoutWrapper>
  );
};
