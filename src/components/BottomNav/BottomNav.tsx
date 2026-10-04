import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gem, ScrollText, Mail, MessageSquare } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useAuthStore } from '../../store/authStore';

export const BottomNav: React.FC = () => {
  const { role } = useAuthStore();
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
          className={({ isActive }) => 
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <item.icon size={24} className={styles.icon} />
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};
