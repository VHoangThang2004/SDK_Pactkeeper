import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gem, ScrollText, Mail, MessageSquare } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';

export const BottomNav: React.FC = () => {
  const { role } = useAuthStore();
  const { unreadCount, hasUnreadCounsel, setHasUnreadCounsel } = useSyncStore();
  const isAdmin = role === 'Admin';

  const navItems = [
    { path: '/profile/topup', icon: Gem, label: 'Treasury' },
    { path: '/profile/history', icon: ScrollText, label: 'Ledger' },
    { path: '/profile/missives', icon: Mail, label: 'Missives' },
    { path: '/profile/support', icon: MessageSquare, label: 'Counsel' },
  ];

  if (isAdmin) {
    navItems[0] = { path: '/profile/admin-dashboard', icon: ScrollText, label: 'Archives' };
  }

  return (
    <div className={styles.navContainer}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => {
            if (item.path === '/profile/support') {
              setHasUnreadCounsel(false);
            }
          }}
          className={({ isActive }) => 
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <div className={styles.iconWrapper}>
            <item.icon size={22} className={styles.icon} />
            {item.path === '/profile/missives' && unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
            {item.path === '/profile/support' && hasUnreadCounsel && (
              <span className={styles.dot} />
            )}
          </div>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};
