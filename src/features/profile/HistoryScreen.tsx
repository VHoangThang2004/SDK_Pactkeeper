import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText,
  RefreshCw,
  ExternalLink,
  XCircle,
  Gem,
} from 'lucide-react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../core/network/apiClient';
import { useSyncStore } from '../../store/syncStore';
import { useTranslation } from '../../core/i18n';

interface PaymentHistory extends Record<string, unknown> {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
  checkoutUrl?: string;
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

const PAYOS_EXPIRY_MS = 15 * 60 * 1000; // Standard PayOS payment window: 15 minutes

const formatTxnTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN', {
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
  const { t, isVietnamese } = useTranslation();

  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { profileUpdateTimestamp } = useSyncStore();

  const fetchHistory = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  useEffect(() => {
    if (profileUpdateTimestamp > 0) {
      fetchHistory(false);
    }
  }, [profileUpdateTimestamp, fetchHistory]);

  useEffect(() => {
    const handleFocus = () => fetchHistory(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchHistory]);

  useEffect(() => {
    const hasPending = history.some((h) => h.status.toUpperCase() === 'PENDING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [history, fetchHistory]);

  useEffect(() => {
    const hasPending = history.some((h) => h.status.toUpperCase() === 'PENDING');
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

  const classifyOrder = useCallback(
    (txn: PaymentHistory) => {
      const upper = txn.status.toUpperCase();
      const isCompleted = upper === 'CONFIRMED' || upper === 'PAID';
      const isPending = upper === 'PENDING';
      const remainingSec = getRemainingSeconds(txn.createdAt);
      const isExpired = isPending && remainingSec <= 0;
      const isActivePending = isPending && !isExpired;
      const isCancelledOrExpired = upper === 'CANCELLED' || isExpired;
      return {
        isCompleted,
        isActivePending,
        isExpired,
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
    for (const txn of history) {
      const state = classifyOrder(txn);
      if (state.isCompleted) completed++;
      else if (state.isActivePending) pending++;
      else if (state.isCancelledOrExpired) cancelled++;
    }
    return { all: history.length, completed, pending, cancelled };
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
          body: 'Payment link unavailable for this order. Please initiate a new order.',
          type: 'error',
        });
        return;
      }
      window.location.href = checkoutUrl;
    },
    [showToast]
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
          body: `Pending order TXN-${cancelTargetOrder} has been cancelled.`,
          type: 'info',
        });
        setCancelTargetOrder(null);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      console.error('Failed to cancel order:', err);
      showToast({
        body: axiosErr.response?.data?.message || 'Failed to cancel the pending order.',
        type: 'error',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const renderStatus = useCallback(
    (txn: PaymentHistory) => {
      const { isCompleted, isActivePending, isExpired, remainingSec } = classifyOrder(txn);
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
      return (
        <HStack gap={2} vAlign="center">
          <StatusDot variant="error" label={isExpired ? 'Order expired' : 'Order cancelled'} />
          <Text size="sm" color="secondary">
            {isExpired ? t('history.statusExpired') : t('history.statusCancelled')}
          </Text>
        </HStack>
      );
    },
    [classifyOrder, t]
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
              {formatTxnTime(txn.createdAt)}
            </Text>
          </VStack>
        ),
      },
      {
        key: 'gemsAmount',
        header: t('history.reward'),
        width: proportional(1.3, { minWidth: 150 }),
        renderCell: (txn) => {
          const { isCompleted } = classifyOrder(txn);
          return (
            <VStack gap={0.5}>
              <HStack gap={1.5} vAlign="center">
                <Gem size={14} aria-hidden="true" />
                <Text weight="semibold" hasTabularNumbers>
                  {txn.gemsAmount > 0
                    ? `+${txn.gemsAmount.toLocaleString('en-US')} Gem`
                    : (isVietnamese ? 'Gói Khế Ước' : 'Pact Package')}
                </Text>
              </HStack>
              <Text type="supporting" size="2xs" color="secondary">
                {isCompleted ? t('history.dispatchedToMail') : t('history.awaitingClearance')}
              </Text>
            </VStack>
          );
        },
      },
      {
        key: 'amount',
        header: t('history.paidTithe'),
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
        width: proportional(1.4, { minWidth: 180 }),
        renderCell: (txn) => {
          const { isActivePending } = classifyOrder(txn);
          if (!isActivePending) {
            return (
              <Text type="supporting" size="xsm" color="secondary">
                —
              </Text>
            );
          }
          return (
            <HStack gap={2} hAlign="end" wrap="wrap">
              {txn.checkoutUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ExternalLink size={14} aria-hidden="true" />}
                  label="VietQR"
                  onClick={() => handlePayNow(txn.checkoutUrl)}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<XCircle size={14} aria-hidden="true" />}
                label={t('history.cancelOrder')}
                onClick={() => setCancelTargetOrder(txn.orderCode)}
              />
            </HStack>
          );
        },
      },
    ],
    [classifyOrder, handlePayNow, isVietnamese, renderStatus, t]
  );

  return (
    <VStack gap={5}>
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={2}>{t('history.title')}</Heading>
          <Text type="supporting" color="secondary">
            {t('history.subtitle')}
          </Text>
        </VStack>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} aria-hidden="true" />}
          label={isRefreshing ? t('history.syncing') : t('history.syncRecords')}
          isLoading={isRefreshing}
          isDisabled={isLoading || isRefreshing}
          onClick={() => fetchHistory(false)}
        />
      </HStack>

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

      {isLoading && history.length === 0 ? (
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
            icon={<ScrollText size={32} aria-hidden="true" />}
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
        <>
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
              {filteredHistory.map((txn) => {
                const { isActivePending } = classifyOrder(txn);
                return (
                  <ListItem
                    key={txn.orderCode}
                    align="start"
                    label={
                      <HStack hAlign="between" vAlign="center" gap={2}>
                        <Text weight="semibold" hasTabularNumbers>
                          {txn.gemsAmount > 0
                            ? `+${txn.gemsAmount.toLocaleString('en-US')} Gem`
                            : (isVietnamese ? 'Gói Khế Ước' : 'Pact Package')}
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
                            {formatTxnTime(txn.createdAt)}
                          </Text>
                        </HStack>
                        {renderStatus(txn)}
                        {isActivePending && (
                          <HStack gap={2} wrap="wrap">
                            {txn.checkoutUrl && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={<ExternalLink size={14} aria-hidden="true" />}
                                label="VietQR"
                                onClick={() => handlePayNow(txn.checkoutUrl)}
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<XCircle size={14} aria-hidden="true" />}
                              label={t('history.cancelOrder')}
                              onClick={() => setCancelTargetOrder(txn.orderCode)}
                            />
                          </HStack>
                        )}
                      </VStack>
                    }
                  />
                );
              })}
            </List>
          </Card>
        </>
      )}

      <AlertDialog
        isOpen={Boolean(cancelTargetOrder)}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setCancelTargetOrder(null);
        }}
        title={t('history.cancelConfirmTitle')}
        description={
          isVietnamese
            ? `Bạn có chắc chắn muốn hủy đơn hàng TXN-${cancelTargetOrder ?? ''}? Mã thanh toán PayOS VietQR sẽ bị vô hiệu hóa ngay lập tức.`
            : `Are you sure you want to cancel pending order TXN-${cancelTargetOrder ?? ''}? The PayOS VietQR link will be invalidated immediately.`
        }
        actionLabel={t('history.cancelOrder')}
        cancelLabel={t('history.keepOrder')}
        actionVariant="destructive"
        isActionLoading={isCancelling}
        onAction={handleConfirmCancelOrder}
      />
    </VStack>
  );
};
