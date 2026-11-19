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
import { Text } from '@astryxdesign/core/Text';
import { useAuthStore } from '../../store/authStore';
import styles from './AuthPromptModal.module.css';

export const AuthPromptModal: React.FC = () => {
  const { authPrompt, closeAuthPrompt, setPendingRedirect } = useAuthStore();
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
            title={authPrompt?.title || 'Sign In Required'}
            subtitle="Guest preview restriction"
            startContent={
              <span className={styles.iconRing} aria-hidden="true">
                <Lock size={18} />
              </span>
            }
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
                {authPrompt?.message || 'Sign in to access this Pactkeeper feature.'}
              </Text>
              <Banner
                status="info"
                title="Verified Player Access"
                description="Sign in with your Game Account or Google to verify your Player ID and sync purchases in real time."
                icon={<ShieldCheck size={16} />}
              />
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack gap={2} hAlign="end" wrap="wrap" width="100%">
              <Button
                label="Continue Browsing"
                variant="secondary"
                onClick={closeAuthPrompt}
              />
              <Button
                label="Sign In Now"
                variant="primary"
                icon={<LogIn size={16} />}
                onClick={handleConfirmLogin}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
};
