import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Headphones,
  LogOut,
  LogIn,
  Lock,
  Menu,
  Moon,
  Sun,
  Copy,
  Receipt,
  Mail,
  MessageSquare,
  Languages,
} from 'lucide-react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MobileNav } from '@astryxdesign/core/MobileNav';
import { Section } from '@astryxdesign/core/Section';
import { SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { Token } from '@astryxdesign/core/Token';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/authStore';
import { usePortalDataStore } from '../../store/portalDataStore';
import { useSyncStore } from '../../store/syncStore';
import { useTranslation } from '../../core/i18n';
import { usePlayerNavItems } from '../navigation/playerNavItems';
import { AuthPromptModal } from '../AuthPromptModal/AuthPromptModal';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const PAYMENT_CHANNELS = ['VietQR', 'Napas 247', 'PayOS'] as const;

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const { isLoggedIn, username, playerId, logout, openAuthPrompt, setPendingRedirect } =
    useAuthStore();
  const {
    unreadCount,
    hasUnreadCounsel,
    isRealTimeOnline,
    profileUpdateTimestamp,
    startGlobalSync,
    setHasUnreadCounsel,
  } = useSyncStore();
  const { mode, toggleMode } = useThemeMode();
  const { t, language, toggleLanguage, isVietnamese } = useTranslation();
  const navItems = usePlayerNavItems();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const loginStartedAtRef = useRef<number>(0);
  const prevUnreadCountRef = useRef<number>(unreadCount);
  const prevUnreadCounselRef = useRef<boolean>(hasUnreadCounsel);
  const prevProfileTsRef = useRef<number>(profileUpdateTimestamp);

  const trustPillars = useMemo(
    () => [
      {
        title: t('trust.instantDelivery'),
        description: t('trust.instantDeliveryDesc'),
        icon: Zap,
      },
      {
        title: t('trust.securePayment'),
        description: t('trust.securePaymentDesc'),
        icon: ShieldCheck,
      },
      {
        title: t('trust.liveSupport'),
        description: t('trust.liveSupportDesc'),
        icon: Headphones,
      },
    ],
    [t]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      loginStartedAtRef.current = 0;
      prevUnreadCountRef.current = 0;
      prevUnreadCounselRef.current = false;
      prevProfileTsRef.current = 0;
      return;
    }

    const initialSyncState = useSyncStore.getState();
    loginStartedAtRef.current = Date.now();
    prevUnreadCountRef.current = initialSyncState.unreadCount;
    prevUnreadCounselRef.current = initialSyncState.hasUnreadCounsel;
    prevProfileTsRef.current = initialSyncState.profileUpdateTimestamp;

    const cleanup = startGlobalSync();
    return cleanup;
  }, [isLoggedIn, startGlobalSync]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (profileUpdateTimestamp > 0 && profileUpdateTimestamp !== prevProfileTsRef.current) {
      prevProfileTsRef.current = profileUpdateTimestamp;
      if (Date.now() - loginStartedAtRef.current > 1200) {
        toast({
          body: t('common.profileUpdatedToast'),
          type: 'info',
          uniqueID: 'pactkeeper-profile-sync',
          collisionBehavior: 'overwrite',
        });
      }
    }
  }, [isLoggedIn, profileUpdateTimestamp, t, toast]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const becameUnread = !prevUnreadCounselRef.current && hasUnreadCounsel;
    prevUnreadCounselRef.current = hasUnreadCounsel;
    if (becameUnread && !location.pathname.startsWith('/profile/support')) {
      toast({
        body: t('common.counselReplyToast'),
        type: 'info',
        uniqueID: 'pactkeeper-counsel-reply',
        collisionBehavior: 'overwrite',
      });
    }
  }, [isLoggedIn, hasUnreadCounsel, location.pathname, t, toast]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const increased = unreadCount > prevUnreadCountRef.current;
    prevUnreadCountRef.current = unreadCount;
    if (
      increased &&
      loginStartedAtRef.current > 0 &&
      Date.now() - loginStartedAtRef.current > 2500
    ) {
      toast({
        body: t('common.newMissiveToast'),
        type: 'info',
        uniqueID: 'pactkeeper-new-missive',
        collisionBehavior: 'overwrite',
      });
    }
  }, [isLoggedIn, unreadCount, t, toast]);

  const displayUid = playerId
    ? playerId.length > 8
      ? playerId.slice(-8).toUpperCase()
      : playerId
    : '';

  const handleCopyUid = () => {
    if (!playerId) return;
    navigator.clipboard.writeText(playerId);
    toast({
      body: t('common.uidCopiedToast', { id: playerId }),
      type: 'info',
      uniqueID: 'pactkeeper-copy-uid',
      collisionBehavior: 'overwrite',
    });
  };

  const handleDirectSignIn = () => {
    setIsMobileNavOpen(false);
    setPendingRedirect(null);
    navigate('/login');
  };

  const handleSignOut = () => {
    usePortalDataStore.getState().clearUserCache();
    logout();
    toast({
      body: t('common.signedOutToast'),
      type: 'info',
      uniqueID: 'pactkeeper-signout',
      collisionBehavior: 'overwrite',
    });
    navigate('/profile/topup');
  };

  const desktopNavItems = navItems.map((item) => {
    if (item.requiresAuth && !isLoggedIn) {
      return (
        <TopNavItem
          key={item.path}
          label={item.label}
          icon={<Icon icon={item.icon} size="sm" />}
          isSelected={false}
          onClick={() =>
            openAuthPrompt({
              title: item.authPromptTitle,
              message: item.authPromptMessage || t('nav.signInToUnlock'),
              redirectTo: { path: item.path },
            })
          }
        >
          <HStack gap={1.5} vAlign="center">
            <Text type="label" size="sm">
              {item.label}
            </Text>
            <Icon icon={Lock} size="xsm" color="accent" />
          </HStack>
        </TopNavItem>
      );
    }

    const isSelected = location.pathname === item.path;
    return (
      <TopNavItem
        key={item.path}
        label={item.label}
        href={item.path}
        icon={<Icon icon={item.icon} size="sm" />}
        isSelected={isSelected}
        onClick={() => {
          if (item.path === '/profile/support') {
            setHasUnreadCounsel(false);
          }
        }}
      >
        <HStack gap={1.5} vAlign="center">
          <Text type="label" size="sm">
            {item.label}
          </Text>
          {item.path === '/profile/missives' && unreadCount > 0 && (
            <Badge variant="error" label={unreadCount > 99 ? '99+' : unreadCount} />
          )}
          {item.path === '/profile/support' && hasUnreadCounsel && (
            <StatusDot
              variant="warning"
              label={t('nav.newCounselAnswer')}
              isPulsing
            />
          )}
        </HStack>
      </TopNavItem>
    );
  });

  const endContent = (
    <HStack gap={2} vAlign="center">
      {/* Language Switcher Toggle */}
      <IconButton
        variant="ghost"
        size="sm"
        label={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        tooltip={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        icon={<Icon icon={Languages} size="sm" />}
        onClick={toggleLanguage}
      />

      {/* Theme Switcher Toggle */}
      <IconButton
        variant="ghost"
        size="sm"
        label={mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
        tooltip={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}
        icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
        onClick={toggleMode}
      />

      {isLoggedIn ? (
        <DropdownMenu
          button={{
            variant: 'ghost',
            size: 'sm',
            label: username || t('common.player'),
            endContent: (
              <Avatar
                size="sm"
                name={username || 'Player'}
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Hero'}`}
                status={
                  <AvatarStatusDot
                    variant={isRealTimeOnline ? 'success' : 'neutral'}
                    label={isRealTimeOnline ? 'Real-time SignalR active' : 'Polling sync active'}
                  />
                }
              />
            ),
          }}
          items={[
            {
              id: 'uid-copy',
              label: `UID: ${displayUid || 'Account'}`,
              description: t('menu.copyUidDesc'),
              icon: <Icon icon={Copy} size="xsm" />,
              onClick: handleCopyUid,
            },
            {
              id: 'menu-ledger',
              label: t('menu.treasuryLedger'),
              icon: <Icon icon={Receipt} size="xsm" />,
              onClick: () => navigate('/profile/history'),
            },
            {
              id: 'menu-missives',
              label: t('menu.missivesInbox'),
              icon: <Icon icon={Mail} size="xsm" />,
              endContent: unreadCount > 0 ? <Badge variant="error" label={unreadCount} /> : undefined,
              onClick: () => navigate('/profile/missives'),
            },
            {
              id: 'menu-counsel',
              label: t('menu.counselSupport'),
              icon: <Icon icon={MessageSquare} size="xsm" />,
              onClick: () => navigate('/profile/support'),
            },
            {
              id: 'menu-signout',
              label: t('common.signOut'),
              variant: 'destructive',
              icon: <Icon icon={LogOut} size="xsm" />,
              onClick: handleSignOut,
            },
          ]}
        />
      ) : (
        <>
          <HStack gap={1.5} vAlign="center" className="desktopOnly">
            <StatusDot variant="neutral" label="Guest session" />
            <Text type="supporting" size="sm" color="secondary">
              {t('common.guest')}
            </Text>
          </HStack>
          <Button
            label={t('common.signIn')}
            variant="primary"
            size="sm"
            icon={<Icon icon={LogIn} size="sm" />}
            onClick={handleDirectSignIn}
          />
        </>
      )}
    </HStack>
  );

  const topNav = (
    <TopNav
      label={t('common.navigationLabel')}
      heading={
        <HStack gap={2} vAlign="center">
          <IconButton
            className="mobileOnly"
            variant="ghost"
            size="sm"
            label={t('common.openMenuLabel')}
            icon={<Icon icon={Menu} size="md" />}
            onClick={() => setIsMobileNavOpen(true)}
          />
          <TopNavHeading
            logo={<img src="/logo.png" alt="Pactkeeper Logo" className="brandLogoNav" />}
            heading="PACTKEEPER"
            superheading={t('common.topUpCenter')}
            headingHref="/profile/topup"
          />
        </HStack>
      }
      centerContent={<HStack gap={1} vAlign="center" className="desktopOnly">{desktopNavItems}</HStack>}
      endContent={endContent}
    />
  );

  return (
    <>
      <AppShell variant="wash" height="auto" contentPadding={0} topNav={topNav}>
        <VStack gap={6} width="100%">
          {children}

          <Section variant="section" dividers={['top']} padding={6} width="100%">
            <VStack gap={5} width="100%">
              <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={4} width="100%">
                {trustPillars.map((pillar) => (
                  <Card key={pillar.title} variant="default" padding={4}>
                    <HStack gap={3} vAlign="start">
                      <Icon icon={pillar.icon} size="lg" color="accent" />
                      <VStack gap={1}>
                        <Heading level={4}>{pillar.title}</Heading>
                        <Text type="supporting" size="sm" color="secondary" display="block">
                          {pillar.description}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>
                ))}
              </Grid>

              <Divider />

              <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap" width="100%">
                <VStack gap={0.5}>
                  <Text type="supporting" size="sm" color="secondary" display="block">
                    © 2026 Pactkeeper Team — FPT University SEP490. {t('common.allRightsReserved')}
                  </Text>
                  <Text type="supporting" size="xsm" color="disabled" display="block">
                    {t('common.footerDisclaimer')}
                  </Text>
                </VStack>

                <HStack gap={1.5} wrap="wrap">
                  {PAYMENT_CHANNELS.map((channel) => (
                    <Token
                      key={channel}
                      label={channel}
                      size="sm"
                      color={channel === 'PayOS' ? 'cyan' : 'gray'}
                    />
                  ))}
                </HStack>
              </HStack>
            </VStack>
          </Section>
        </VStack>
      </AppShell>

      <MobileNav
        isOpen={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        header={t('common.portalTitle')}
      >
        <VStack gap={4} width="100%">
          <SideNavSection title={t('common.navigationSection')}>
            {navItems.map((item) => {
              if (item.requiresAuth && !isLoggedIn) {
                return (
                  <SideNavItem
                    key={item.path}
                    label={item.label}
                    icon={<Icon icon={item.icon} size="sm" />}
                    endContent={<Icon icon={Lock} size="xsm" color="accent" />}
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      openAuthPrompt({
                        title: item.authPromptTitle,
                        message:
                          item.authPromptMessage || t('nav.signInToUnlock'),
                        redirectTo: { path: item.path },
                      });
                    }}
                  />
                );
              }

              return (
                <SideNavItem
                  key={item.path}
                  label={item.label}
                  href={item.path}
                  icon={<Icon icon={item.icon} size="sm" />}
                  isSelected={location.pathname === item.path}
                  endContent={
                    item.path === '/profile/missives' && unreadCount > 0 ? (
                      <Badge variant="error" label={unreadCount > 99 ? '99+' : unreadCount} />
                    ) : item.path === '/profile/support' && hasUnreadCounsel ? (
                      <StatusDot variant="warning" label={t('nav.newCounselAnswer')} isPulsing />
                    ) : undefined
                  }
                  onClick={() => {
                    if (item.path === '/profile/support') {
                      setHasUnreadCounsel(false);
                    }
                    setIsMobileNavOpen(false);
                  }}
                />
              );
            })}
          </SideNavSection>

          <Divider />

          <VStack gap={2} width="100%">
            <Button
              label={language === 'vi' ? 'English (Switch language)' : 'Tiếng Việt (Đổi ngôn ngữ)'}
              variant="secondary"
              width="100%"
              icon={<Icon icon={Languages} size="sm" />}
              onClick={() => {
                toggleLanguage();
                setIsMobileNavOpen(false);
              }}
            />
            <Button
              label={mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
              variant="secondary"
              width="100%"
              icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
              onClick={toggleMode}
            />
            {isLoggedIn ? (
              <Button
                label={t('common.signOut')}
                variant="destructive"
                width="100%"
                icon={<Icon icon={LogOut} size="sm" />}
                onClick={handleSignOut}
              />
            ) : (
              <Button
                label={t('common.signIn')}
                variant="primary"
                width="100%"
                icon={<Icon icon={LogIn} size="sm" />}
                onClick={handleDirectSignIn}
              />
            )}
          </VStack>
        </VStack>
      </MobileNav>

      <AuthPromptModal />
    </>
  );
};
