import React, { useState, useEffect, useCallback } from 'react';
import { BellOff, CheckCircle, XCircle, Gift, Info, CheckCheck } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService } from '../support/services/SupportHubService';
import { useSyncStore } from '../../store/syncStore';
import styles from './MissivesScreen.module.css';

interface NotificationModel {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'success':
      return { Icon: CheckCircle, className: styles.iconSuccess };
    case 'error':
      return { Icon: XCircle, className: styles.iconError };
    case 'promo':
      return { Icon: Gift, className: styles.iconPromo };
    default:
      return { Icon: Info, className: styles.iconInfo };
  }
};

export const MissivesScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const markAsRead = async (note: NotificationModel) => {
    if (note.read) return;
    try {
      const response = await apiClient.post(`/api/notification/${note.id}/read`);
      if (response.status === 200) {
        setNotifications((prev) => {
          const next = prev.map((n) => (n.id === note.id ? { ...n, read: true } : n));
          const unread = next.filter((n) => !n.read).length;
          setUnreadCount(unread);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.post('/api/notification/read-all');
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const unreadTotal = notifications.filter((n) => !n.read).length;

  return (
    <VStack gap={4} width="100%">
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap" width="100%">
        <Heading level={2}>Recent Missives</Heading>
        <Button
          label={unreadTotal > 0 ? `Mark all as read (${unreadTotal})` : 'All Caught Up'}
          variant="secondary"
          size="sm"
          icon={<CheckCheck size={15} />}
          isDisabled={unreadTotal === 0}
          onClick={markAllAsRead}
        />
      </HStack>

      {isLoading ? (
        <VStack gap={2} width="100%">
          {[0, 1, 2, 3].map((idx) => (
            <Skeleton key={idx} width="100%" height={76} radius={3} index={idx} />
          ))}
        </VStack>
      ) : notifications.length === 0 ? (
        <Card variant="default" padding={6} width="100%">
          <EmptyState
            icon={<BellOff size={38} />}
            title="No Missives Today"
            description="The raven brought no messages today. Order confirmations and announcements appear here automatically."
          />
        </Card>
      ) : (
        <Card variant="default" padding={4} width="100%">
          <List edge="bleed" hasDividers density="spacious">
            {notifications.map((note) => {
              const { Icon, className } = getNotificationIcon(note.type);
              return (
                <ListItem
                  key={note.id}
                  align="first-line"
                  className={note.read ? styles.itemRead : styles.itemUnread}
                  onClick={() => markAsRead(note)}
                  startContent={
                    <span className={`${styles.iconRing} ${className}`} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                  }
                  label={
                    <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
                      <span>{note.title}</span>
                      <HStack gap={2} vAlign="center">
                        <Timestamp value={note.createdAt} format="auto" isLive />
                        {!note.read && (
                          <StatusDot variant="warning" label="Unread missive" isPulsing />
                        )}
                      </HStack>
                    </HStack>
                  }
                  description={note.message}
                />
              );
            })}
          </List>
        </Card>
      )}
    </VStack>
  );
};
