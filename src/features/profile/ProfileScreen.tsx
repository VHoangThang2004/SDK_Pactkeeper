import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';

export const ProfileScreen: React.FC = () => {
  const location = useLocation();
  const isTopUp = location.pathname === '/profile/topup';

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/profile/history':
        return {
          title: 'Treasury Ledger',
          subtitle: 'Official payment history, active PayOS windows, and delivery status.',
        };
      case '/profile/missives':
        return {
          title: 'Missives & Notices',
          subtitle: 'Real-time system alerts, tribute confirmations, and counsel replies.',
        };
      case '/profile/support':
        return {
          title: 'Counsel Live Support',
          subtitle: 'Direct real-time channel with official Pactkeeper Game Masters.',
        };
      default:
        return {
          title: 'Pactkeeper',
          subtitle: '',
        };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <LayoutWrapper>
      <VStack gap={5} width="100%">
        {!isTopUp && (
          <VStack gap={4} width="100%">
            <VStack gap={1.5}>
              <Heading level={1} weight="bold">{pageMeta.title}</Heading>
              {pageMeta.subtitle && (
                <Text type="body" size="lg" color="secondary" display="block">
                  {pageMeta.subtitle}
                </Text>
              )}
            </VStack>
            <Divider />
          </VStack>
        )}
        <Outlet />
      </VStack>
    </LayoutWrapper>
  );
};
