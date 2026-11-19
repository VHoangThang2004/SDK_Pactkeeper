import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Section } from '@astryxdesign/core/Section';
import { VStack } from '@astryxdesign/core/Layout';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { BottomNav } from '../../components/BottomNav/BottomNav';
import { useAuthStore, isStaffRole } from '../../store/authStore';

const getPageMeta = (pathname: string): { title: string; subtitle: string } => {
  switch (pathname) {
    case '/profile/history':
      return {
        title: 'Treasury Ledger',
        subtitle: 'Track PayOS orders, countdown timers, and gem delivery records.',
      };
    case '/profile/missives':
      return {
        title: 'Missives & Notices',
        subtitle: 'Official top-up confirmations and system announcements synced in real time.',
      };
    case '/profile/support':
      return {
        title: 'Counsel Live Support',
        subtitle: 'Direct real-time channel with Pactkeeper Game Masters.',
      };
    case '/profile/admin-dashboard':
      return {
        title: "Keeper's Archives",
        subtitle: 'Manage active player support threads and respond in real time.',
      };
    default:
      if (pathname.startsWith('/profile/admin-chat/')) {
        return {
          title: "Keeper's Archives",
          subtitle: 'Live player support channel.',
        };
      }
      return {
        title: 'Pactkeeper',
        subtitle: 'Official Top-Up Center',
      };
  }
};

export const ProfileScreen: React.FC = () => {
  const location = useLocation();
  const { role } = useAuthStore();
  const isTopUp = location.pathname === '/profile/topup';
  const isStaff = isStaffRole(role);
  const meta = getPageMeta(location.pathname);

  return (
    <LayoutWrapper>
      {!isTopUp && (
        <Section variant="transparent" dividers={['bottom']} padding={0} paddingBlockEnd={4}>
          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              {meta.title}
            </Heading>
            <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
              {meta.subtitle}
            </Text>
          </VStack>
        </Section>
      )}
      <VStack gap={4} minHeight="100%" width="100%">
        <Outlet />
      </VStack>
      {!isStaff && <BottomNav />}
    </LayoutWrapper>
  );
};
