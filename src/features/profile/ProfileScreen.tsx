import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { useTranslation } from '../../core/i18n';

export const ProfileScreen: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const isTopUp = location.pathname === '/profile/topup';

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/profile/history':
        return {
          title: t('pages.historyTitle'),
          subtitle: t('pages.historySubtitle'),
        };
      case '/profile/missives':
        return {
          title: t('pages.missivesTitle'),
          subtitle: t('pages.missivesSubtitle'),
        };
      case '/profile/support':
        return {
          title: t('pages.supportTitle'),
          subtitle: t('pages.supportSubtitle'),
        };
      default:
        return {
          title: t('common.appName'),
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
