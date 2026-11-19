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
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../core/network/apiClient';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSyncStore } from '../../store/syncStore';

interface PaymentHistory extends Record<string, unknown> {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
  checkoutUrl?: string;
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

const PAYOS_EXPIRY_MS = 15 * 60 * 1000;

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const isMobile = useIsMobile();

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
              Delivered
            </Text>
          </HStack>
        );
      }
      if (isActivePending) {
        return (
          <HStack gap={2} vAlign="center">
            <StatusDot variant="warning" label="Payment pending" isPulsing />
            <Text size="sm" weight="medium" hasTabularNumbers>
              Pending ({formatCountdown(remainingSec)})
            </Text>
          </HStack>
        );
      }
      return (
        <HStack gap={2} vAlign="center">
          <StatusDot variant="error" label={isExpired ? 'Order expired' : 'Order cancelled'} />
          <Text size="sm" color="secondary">
            {isExpired ? 'Expired' : 'Cancelled'}
          </Text>
        </HStack>
      );
    },
    [classifyOrder]
  );

  const columns: TableColumn<PaymentHistory>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        header: 'Order',
        width: proportional(1.4, { minWidth: 160 }),
        renderCell: (txn) => (
          <VStack gap={0.5}>
            <Text type="code" weight="semibold" hasTabularNumbers>
              TXN-{txn.orderCode}
            </Text>
            <Timestamp value={txn.createdAt} format="date_time" size="2xs" color="secondary" />
          </VStack>
        ),
      },
      {
        key: 'gemsAmount',
        header: 'Reward',
        width: proportional(1.3, { minWidth: 150 }),
        renderCell: (txn) => {
          const { isCompleted } = classifyOrder(txn);
          return (
            <VStack gap={0.5}>
              <HStack gap={1.5} vAlign="center">
                <Icon icon={Gem} size="xsm" color="cyan" />
                <Text weight="semibold" hasTabularNumbers>
                  {txn.gemsAmount > 0
                    ? `+${txn.gemsAmount.toLocaleString('en-US')} Gems`
                    : 'Pact Package'}
                </Text>
              </HStack>
              <Text type="supporting" size="2xs" color="secondary">
                {isCompleted ? 'Dispatched to In-Game Mail' : 'Awaiting Payment Clearance'}
              </Text>
            </VStack>
          );
        },
      },
      {
        key: 'amount',
        header: 'Paid Tithe',
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
        header: 'Status',
        width: proportional(1.1, { minWidth: 140 }),
        renderCell: (txn) => renderStatus(txn),
      },
      {
        key: 'actions',
        header: 'Actions',
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
                  icon={<Icon icon={ExternalLink} size="xsm" />}
                  label="VietQR"
                  onClick={() => handlePayNow(txn.checkoutUrl)}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon icon={XCircle} size="xsm" />}
                label="Cancel"
                onClick={() => setCancelTargetOrder(txn.orderCode)}
              />
            </HStack>
          );
        },
      },
    ],
    [classifyOrder, handlePayNow, renderStatus]
  );

  return (
    <VStack gap={5} width="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3} width="100%">
        <VStack gap={1}>
          <Heading level={2}>Transaction Records</Heading>
          <Text type="supporting" color="secondary">
            Official payment history and real-time order ledger
          </Text>
        </VStack>

        <Button
          variant="secondary"
          size="sm"
          icon={<Icon icon={RefreshCw} size="xsm" />}
          label={isRefreshing ? 'Syncing...' : 'Sync Records'}
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
          label="All Orders"
          endContent={<Badge label={counts.all} />}
        />
        <Tab
          value="completed"
          label="Completed"
          endContent={counts.completed > 0 ? <Badge label={counts.completed} /> : undefined}
        />
        <Tab
          value="pending"
          label="Pending Payment"
          endContent={
            counts.pending > 0 ? <Badge label={counts.pending} variant="warning" /> : undefined
          }
        />
        <Tab
          value="cancelled"
          label="Cancelled / Expired"
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
            icon={<Icon icon={ScrollText} size="lg" color="secondary" />}
            title="No Transactions Found"
            description="No orders match the selected filter. Visit the Treasury to acquire Gems."
            actions={
              <Button
                variant="primary"
                label="Go to Treasury"
                onClick={() => navigate('/profile/topup')}
              />
            }
          />
        </Card>
      ) : !isMobile ? (
        <Card padding={0}>
          <Table
            data={filteredHistory}
            columns={columns}
            idKey="orderCode"
            density="balanced"
            dividers="rows"
            hasHover
          />
        </Card>
      ) : (
        <Card padding={0}>
          <List hasDividers edge="bleed">
            {filteredHistory.map((txn) => {
              const { isActivePending } = classifyOrder(txn);
              return (
                <ListItem
                  key={txn.orderCode}
                  align="start"
                  label={
                    <HStack hAlign="between" vAlign="center" gap={2} width="100%">
                      <Text weight="semibold" hasTabularNumbers>
                        {txn.gemsAmount > 0
                          ? `+${txn.gemsAmount.toLocaleString('en-US')} Gems`
                          : 'Pact Package'}
                      </Text>
                      <Text weight="semibold" hasTabularNumbers>
                        {txn.amount.toLocaleString('vi-VN')} VND
                      </Text>
                    </HStack>
                  }
                  description={
                    <VStack gap={2} width="100%">
                      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2} width="100%">
                        <Text type="code" size="2xs" color="secondary" hasTabularNumbers>
                          TXN-{txn.orderCode}
                        </Text>
                        <Timestamp value={txn.createdAt} format="date_time" size="2xs" color="secondary" />
                      </HStack>
                      {renderStatus(txn)}
                      {isActivePending && (
                        <HStack gap={2} wrap="wrap">
                          {txn.checkoutUrl && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Icon icon={ExternalLink} size="xsm" />}
                              label="Pay with VietQR"
                              onClick={() => handlePayNow(txn.checkoutUrl)}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icon icon={XCircle} size="xsm" />}
                            label="Cancel Order"
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
      )}

      <AlertDialog
        isOpen={Boolean(cancelTargetOrder)}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setCancelTargetOrder(null);
        }}
        title="Cancel Pending Order?"
        description={`Are you sure you want to cancel pending order TXN-${cancelTargetOrder ?? ''}? The PayOS VietQR link will be invalidated immediately.`}
        actionLabel="Cancel Order"
        cancelLabel="Keep Order"
        actionVariant="destructive"
        isActionLoading={isCancelling}
        onAction={handleConfirmCancelOrder}
      />
    </VStack>
  );
};
