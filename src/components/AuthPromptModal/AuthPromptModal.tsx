import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
  HStack,
} from '@astryxdesign/core/Layout';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../core/i18n';

export const AuthPromptModal: React.FC = () => {
  const { authPrompt, closeAuthPrompt, setPendingRedirect } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleConfirmLogin = () => {
    const redirectTarget = authPrompt?.redirectTo || null;
    closeAuthPrompt();
    if (redirectTarget) {
      setPendingRedirect(redirectTarget);
    }
    navigate('/login');
  };

  return (
    <Dialog
      isOpen={Boolean(authPrompt)}
      onOpenChange={(open) => {
        if (!open) {
          closeAuthPrompt();
        }
      }}
      width={440}
      purpose="info"
    >
      <Layout
        height="auto"
        defaultHasDividers={false}
        header={
          <DialogHeader
            title={authPrompt?.title || t('nav.authRequiredTitle')}
            subtitle={t('nav.signInToUnlock')}
            startContent={<Icon icon={Lock} color="accent" size="md" />}
            onOpenChange={(open) => {
              if (!open) {
                closeAuthPrompt();
              }
            }}
            hasDivider
          />
        }
        content={
          <LayoutContent isScrollable={false}>
            <VStack gap={3}>
              <Text type="body" color="primary" display="block">
                {authPrompt?.message || t('nav.signInToUnlock')}
              </Text>
              <Banner
                status="info"
                title={t('nav.verifiedAccessTitle')}
                description={t('nav.verifiedAccessDesc')}
                icon={<Icon icon={ShieldCheck} size="sm" />}
              />
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack gap={2} hAlign="end" wrap="wrap" width="100%">
              <Button
                label={t('nav.continueBrowsing')}
                variant="secondary"
                onClick={closeAuthPrompt}
              />
              <Button
                label={t('nav.signInNow')}
                variant="primary"
                icon={<Icon icon={LogIn} size="sm" />}
                onClick={handleConfirmLogin}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
};
