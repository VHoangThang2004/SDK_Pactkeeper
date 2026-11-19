import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BellOff, CheckCircle2, XCircle, Gift, Info, CheckCheck } from 'lucide-react';
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
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService } from '../support/services/SupportHubService';
import { useSyncStore } from '../../store/syncStore';

interface NotificationModel {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export const MissivesScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const { setUnreadCount } = useSyncStore();

  const fetchNotifications = useCallback(
    async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      try {
        const response = await apiClient.get<NotificationModel[]>('/api/notification');
        if (response.data && Array.isArray(response.data)) {
          setNotifications(response.data);
          const unread = response.data.filter((n) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [setUnreadCount]
  );

  useEffect(() => {
    let isMounted = true;

    fetchNotifications(true);
    supportHubService.connect();

    const unsubNotif = supportHubService.onEvent('ReceiveNotification', () => {
      if (isMounted) fetchNotifications(false);
    });

    const unsubProfile = supportHubService.onEvent('ReceiveProfileUpdate', () => {
      if (isMounted) fetchNotifications(false);
    });

    const unsubMsg = supportHubService.onMessage(() => {
      if (isMounted) fetchNotifications(false);
    });

    const unsubRecon = supportHubService.onReconnected(() => {
      if (isMounted) fetchNotifications(false);
    });

    const interval = setInterval(() => {
      if (isMounted) fetchNotifications(false);
    }, 6000);

    const handleFocus = () => {
      if (isMounted) fetchNotifications(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      unsubNotif();
      unsubProfile();
      unsubMsg();
      unsubRecon();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = async (note: NotificationModel) => {
    if (note.read) return;
    try {
      const response = await apiClient.post(`/api/notification/${note.id}/read`);
      if (response.status === 200) {
        setNotifications((prev) => {
          const next = prev.map((n) => (n.id === note.id ? { ...n, read: true } : n));
          setUnreadCount(next.filter((n) => !n.read).length);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      const response = await apiClient.post('/api/notification/read-all');
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <Icon icon={CheckCircle2} size="sm" color="success" />;
      case 'error':
        return <Icon icon={XCircle} size="sm" color="error" />;
      case 'promo':
        return <Icon icon={Gift} size="sm" color="warning" />;
      default:
        return <Icon icon={Info} size="sm" color="accent" />;
    }
  };

  return (
    <VStack gap={5} width="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3} width="100%">
        <HStack gap={2} vAlign="center">
          <Heading level={2}>Recent Missives</Heading>
          {unreadCount > 0 && <Badge label={unreadCount} variant="info" />}
        </HStack>

        <Button
          variant="secondary"
          size="sm"
          icon={<Icon icon={CheckCheck} size="xsm" />}
          label="Mark all as read"
          isLoading={isMarkingAll}
          isDisabled={unreadCount === 0 || isMarkingAll}
          onClick={markAllAsRead}
        />
      </HStack>

      {isLoading ? (
        <Card padding={5}>
          <VStack gap={3}>
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </VStack>
        </Card>
      ) : notifications.length === 0 ? (
        <Card padding={6}>
          <EmptyState
            icon={<Icon icon={BellOff} size="lg" color="secondary" />}
            title="No Missives Yet"
            description="The raven brought no messages today. Payment confirmations and counsel notices will appear here in real time."
          />
        </Card>
      ) : (
        <Card padding={0}>
          <List hasDividers edge="bleed">
            {notifications.map((note) => (
              <ListItem
                key={note.id}
                align="start"
                startContent={renderTypeIcon(note.type)}
                label={
                  <Text
                    weight={note.read ? 'normal' : 'semibold'}
                    color={note.read ? 'secondary' : 'primary'}
                  >
                    {note.title}
                  </Text>
                }
                description={
                  <Text type="supporting" color="secondary">
                    {note.message}
                  </Text>
                }
                endContent={
                  <HStack gap={2} vAlign="center">
                    <Timestamp
                      value={note.createdAt}
                      format="relative_short"
                      isLive
                      size="2xs"
                      color="secondary"
                    />
                    {!note.read && <StatusDot variant="accent" label="Unread notification" />}
                  </HStack>
                }
                onClick={() => markAsRead(note)}
              />
            ))}
          </List>
        </Card>
      )}
    </VStack>
  );
};
