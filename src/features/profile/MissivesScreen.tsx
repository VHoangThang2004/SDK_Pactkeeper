import React, { useState, useEffect } from 'react';
import { BellOff, CheckCircle, XCircle, Gift, Info } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { apiClient } from '../../core/network/apiClient';
import styles from './MissivesScreen.module.css';

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

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<NotificationModel[]>('/api/notification');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    try {
      const response = await apiClient.post('/api/notification/read-all');
      if (response.status === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const formatTime = (isoString: string) => {
    const dt = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return diffMins <= 0 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dt.getDate()} ${months[dt.getMonth()]}`;
    }
  };

  const getIconData = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return { Icon: CheckCircle, className: styles.colorSuccess };
      case 'error':
        return { Icon: XCircle, className: styles.colorError };
      case 'promo':
        return { Icon: Gift, className: styles.colorPromo };
      default:
        return { Icon: Info, className: styles.colorInfo };
    }
  };

  return (
    <ParchmentBackground padding="1rem">
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>Recent Missives</h2>
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        </div>

        <div className={styles.listContainer}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <p>Reading the scrolls...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <BellOff size={48} color="rgba(140, 123, 106, 0.5)" />
              <p>The raven brought no messages today.</p>
            </div>
          ) : (
            notifications.map((note) => {
              const { Icon, className } = getIconData(note.type);
              
              return (
                <div
                  key={note.id}
                  className={`${styles.card} ${note.read ? styles.cardRead : ''}`}
                  onClick={() => markAsRead(note)}
                >
                  <div className={styles.iconWrapper}>
                    <Icon size={20} className={className} />
                  </div>
                  <div className={styles.contentWrapper}>
                    <div className={styles.topRow}>
                      <p className={`${styles.notificationTitle} ${note.read ? styles.notificationTitleRead : ''}`}>
                        {note.title}
                      </p>
                      <span className={styles.timeText}>{formatTime(note.createdAt)}</span>
                    </div>
                    <p className={`${styles.notificationMessage} ${note.read ? styles.notificationMessageRead : ''}`}>
                      {note.message}
                    </p>
                  </div>
                  {!note.read && <div className={styles.unreadDot} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </ParchmentBackground>
  );
};
