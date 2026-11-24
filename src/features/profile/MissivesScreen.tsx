import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellOff,
  CheckCircle2,
  XCircle,
  Gift,
  Info,
  CheckCheck,
  Mail,
  Inbox,
  Radio,
  Receipt,
} from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService } from '../support/services/SupportHubService';
import { usePortalDataStore, type NotificationModel } from '../../store/portalDataStore';
import { useTranslation, type Language } from '../../core/i18n';

type MissiveFilter = 'all' | 'unread' | 'payment' | 'system';

const PAYMENT_KEYWORD_REGEX =
  /\b(payment|payos|vnd|pact|order|txn|top-?up|tithe|gem|receipt|checkout|cancelled|failed|thanh toán|giao dịch|đơn hàng|nạp)\b/i;

const isPaymentNotification = (note: NotificationModel): boolean => {
  const type = (note.type || '').toLowerCase();
  if (type === 'payment' || type === 'billing' || type === 'transaction' || type === 'error') {
    return true;
  }
  return PAYMENT_KEYWORD_REGEX.test(`${note.title} ${note.message}`);
};

const formatMissiveTime = (dateStr: string | undefined, language: Language): string => {
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

export const MissivesScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { notifications, notificationsLoaded, fetchNotifications, setNotifications } =
    usePortalDataStore();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MissiveFilter>('all');

  useEffect(() => {
    let isMounted = true;

    fetchNotifications();
    supportHubService.connect();

    const refresh = () => {
      if (isMounted) fetchNotifications();
    };

    const unsubNotif = supportHubService.onEvent('ReceiveNotification', refresh);
    const unsubProfile = supportHubService.onEvent('ReceiveProfileUpdate', refresh);
    const unsubMsg = supportHubService.onMessage(refresh);
    const unsubRecon = supportHubService.onReconnected(refresh);

    const interval = setInterval(refresh, 6000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      isMounted = false;
      unsubNotif();
      unsubProfile();
      unsubMsg();
      unsubRecon();
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [fetchNotifications]);

  const counts = useMemo(() => {
    let unread = 0;
    let payment = 0;
    let system = 0;
    for (const note of notifications) {
      if (!note.read) unread++;
      if (isPaymentNotification(note)) payment++;
      else system++;
    }
    return { all: notifications.length, unread, payment, system };
  }, [notifications]);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((note) => {
        if (activeFilter === 'unread') return !note.read;
        if (activeFilter === 'payment') return isPaymentNotification(note);
        if (activeFilter === 'system') return !isPaymentNotification(note);
        return true;
      }),
    [notifications, activeFilter]
  );

  const markAsRead = async (note: NotificationModel) => {
    if (note.read) return;
    try {
      const response = await apiClient.post(`/api/notification/${note.id}/read`);
      if (response.status === 200) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    if (counts.unread === 0) return;
    setIsMarkingAll(true);
    try {
      const response = await apiClient.post('/api/notification/read-all');
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderTypeIcon = (type?: string) => {
    const normalized = (type || 'info').toLowerCase();
    switch (normalized) {
      case 'success':
        return <Icon icon={CheckCircle2} size="lg" color="success" />;
      case 'error':
        return <Icon icon={XCircle} size="lg" color="error" />;
      case 'promo':
        return <Icon icon={Gift} size="lg" color="warning" />;
      default:
        return <Icon icon={Info} size="lg" color="accent" />;
    }
  };

  const showColdSkeleton = !notificationsLoaded && notifications.length === 0;

  return (
    <VStack gap={5} width="100%">
      {/* Overview Stat Cards (Skeleton instead of fake 0 on cold load) */}
      <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={4} width="100%">
        <Card variant="muted" padding={4} className="interactiveCard">
          <HStack gap={3} vAlign="center">
            <Icon icon={Mail} size="lg" color="accent" />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('missives.unreadNotices')}
              </Text>
              {showColdSkeleton ? (
                <Skeleton width={56} height={32} />
              ) : (
                <HStack gap={2} vAlign="center">
                  <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                    {counts.unread}
                  </Text>
                  {counts.unread > 0 && (
                    <StatusDot variant="accent" label="Unread available" isPulsing />
                  )}
                </HStack>
              )}
            </VStack>
          </HStack>
        </Card>

        <Card variant="muted" padding={4} className="interactiveCard">
          <HStack gap={3} vAlign="center">
            <Icon icon={Inbox} size="lg" color="secondary" />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('missives.totalArchives')}
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
            <Icon icon={Radio} size="lg" color="success" />
            <VStack gap={0.5}>
              <Text type="supporting" size="base" color="secondary" weight="semibold">
                {t('missives.systemChannel')}
              </Text>
              <HStack gap={2} vAlign="center">
                <StatusDot variant="success" label="Active" isPulsing />
                <Text type="body" size="lg" weight="medium">
                  {t('missives.liveDispatchActive')}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Card>
      </Grid>

      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <TabList
          value={activeFilter}
          onChange={(val) => setActiveFilter(val as MissiveFilter)}
          hasDivider
        >
          <Tab
            value="all"
            label={t('missives.tabAll')}
            endContent={<Badge label={counts.all} variant="neutral" />}
          />
          <Tab
            value="unread"
            label={t('missives.tabUnread')}
            endContent={counts.unread > 0 ? <Badge label={counts.unread} variant="error" /> : undefined}
          />
          <Tab
            value="payment"
            label={t('missives.tabTransaction')}
            endContent={counts.payment > 0 ? <Badge label={counts.payment} variant="neutral" /> : undefined}
          />
          <Tab
            value="system"
            label={t('missives.tabSystem')}
            endContent={counts.system > 0 ? <Badge label={counts.system} variant="neutral" /> : undefined}
          />
        </TabList>

        <Button
          variant="secondary"
          size="sm"
          icon={<Icon icon={CheckCheck} size="sm" />}
          label={t('missives.markAllRead')}
          isLoading={isMarkingAll}
          isDisabled={counts.unread === 0 || isMarkingAll}
          onClick={markAllAsRead}
        />
      </HStack>

      {showColdSkeleton ? (
        <Card padding={5}>
          <VStack gap={3}>
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </VStack>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card padding={6}>
          <EmptyState
            icon={<Icon icon={BellOff} size="lg" color="accent" />}
            title={
              notifications.length === 0
                ? t('missives.noMissivesTitle')
                : t('missives.emptyTitle')
            }
            description={
              notifications.length === 0
                ? t('missives.noMissivesDesc')
                : t('missives.emptyDesc')
            }
          />
        </Card>
      ) : (
        <Card padding={0}>
          <List density="spacious" hasDividers edge="bleed">
            {filteredNotifications.map((note) => {
              const isPayment = isPaymentNotification(note);
              return (
                <ListItem
                  key={note.id}
                  align="center"
                  startContent={renderTypeIcon(note.type)}
                  label={
                    <HStack gap={2} vAlign="center" wrap="wrap">
                      <Text
                        weight={note.read ? 'medium' : 'bold'}
                        size="lg"
                        color={note.read ? 'secondary' : 'primary'}
                      >
                        {note.title}
                      </Text>
                      <Token
                        size="sm"
                        color={isPayment ? 'yellow' : 'gray'}
                        label={
                          isPayment
                            ? t('missives.categoryPayment')
                            : t('missives.categoryInGame')
                        }
                      />
                    </HStack>
                  }
                  description={
                    <VStack gap={1.5}>
                      <Text
                        type="body"
                        size="base"
                        color={note.read ? 'disabled' : 'secondary'}
                        display="block"
                      >
                        {note.message}
                      </Text>
                      {isPayment ? (
                        <HStack gap={2}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icon icon={Receipt} size="xsm" />}
                            label={t('missives.viewOrderHistory')}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(note);
                              navigate('/profile/history');
                            }}
                          />
                        </HStack>
                      ) : (
                        /claim/i.test(note.message) && (
                          <Text type="supporting" size="xsm" color="disabled" display="block">
                            {t('missives.inGameNoteHint')}
                          </Text>
                        )
                      )}
                    </VStack>
                  }
                  endContent={
                    <HStack gap={3} vAlign="center">
                      <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
                        {formatMissiveTime(note.createdAt, language)}
                      </Text>
                      {!note.read && (
                        <StatusDot variant="accent" label="Unread notification" isPulsing />
                      )}
                    </HStack>
                  }
                  onClick={() => markAsRead(note)}
                />
              );
            })}
          </List>
        </Card>
      )}
    </VStack>
  );
};
