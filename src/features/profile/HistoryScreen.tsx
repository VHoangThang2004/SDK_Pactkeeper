import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText,
  RefreshCw,
  Clock,
  ExternalLink,
  XCircle,
  Gem,
  CheckCircle2,
} from 'lucide-react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import {
  Table,
  pixel,
  proportional,
  useTableSortable,
  type TableColumn,
  type TableSortState,
} from '@astryxdesign/core/Table';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../core/network/apiClient';
import { useSyncStore } from '../../store/syncStore';
import styles from './HistoryScreen.module.css';

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

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { profileUpdateTimestamp } = useSyncStore();

  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderCode, setCancellingOrderCode] = useState<string | null>(null);
  const [confirmCancelOrderCode, setConfirmCancelOrderCode] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<TableSortState>([
    { sortKey: 'createdAt', direction: 'descending' },
  ]);

  const sortPlugin = useTableSortable<PaymentHistory>({ sort, onSortChange: setSort });

  const fetchHistory = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const response = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  useEffect(() => {
    fetchHistory(false);
  }, [profileUpdateTimestamp, fetchHistory]);

  useEffect(() => {
    const handleFocus = () => fetchHistory(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchHistory]);

  useEffect(() => {
    const hasPending = history.some((h) => h.status.toLowerCase() === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [history, fetchHistory]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingSeconds = useCallback(
    (createdAtStr: string): number => {
      const createdTime = new Date(createdAtStr).getTime();
      const remainingMs = createdTime + PAYOS_EXPIRY_MS - currentTime;
      return Math.max(0, Math.floor(remainingMs / 1000));
    },
    [currentTime]
  );

  const handlePayNow = useCallback(
    (checkoutUrl?: string) => {
      if (!checkoutUrl) {
        toast({
          body: 'Payment link unavailable for this order. Please initiate a new order.',
          type: 'error',
          uniqueID: 'missing-checkout-url',
          collisionBehavior: 'overwrite',
        });
        return;
      }
      window.location.href = checkoutUrl;
    },
    [toast]
  );

  const handleConfirmCancelOrder = async () => {
    const targetOrderCode = confirmCancelOrderCode;
    if (!targetOrderCode) return;

    setCancellingOrderCode(targetOrderCode);
    try {
      const res = await apiClient.post(`/api/payment/cancel-order/${targetOrderCode}`);
      if (res.status === 200) {
        setHistory((prev) =>
          prev.map((item) =>
            item.orderCode === targetOrderCode ? { ...item, status: 'CANCELLED' } : item
          )
        );
        setConfirmCancelOrderCode(null);
        toast({
          body: `Cancelled pending order TXN-${targetOrderCode}.`,
          type: 'info',
          uniqueID: `cancel-${targetOrderCode}`,
        });
      }
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast({
        body: apiMsg || 'Failed to cancel the pending order.',
        type: 'error',
        uniqueID: 'cancel-order-failed',
      });
    } finally {
      setCancellingOrderCode(null);
    }
  };

  const filteredHistory = useMemo(() => {
    const filtered = history.filter((txn) => {
      const statusUpper = txn.status.toUpperCase();
      const isCompleted = statusUpper === 'CONFIRMED' || statusUpper === 'PAID';
      const isPending = statusUpper === 'PENDING';
      const remainingSec = getRemainingSeconds(txn.createdAt);
      const isExpired = isPending && remainingSec <= 0;

      if (statusFilter === 'completed') return isCompleted;
      if (statusFilter === 'pending') return isPending && !isExpired;
      if (statusFilter === 'cancelled') return statusUpper === 'CANCELLED' || isExpired;
      return true;
    });

    if (sort.length === 0) return filtered;
    const activeSort = sort[0];
    const dir = activeSort.direction === 'ascending' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (activeSort.sortKey === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      if (activeSort.sortKey === 'amount') {
        return (a.amount - b.amount) * dir;
      }
      if (activeSort.sortKey === 'gemsAmount') {
        return (a.gemsAmount - b.gemsAmount) * dir;
      }
      return 0;
    });
  }, [history, statusFilter, sort, getRemainingSeconds]);

  const renderStatusBadge = useCallback(
    (txn: PaymentHistory) => {
      const statusUpper = txn.status.toUpperCase();
      const isCompleted = statusUpper === 'CONFIRMED' || statusUpper === 'PAID';
      const isPending = statusUpper === 'PENDING';
      const remainingSec = getRemainingSeconds(txn.createdAt);
      const isExpired = isPending && remainingSec <= 0;

      if (isCompleted) {
        return (
          <Badge variant="success" icon={<CheckCircle2 size={13} />} label="Delivered" />
        );
      }
      if (isPending && !isExpired) {
        return (
          <Badge
            variant="warning"
            icon={<Clock size={13} />}
            label={`Pending (${formatCountdown(remainingSec)})`}
          />
        );
      }
      return (
        <Badge
          variant="error"
          icon={<XCircle size={13} />}
          label={isExpired ? 'Expired' : 'Cancelled'}
        />
      );
    },
    [getRemainingSeconds]
  );

  const columns: TableColumn<PaymentHistory>[] = useMemo(
    () => [
      {
        key: 'orderCode',
        header: 'Order Code',
        width: proportional(1.2, { minWidth: 140 }),
        renderCell: (txn) => (
          <Text type="code" weight="semibold">
            TXN-{txn.orderCode}
          </Text>
        ),
      },
      {
        key: 'createdAt',
        header: 'Date',
        width: proportional(1.2, { minWidth: 150 }),
        sortable: true,
        renderCell: (txn) => <Timestamp value={txn.createdAt} format="date_time" />,
      },
      {
        key: 'gemsAmount',
        header: 'Rewards',
        width: proportional(1.1, { minWidth: 130 }),
        sortable: true,
        renderCell: (txn) => (
          <HStack gap={1.5} vAlign="center">
            <Gem size={15} className={styles.gemIcon} aria-hidden="true" />
            <Text weight="semibold" hasTabularNumbers>
              {txn.gemsAmount > 0
                ? `+${txn.gemsAmount.toLocaleString('en-US')} Gems`
                : 'Pact Package'}
            </Text>
          </HStack>
        ),
      },
      {
        key: 'amount',
        header: 'Paid Tithe',
        align: 'end',
        width: proportional(1, { minWidth: 120 }),
        sortable: true,
        renderCell: (txn) => (
          <Text weight="semibold" hasTabularNumbers className={styles.amountText}>
            {txn.amount.toLocaleString('vi-VN')} VND
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: proportional(1.15, { minWidth: 145 }),
        renderCell: (txn) => renderStatusBadge(txn),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'end',
        resizable: false,
        width: pixel(190),
        renderCell: (txn) => {
          const statusUpper = txn.status.toUpperCase();
          const isCompleted = statusUpper === 'CONFIRMED' || statusUpper === 'PAID';
          const isPending = statusUpper === 'PENDING';
          const isExpired = isPending && getRemainingSeconds(txn.createdAt) <= 0;

          if (isPending && !isExpired) {
            return (
              <HStack gap={1.5} hAlign="end">
                {txn.checkoutUrl && (
                  <Button
                    label="Pay"
                    variant="primary"
                    size="sm"
                    icon={<ExternalLink size={13} />}
                    onClick={() => handlePayNow(txn.checkoutUrl)}
                  />
                )}
                <Button
                  label="Cancel"
                  variant="destructive"
                  size="sm"
                  icon={<XCircle size={13} />}
                  isLoading={cancellingOrderCode === txn.orderCode}
                  onClick={() => setConfirmCancelOrderCode(txn.orderCode)}
                />
              </HStack>
            );
          }

          return (
            <Text type="supporting" size="xsm" color="secondary">
              {isCompleted ? 'In-game mail sent' : 'Closed'}
            </Text>
          );
        },
      },
    ],
    [cancellingOrderCode, getRemainingSeconds, handlePayNow, renderStatusBadge]
  );

  return (
    <VStack gap={4} width="100%">
      {/* Top Header & Sync Button */}
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap" width="100%">
        <VStack gap={0.5}>
          <Heading level={2}>Transaction Records</Heading>
          <Text type="supporting" size="sm" color="secondary">
            Official payment history and real-time order ledger
          </Text>
        </VStack>

        <Button
          label={isLoading ? 'Syncing...' : 'Sync Records'}
          variant="secondary"
          size="md"
          icon={<RefreshCw size={15} className={isLoading ? styles.spinning : ''} />}
          isDisabled={isLoading}
          onClick={() => fetchHistory(true)}
        />
      </HStack>

      {/* Filter Tabs */}
      <TabList
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as StatusFilter)}
        hasDivider
      >
        <Tab value="all" label={`All Orders (${history.length})`} />
        <Tab value="completed" label="Completed" />
        <Tab value="pending" label="Pending Payment" />
        <Tab value="cancelled" label="Cancelled / Expired" />
      </TabList>

      {/* Content */}
      {isLoading && history.length === 0 ? (
        <VStack gap={3} width="100%">
          {[0, 1, 2].map((idx) => (
            <Skeleton key={idx} width="100%" height={72} radius={3} index={idx} />
          ))}
        </VStack>
      ) : filteredHistory.length === 0 ? (
        <Card variant="default" padding={6} width="100%">
          <EmptyState
            icon={<ScrollText size={38} />}
            title="No Transactions Found"
            description="No orders match the selected filter. Visit the Treasury to recharge Gems."
            actions={
              <Button
                label="Go to Treasury"
                variant="primary"
                onClick={() => navigate('/profile/topup')}
              />
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Ledger Table */}
          <div className={styles.desktopTableWrap}>
            <Card variant="default" padding={0} width="100%">
              <Table
                idKey="orderCode"
                data={filteredHistory}
                columns={columns}
                density="balanced"
                dividers="rows"
                hasHover
                plugins={{ sort: sortPlugin }}
              />
            </Card>
          </div>

          {/* Mobile Responsive Ledger Cards */}
          <div className={styles.mobileCardsWrap}>
            <VStack gap={3} width="100%">
              {filteredHistory.map((txn) => {
                const isPending = txn.status.toUpperCase() === 'PENDING';
                const remainingSec = getRemainingSeconds(txn.createdAt);
                const isExpired = isPending && remainingSec <= 0;

                return (
                  <Card key={txn.orderCode} variant="default" padding={4} width="100%">
                    <VStack gap={3}>
                      <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
                        <Text type="code" weight="semibold">
                          TXN-{txn.orderCode}
                        </Text>
                        {renderStatusBadge(txn)}
                      </HStack>

                      <Divider />

                      <MetadataList columns="single" label={{ position: 'start', width: 100 }}>
                        <MetadataListItem label="Date">
                          <Timestamp value={txn.createdAt} format="date_time" />
                        </MetadataListItem>
                        <MetadataListItem label="Rewards">
                          <Text weight="semibold" hasTabularNumbers>
                            {txn.gemsAmount > 0
                              ? `+${txn.gemsAmount.toLocaleString('en-US')} Gems`
                              : 'Pact Package'}
                          </Text>
                        </MetadataListItem>
                        <MetadataListItem label="Paid Tithe">
                          <Text weight="bold" hasTabularNumbers className={styles.amountText}>
                            {txn.amount.toLocaleString('vi-VN')} VND
                          </Text>
                        </MetadataListItem>
                      </MetadataList>

                      {isPending && !isExpired && (
                        <>
                          <Divider />
                          <HStack gap={2} wrap="wrap">
                            {txn.checkoutUrl && (
                              <Button
                                label="Pay with VietQR"
                                variant="primary"
                                size="sm"
                                icon={<ExternalLink size={14} />}
                                onClick={() => handlePayNow(txn.checkoutUrl)}
                              />
                            )}
                            <Button
                              label="Cancel Order"
                              variant="destructive"
                              size="sm"
                              icon={<XCircle size={14} />}
                              isLoading={cancellingOrderCode === txn.orderCode}
                              onClick={() => setConfirmCancelOrderCode(txn.orderCode)}
                            />
                          </HStack>
                        </>
                      )}
                    </VStack>
                  </Card>
                );
              })}
            </VStack>
          </div>
        </>
      )}

      {/* Confirm Order Cancellation */}
      <AlertDialog
        isOpen={Boolean(confirmCancelOrderCode)}
        onOpenChange={(open) => {
          if (!open && !cancellingOrderCode) {
            setConfirmCancelOrderCode(null);
          }
        }}
        title={
          confirmCancelOrderCode
            ? `Cancel order TXN-${confirmCancelOrderCode}?`
            : 'Cancel pending order?'
        }
        description="Cancelling this pending PayOS order voids its payment link immediately. No currency will be deducted."
        cancelLabel="Keep Order"
        actionLabel="Cancel Order"
        actionVariant="destructive"
        isActionLoading={Boolean(cancellingOrderCode)}
        onAction={handleConfirmCancelOrder}
      />
    </VStack>
  );
};
