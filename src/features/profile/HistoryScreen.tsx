import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText,
  RefreshCw,
  ExternalLink,
  XCircle,
  Gem,
  Receipt,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../core/network/apiClient';
import { useAuthStore } from '../../store/authStore';
import { usePortalDataStore, type PaymentHistory } from '../../store/portalDataStore';
import { useSyncStore } from '../../store/syncStore';
import { useTranslation, type Language } from '../../core/i18n';

type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

const PAYOS_EXPIRY_MS = 15 * 60 * 1000; // Standard PayOS payment window: 15 minutes

const formatTxnTime = (dateStr: string | undefined, language: Language): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { t, language } = useTranslation();
  const { username, playerId } = useAuthStore();
  const { history, historyLoaded, fetchHistory, setHistory } = usePortalDataStore();
  const { profileUpdateTimestamp } = useSyncStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<PaymentHistory | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const syncHistory = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        await fetchHistory();
      } finally {
        if (showSpinner) setIsRefreshing(false);
      }
    },
    [fetchHistory]
  );

  useEffect(() => {
    syncHistory(false);
  }, [syncHistory]);

  useEffect(() => {
    if (profileUpdateTimestamp > 0) {
      syncHistory(false);
    }
  }, [profileUpdateTimestamp, syncHistory]);

  useEffect(() => {
    const handleFocus = () => syncHistory(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncHistory]);

  useEffect(() => {
    const hasPending = history.some((h) => (h.status || '').trim().toUpperCase() === 'PENDING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      syncHistory(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [history, syncHistory]);

  useEffect(() => {
    const hasPending = history.some((h) => (h.status || '').trim().toUpperCase() === 'PENDING');
    if (!hasPending) return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [history]);

  const getRemainingSeconds = useCallback(
    (createdAtStr: string): number => {
      const createdTime = new Date(createdAtStr).getTime();
      const remainingMs = createdTime + PAYOS_EXPIRY_MS - currentTime;
      return Math.max(0, Math.floor(remainingMs / 1000));
    },
    [currentTime]
  );

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Exhaustive, mutually exclusive classification so tab counts always match rendered rows
  const classifyOrder = useCallback(
    (txn: PaymentHistory) => {
      const upper = (txn.status || '').trim().toUpperCase();
      const isCompleted = upper === 'CONFIRMED' || upper === 'PAID' || upper === 'COMPLETED';
      const isPending = upper === 'PENDING' || upper === 'PROCESSING';
      const remainingSec = getRemainingSeconds(txn.createdAt);
      const isExpired = (isPending && remainingSec <= 0) || upper === 'EXPIRED';
      const isFailed = upper === 'FAILED';
      const isActivePending = isPending && !isExpired;
      const isCancelledOrExpired = !isCompleted && !isActivePending;
      return {
        isCompleted,
        isActivePending,
        isExpired,
        isFailed,
        isCancelledOrExpired,
        remainingSec,
      };
    },
    [getRemainingSeconds]
  );

  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let deliveredGems = 0;
    for (const txn of history) {
      const state = classifyOrder(txn);
      if (state.isCompleted) {
        completed++;
        deliveredGems += txn.gemsAmount || 0;
      } else if (state.isActivePending) {
        pending++;
      } else {
        cancelled++;
      }
    }
    return { all: history.length, completed, pending, cancelled, deliveredGems };
  }, [history, classifyOrder]);

  const filteredHistory = useMemo(
    () =>
      history.filter((txn) => {
        const state = classifyOrder(txn);
        if (statusFilter === 'completed') return state.isCompleted;
        if (statusFilter === 'pending') return state.isActivePending;
        if (statusFilter === 'cancelled') return state.isCancelledOrExpired;
        return true;
      }),
    [history, statusFilter, classifyOrder]
  );

  const handlePayNow = useCallback(
    (checkoutUrl?: string) => {
      if (!checkoutUrl) {
        showToast({
          body: t('history.paymentLinkUnavailable'),
          type: 'error',
        });
        return;
      }
      window.location.href = checkoutUrl;
    },
    [showToast, t]
  );

  const handleReportIssue = useCallback(
    (orderCode: string) => {
      navigate('/profile/support', { state: { prefillOrderCode: orderCode } });
    },
    [navigate]
  );

  const handleConfirmCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    setIsCancelling(true);
    try {
      const res = await apiClient.post(`/api/payment/cancel-order/${cancelTargetOrder}`);
      if (res.status === 200) {
        setHistory((prev) =>
          prev.map((item) =>
            item.orderCode === cancelTargetOrder ? { ...item, status: 'CANCELLED' } : item
          )
        );
        showToast({
          body: t('history.cancelSuccess', { orderCode: cancelTargetOrder }),
          type: 'info',
        });
        setCancelTargetOrder(null);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      console.error('Failed to cancel order:', err);
      showToast({
        body:
          axiosErr.response?.data?.message ||
          t('history.cancelError', { orderCode: cancelTargetOrder }),
        type: 'error',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const renderStatus = useCallback(
    (txn: PaymentHistory) => {
      const { isCompleted, isActivePending, isExpired, isFailed, remainingSec } =
        classifyOrder(txn);
      if (isCompleted) {
        return (
          <HStack gap={2} vAlign="center">
            <StatusDot variant="success" label="Order delivered" />
            <Text size="sm" weight="medium">
              {t('history.delivered')}
            </Text>
          </HStack>
        );
      }
      if (isActivePending) {
        return (
          <HStack gap={2} vAlign="center">
            <StatusDot variant="warning" label="Payment pending" isPulsing />
            <Text size="sm" weight="medium" hasTabularNumbers>
              {t('history.statusPending')} ({formatCountdown(remainingSec)})
            </Text>
          </HStack>
        );
      }
      const statusLabel = isExpired
        ? t('history.statusExpired')
        : isFailed
          ? t('history.statusFailed')
          : t('history.statusCancelled');
      return (
        <HStack gap={2} vAlign="center">
          <StatusDot variant="error" label={statusLabel} />
          <Text size="sm" color="secondary">
            {statusLabel}
          </Text>
        </HStack>
      );
    },
    [classifyOrder, t]
  );

  const renderActions = useCallback(
    (txn: PaymentHistory) => {
      const { isCompleted, isActivePending } = classifyOrder(txn);
      if (isActivePending) {
        return (
          <HStack gap={2} hAlign="end" wrap="wrap">
            {txn.checkoutUrl && (
              <Button
                variant="primary"
                size="sm"
                icon={<Icon icon={ExternalLink} size="xsm" />}
                label={t('history.payWithVietQr')}
                onClick={() => handlePayNow(txn.checkoutUrl)}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon icon={XCircle} size="xsm" />}
              label={t('history.cancelOrder')}
              onClick={() => setCancelTargetOrder(txn.orderCode)}
            />
          </HStack>
        );
      }
      if (isCompleted) {
        return (
          <HStack gap={2} hAlign="end" wrap="wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon icon={Receipt} size="xsm" />}
              label={t('history.viewReceipt')}
              onClick={() => setReceiptOrder(txn)}
            />
          </HStack>
        );
      }
      return (
        <HStack gap={2} hAlign="end" wrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon icon={MessageSquare} size="xsm" />}
            label={t('history.reportIssue')}
            onClick={() => handleReportIssue(txn.orderCode)}
          />
        </HStack>
      );
    },
    [classifyOrder, handlePayNow, handleReportIssue, t]
  );

  const columns: TableColumn<PaymentHistory>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        header: t('history.order'),
        width: proportional(1.4, { minWidth: 160 }),
        renderCell: (txn) => (
          <VStack gap={0.5}>
            <Text type="code" size="base" weight="semibold" hasTabularNumbers>
              TXN-{txn.orderCode}
            </Text>
            <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
              {formatTxnTime(txn.createdAt, language)}
            </Text>
          </VStack>
        ),
      },
      {
        key: 'gemsAmount',
        header: t('history.reward'),
        width: proportional(1.3, { minWidth: 150 }),
        renderCell: (txn) => {
          const { isCompleted, isActivePending } = classifyOrder(txn);
          return (
            <VStack gap={0.5}>
              <HStack gap={1.5} vAlign="center">
                <Icon icon={Gem} size="xsm" color="accent" />
                <Text weight="semibold" hasTabularNumbers>
                  {txn.gemsAmount > 0
                    ? `+${txn.gemsAmount.toLocaleString('en-US')} ${t('topup.gems')}`
                    : t('history.pactPackage')}
                </Text>
              </HStack>
              <Text type="supporting" size="sm" color="secondary">
                {isCompleted
                  ? t('history.dispatchedToMail')
                  : isActivePending
                    ? t('history.awaitingClearance')
                    : t('history.orderNotCompleted')}
              </Text>
            </VStack>
          );
        },
      },
      {
        key: 'amount',
        header: t('history.amount'),
        align: 'end',
        width: proportional(1, { minWidth: 120 }),
        renderCell: (txn) => (
          <Text weight="semibold" hasTabularNumbers>
            {txn.amount.toLocaleString('vi-VN')} VND
          </Text>
        ),
      },
      {
        key: 'status',
        header: t('history.status'),
        width: proportional(1.1, { minWidth: 140 }),
        renderCell: (txn) => renderStatus(txn),
      },
      {
        key: 'actions',
        header: t('history.actions'),
        align: 'end',
        width: proportional(1.5, { minWidth: 190 }),
        renderCell: (txn) => renderActions(txn),
      },
    ],
    [classifyOrder, language, renderActions, renderStatus, t]
  );

  const showColdSkeleton = !historyLoaded && history.length === 0;

  return (
    <VStack gap={5}>
      {/* Overview Stat Strip to balance horizontal space */}
      <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={4} width="100%">
        <Card variant="muted" padding={4} className="interactiveCard">
          <HStack gap={3} vAlign="center">
            <Icon icon={Receipt} size="lg" color="accent" />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('history.statTotalOrders')}
              </Text>
              {showColdSkeleton ? (
                <Skeleton width={56} height={32} />
              ) : (
                <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                  {counts.all}
                </Text>
              )}
            </VStack>
          </HStack>
        </Card>

        <Card variant="muted" padding={4} className="interactiveCard">
          <HStack gap={3} vAlign="center">
            <Icon icon={Gem} size="lg" color="accent" />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('history.statCompletedGems')}
              </Text>
              {showColdSkeleton ? (
                <Skeleton width={72} height={32} />
              ) : (
                <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                  {counts.deliveredGems.toLocaleString('en-US')}
                </Text>
              )}
            </VStack>
          </HStack>
        </Card>

        <Card variant="muted" padding={4} className="interactiveCard">
          <HStack gap={3} vAlign="center">
            <Icon icon={Clock} size="lg" color={counts.pending > 0 ? 'warning' : 'secondary'} />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('history.statPendingOrders')}
              </Text>
              {showColdSkeleton ? (
                <Skeleton width={56} height={32} />
              ) : (
                <HStack gap={2} vAlign="center">
                  <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                    {counts.pending}
                  </Text>
                  {counts.pending > 0 && (
                    <StatusDot variant="warning" label="Active pending orders" isPulsing />
                  )}
                </HStack>
              )}
            </VStack>
          </HStack>
        </Card>
      </Grid>

      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <TabList
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as StatusFilter)}
          hasDivider
        >
          <Tab
            value="all"
            label={t('history.tabAll')}
            endContent={<Badge label={counts.all} />}
          />
          <Tab
            value="completed"
            label={t('history.tabCompleted')}
            endContent={counts.completed > 0 ? <Badge label={counts.completed} /> : undefined}
          />
          <Tab
            value="pending"
            label={t('history.tabPending')}
            endContent={
              counts.pending > 0 ? <Badge label={counts.pending} variant="warning" /> : undefined
            }
          />
          <Tab
            value="cancelled"
            label={t('history.tabCancelled')}
            endContent={counts.cancelled > 0 ? <Badge label={counts.cancelled} /> : undefined}
          />
        </TabList>

        <Button
          variant="secondary"
          size="sm"
          icon={<Icon icon={RefreshCw} size="xsm" />}
          label={isRefreshing ? t('history.syncing') : t('history.syncRecords')}
          isLoading={isRefreshing}
          isDisabled={showColdSkeleton || isRefreshing}
          onClick={() => syncHistory(true)}
        />
      </HStack>

      {showColdSkeleton ? (
        <Card padding={5}>
          <VStack gap={3}>
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
          </VStack>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card padding={6}>
          <EmptyState
            icon={<Icon icon={ScrollText} size="lg" color="accent" />}
            title={t('history.emptyTitle')}
            description={t('history.emptyDesc')}
            actions={
              <Button
                variant="primary"
                label={t('history.goToTreasury')}
                onClick={() => navigate('/profile/topup')}
              />
            }
          />
        </Card>
      ) : (
        <VStack key={statusFilter} width="100%" className="tabPanelMotion">
          <Card padding={0} className="desktopOnly">
            <Table
              data={filteredHistory}
              columns={columns}
              idKey="orderCode"
              density="balanced"
              dividers="rows"
              hasHover
            />
          </Card>

          <Card padding={0} className="mobileOnly">
            <List hasDividers edge="bleed">
              {filteredHistory.map((txn) => (
                <ListItem
                  key={txn.orderCode}
                  align="start"
                  label={
                    <HStack hAlign="between" vAlign="center" gap={2}>
                      <Text weight="semibold" hasTabularNumbers>
                        {txn.gemsAmount > 0
                          ? `+${txn.gemsAmount.toLocaleString('en-US')} ${t('topup.gems')}`
                          : t('history.pactPackage')}
                      </Text>
                      <Text weight="semibold" hasTabularNumbers>
                        {txn.amount.toLocaleString('vi-VN')} VND
                      </Text>
                    </HStack>
                  }
                  description={
                    <VStack gap={2}>
                      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                        <Text type="code" size="sm" color="secondary" hasTabularNumbers>
                          TXN-{txn.orderCode}
                        </Text>
                        <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
                          {formatTxnTime(txn.createdAt, language)}
                        </Text>
                      </HStack>
                      {renderStatus(txn)}
                      <HStack gap={2} wrap="wrap">
                        {renderActions(txn)}
                      </HStack>
                    </VStack>
                  }
                />
              ))}
            </List>
          </Card>
        </VStack>
      )}

      <AlertDialog
        isOpen={Boolean(cancelTargetOrder)}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setCancelTargetOrder(null);
        }}
        title={t('history.cancelConfirmTitle')}
        description={t('history.cancelConfirmDesc', { orderCode: cancelTargetOrder ?? '' })}
        actionLabel={t('history.cancelOrder')}
        cancelLabel={t('history.keepOrder')}
        actionVariant="destructive"
        isActionLoading={isCancelling}
        onAction={handleConfirmCancelOrder}
      />

      <Dialog
        isOpen={Boolean(receiptOrder)}
        onOpenChange={(open) => {
          if (!open) setReceiptOrder(null);
        }}
        width={460}
        purpose="info"
      >
        {receiptOrder && (
          <Layout
            height="auto"
            defaultHasDividers={false}
            header={
              <DialogHeader
                title={t('history.receiptTitle')}
                subtitle={t('history.receiptSubtitle')}
                startContent={<Icon icon={Receipt} color="accent" size="md" />}
                onOpenChange={(open) => {
                  if (!open) setReceiptOrder(null);
                }}
                hasDivider
              />
            }
            content={
              <LayoutContent isScrollable={false}>
                <MetadataList>
                  <MetadataListItem label={t('history.order')}>
                    <Text type="code" hasTabularNumbers>
                      TXN-{receiptOrder.orderCode}
                    </Text>
                  </MetadataListItem>
                  <MetadataListItem label={t('history.reward')}>
                    <Text weight="semibold" hasTabularNumbers>
                      {receiptOrder.gemsAmount > 0
                        ? `+${receiptOrder.gemsAmount.toLocaleString('en-US')} ${t('topup.gems')}`
                        : t('history.pactPackage')}
                    </Text>
                  </MetadataListItem>
                  <MetadataListItem label={t('history.amount')}>
                    <Text weight="semibold" hasTabularNumbers>
                      {receiptOrder.amount.toLocaleString('vi-VN')} VND
                    </Text>
                  </MetadataListItem>
                  <MetadataListItem label={t('history.receiptRecipient')}>
                    {username || t('common.player')} ({playerId || t('common.currentAccount')})
                  </MetadataListItem>
                  <MetadataListItem label={t('history.receiptPaymentMethod')}>
                    PayOS (VietQR / Napas 247)
                  </MetadataListItem>
                  <MetadataListItem label={t('history.receiptDelivery')}>
                    {t('history.receiptDeliveryDone')}
                  </MetadataListItem>
                  <MetadataListItem label={t('history.receiptTime')}>
                    {formatTxnTime(receiptOrder.createdAt, language)}
                  </MetadataListItem>
                </MetadataList>
              </LayoutContent>
            }
            footer={
              <LayoutFooter hasDivider>
                <HStack gap={2} hAlign="end" width="100%">
                  <Button
                    label={t('history.reportIssue')}
                    variant="secondary"
                    icon={<Icon icon={MessageSquare} size="xsm" />}
                    onClick={() => {
                      const code = receiptOrder.orderCode;
                      setReceiptOrder(null);
                      handleReportIssue(code);
                    }}
                  />
                  <Button
                    label={t('common.close')}
                    variant="primary"
                    onClick={() => setReceiptOrder(null)}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        )}
      </Dialog>
    </VStack>
  );
};
