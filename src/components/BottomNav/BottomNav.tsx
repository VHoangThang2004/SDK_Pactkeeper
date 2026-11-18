import React from 'react';
import { NavLink } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { useAuthStore, isStaffRole } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { PLAYER_NAV_ITEMS } from '../navigation/playerNavItems';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  const { isLoggedIn, role, openAuthPrompt } = useAuthStore();
  const { unreadCount, hasUnreadCounsel, setHasUnreadCounsel } = useSyncStore();

  if (isStaffRole(role)) {
    return null;
  }

  return (
    <nav className={styles.navContainer} aria-label="Quick navigation">
      {PLAYER_NAV_ITEMS.map((item) => {
        const IconComp = item.icon;
        if (item.requiresAuth && !isLoggedIn) {
          return (
            <button
              key={item.path}
              type="button"
              className={`${styles.navItem} ${styles.navLocked}`}
              onClick={() =>
                openAuthPrompt({
                  title: item.authPromptTitle,
                  message: item.authPromptMessage || 'Please sign in to access this feature.',
                  redirectTo: { path: item.path },
                })
              }
              aria-label={`${item.label} (Sign in required)`}
            >
              <span className={styles.iconWrapper}>
                <IconComp size={20} />
                <Lock size={11} className={styles.lockBadge} aria-hidden="true" />
              </span>
              <Text type="supporting" size="xsm" color="secondary">
                {item.label}
              </Text>
            </button>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (item.path === '/profile/support') {
                setHasUnreadCounsel(false);
              }
            }}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.iconWrapper}>
              <IconComp size={20} />
              {item.path === '/profile/missives' && unreadCount > 0 && (
                <span className={styles.floatingBadge}>
                  <Badge variant="error" label={unreadCount > 99 ? '99+' : unreadCount} />
                </span>
              )}
              {item.path === '/profile/support' && hasUnreadCounsel && (
                <span className={styles.floatingDot}>
                  <StatusDot variant="warning" label="New reply in Counsel" isPulsing />
                </span>
              )}
            </span>
            <Text type="supporting" size="xsm" weight="medium">
              {item.label}
            </Text>
          </NavLink>
        );
      })}
    </nav>
  );
};
