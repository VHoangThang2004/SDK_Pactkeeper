import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { ScrollHeader } from '../../components/ScrollHeader/ScrollHeader';
import { BottomNav } from '../../components/BottomNav/BottomNav';

export const ProfileScreen: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/profile/topup':
        return 'Treasury';
      case '/profile/history':
        return 'Ledger';
      case '/profile/missives':
        return 'Missives';
      case '/profile/support':
        return 'Counsel';
      case '/profile/admin-dashboard':
        return "Keeper's Archives";
      default:
        return 'Pactkeeper';
    }
  };

  return (
    <LayoutWrapper>
      <ScrollHeader title={getPageTitle()} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      <BottomNav />
    </LayoutWrapper>
  );
};
