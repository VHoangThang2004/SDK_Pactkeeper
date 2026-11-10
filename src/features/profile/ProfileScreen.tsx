import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { ScrollHeader } from '../../components/ScrollHeader/ScrollHeader';
import { BottomNav } from '../../components/BottomNav/BottomNav';
import { useAuthStore } from '../../store/authStore';

export const ProfileScreen: React.FC = () => {
  const location = useLocation();
  const { role } = useAuthStore();
  const isTopUp = location.pathname === '/profile/topup';

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/profile/history':
        return 'Treasury Ledger';
      case '/profile/missives':
        return 'Missives & Notices';
      case '/profile/support':
        return 'Counsel Live Support';
      case '/profile/admin-dashboard':
        return "Keeper's Archives";
      default:
        if (location.pathname.startsWith('/profile/admin-chat/')) {
          return "Keeper's Archives";
        }
        return 'Pactkeeper';
    }
  };

  return (
    <LayoutWrapper>
      {!isTopUp && <ScrollHeader title={getPageTitle()} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      {role !== 'Admin' && <BottomNav />}
    </LayoutWrapper>
  );
};
