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
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Layout, LayoutContent, LayoutFooter, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
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

const formatMissiveTime = (dateStr: string | undefined, language: Language, full = false): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: full ? 'numeric' : undefined,
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
  const [selectedNote, setSelectedNote] = useState<NotificationModel | null>(null);

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

  const handleOpenDetail = (note: NotificationModel) => {
    setSelectedNote({ ...note, read: true });
    if (!note.read) {
      markAsRead(note);
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
        return <Icon icon={CheckCircle2} size="md" color="success" />;
      case 'error':
        return <Icon icon={XCircle} size="md" color="error" />;
      case 'promo':
        return <Icon icon={Gift} size="md" color="warning" />;
      default:
        return <Icon icon={Info} size="md" color="accent" />;
    }
  };

  const showColdSkeleton = !notificationsLoaded && notifications.length === 0;

  return (
    <VStack gap={4} width="100%">
      {/* Compact Overview Strip */}
      <Grid columns={{ minWidth: 220, max: 3, repeat: 'fit' }} gap={3} width="100%">
        <Card variant="muted" padding={3} className="compactStatCard">
          <HStack hAlign="between" vAlign="center" width="100%">
            <HStack gap={2} vAlign="center">
              <Icon icon={Mail} size="md" color="accent" />
              <Text type="supporting" size="sm" color="secondary" weight="semibold">
                {t('missives.unreadNotices')}
              </Text>
            </HStack>
            {showColdSkeleton ? (
              <Skeleton width={40} height={26} />
            ) : (
              <HStack gap={1.5} vAlign="center">
                <Text type="large" size="2xl" weight="bold" hasTabularNumbers>
                  {counts.unread}
                </Text>
                {counts.unread > 0 && (
                  <StatusDot variant="accent" label="Unread available" isPulsing />
                )}
              </HStack>
            )}
          </HStack>
        </Card>

        <Card variant="muted" padding={3} className="compactStatCard">
          <HStack hAlign="between" vAlign="center" width="100%">
            <HStack gap={2} vAlign="center">
              <Icon icon={Inbox} size="md" color="secondary" />
              <Text type="supporting" size="sm" color="secondary" weight="semibold">
                {t('missives.totalArchives')}
              </Text>
            </HStack>
            {showColdSkeleton ? (
              <Skeleton width={40} height={26} />
            ) : (
              <Text type="large" size="2xl" weight="bold" hasTabularNumbers>
                {counts.all}
              </Text>
            )}
          </HStack>
        </Card>

        <Card variant="muted" padding={3} className="compactStatCard">
          <HStack hAlign="between" vAlign="center" width="100%">
            <HStack gap={2} vAlign="center">
              <Icon icon={Radio} size="md" color="success" />
              <Text type="supporting" size="sm" color="secondary" weight="semibold">
                {t('missives.systemChannel')}
              </Text>
            </HStack>
            <HStack gap={1.5} vAlign="center">
              <StatusDot variant="success" label="Active" isPulsing />
              <Text type="supporting" size="sm" weight="semibold">
                {t('missives.liveDispatchActive')}
              </Text>
            </HStack>
          </HStack>
        </Card>
      </Grid>

      {/* Filter Tabs & Mark All Read */}
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
            endContent={
              counts.unread > 0 ? <Badge label={counts.unread} variant="error" /> : undefined
            }
          />
          <Tab
            value="payment"
            label={t('missives.tabTransaction')}
            endContent={
              counts.payment > 0 ? <Badge label={counts.payment} variant="neutral" /> : undefined
            }
          />
          <Tab
            value="system"
            label={t('missives.tabSystem')}
            endContent={
              counts.system > 0 ? <Badge label={counts.system} variant="neutral" /> : undefined
            }
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

      {/* Notification List */}
      {showColdSkeleton ? (
        <Card padding={4}>
          <VStack gap={3}>
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
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
        <VStack key={activeFilter} width="100%" className="tabPanelMotion">
          <Card padding={0}>
            <VStack width="100%" className="scrollablePanelBody">
              <List density="balanced" hasDividers edge="bleed">
              {filteredNotifications.map((note) => {
                const isPayment = isPaymentNotification(note);
                return (
                  <ListItem
                    key={note.id}
                    align="center"
                    className={
                      note.read ? 'clickableRow' : 'clickableRow missiveRowUnread'
                    }
                    startContent={renderTypeIcon(note.type)}
                    label={
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Text
                          weight={note.read ? 'semibold' : 'bold'}
                          size="base"
                          color="primary"
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
                        {!note.read && (
                          <StatusDot variant="accent" label="Unread notification" isPulsing />
                        )}
                      </HStack>
                    }
                    description={
                      <Text type="body" size="sm" color="secondary" display="block">
                        {note.message}
                      </Text>
                    }
                    endContent={
                      <HStack gap={3} vAlign="center">
                        <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
                          {formatMissiveTime(note.createdAt, language)}
                        </Text>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Icon icon={Eye} size="xsm" />}
                          label={t('missives.viewDetailAction')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(note);
                          }}
                        />
                      </HStack>
                    }
                    onClick={() => handleOpenDetail(note)}
                  />
                );
              })}
              </List>
            </VStack>
            {filteredNotifications.length > 5 && (
              <HStack hAlign="between" vAlign="center" className="scrollFooterBar">
                <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
                  {t('missives.showingCount', { count: filteredNotifications.length })}
                </Text>
                <Text type="supporting" size="sm" color="secondary">
                  {t('missives.scrollHint')}
                </Text>
              </HStack>
            )}
          </Card>
        </VStack>
      )}

      {/* Detailed Notification Modal */}
      <Dialog
        isOpen={Boolean(selectedNote)}
        onOpenChange={(open) => {
          if (!open) setSelectedNote(null);
        }}
        width={520}
        purpose="info"
      >
        {selectedNote && (() => {
          const isPayment = isPaymentNotification(selectedNote);
          return (
            <Layout
              height="auto"
              defaultHasDividers={false}
              header={
                <DialogHeader
                  title={selectedNote.title}
                  subtitle={t('missives.detailTitle')}
                  startContent={renderTypeIcon(selectedNote.type)}
                  onOpenChange={(open) => {
                    if (!open) setSelectedNote(null);
                  }}
                  hasDivider
                />
              }
              content={
                <LayoutContent isScrollable={false}>
                  <VStack gap={4}>
                    <MetadataList>
                      <MetadataListItem label={t('missives.detailCategory')}>
                        <Token
                          size="sm"
                          color={isPayment ? 'yellow' : 'gray'}
                          label={
                            isPayment
                              ? t('missives.categoryPayment')
                              : t('missives.categoryInGame')
                          }
                        />
                      </MetadataListItem>
                      <MetadataListItem label={t('missives.detailStatus')}>
                        {t('missives.readStatus')}
                      </MetadataListItem>
                      <MetadataListItem label={t('missives.detailTime')}>
                        {formatMissiveTime(selectedNote.createdAt, language, true)}
                      </MetadataListItem>
                    </MetadataList>

                    <Card variant="muted" padding={4} width="100%">
                      <VStack gap={1.5}>
                        <Text type="supporting" size="sm" weight="semibold" color="secondary">
                          {t('missives.detailMessage')}
                        </Text>
                        <Text type="body" size="base" color="primary" display="block">
                          {selectedNote.message}
                        </Text>
                      </VStack>
                    </Card>

                    {!isPayment && /claim/i.test(selectedNote.message) && (
                      <Banner
                        status="info"
                        title={t('missives.categoryInGame')}
                        description={t('missives.inGameNoteHint')}
                      />
                    )}
                  </VStack>
                </LayoutContent>
              }
              footer={
                <LayoutFooter hasDivider>
                  <HStack gap={2} hAlign="end" wrap="wrap" width="100%">
                    {isPayment && (
                      <>
                        <Button
                          variant="secondary"
                          icon={<Icon icon={MessageSquare} size="xsm" />}
                          label={t('missives.contactSupportAction')}
                          onClick={() => {
                            setSelectedNote(null);
                            navigate('/profile/support');
                          }}
                        />
                        <Button
                          variant="secondary"
                          icon={<Icon icon={Receipt} size="xsm" />}
                          label={t('missives.viewOrderHistory')}
                          onClick={() => {
                            setSelectedNote(null);
                            navigate('/profile/history');
                          }}
                        />
                      </>
                    )}
                    <Button
                      variant="primary"
                      label={t('common.close')}
                      onClick={() => setSelectedNote(null)}
                    />
                  </HStack>
                </LayoutFooter>
              }
            />
          );
        })()}
      </Dialog>
    </VStack>
  );
};
