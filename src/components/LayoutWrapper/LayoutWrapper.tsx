import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  Gem,
  Headphones,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Palette,
  Receipt,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { DropdownMenu, DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, Layout, LayoutContent, VStack } from '@astryxdesign/core/Layout';
import { MobileNav } from '@astryxdesign/core/MobileNav';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { Section } from '@astryxdesign/core/Section';
import { SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { Token } from '@astryxdesign/core/Token';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { ASTRYX_THEME_OPTIONS } from '../../context/themeModeContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { AuthPromptModal } from '../AuthPromptModal/AuthPromptModal';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

interface NavConfigItem {
  label: string;
  path: string;
  icon: typeof Gem;
  requiresAuth: boolean;
  authPromptTitle?: string;
  authPromptMessage?: string;
}

const PLAYER_NAV_ITEMS: readonly NavConfigItem[] = [
  {
    label: 'Treasury',
    path: '/profile/topup',
    icon: Gem,
    requiresAuth: false,
  },
  {
    label: 'Ledger',
    path: '/profile/history',
    icon: Receipt,
    requiresAuth: true,
    authPromptTitle: 'Sign In to View Treasury Ledger',
    authPromptMessage:
      'Your transaction history and PayOS payment records are protected. Please sign in to inspect your personal ledger.',
  },
  {
    label: 'Missives',
    path: '/profile/missives',
    icon: Mail,
    requiresAuth: true,
    authPromptTitle: 'Sign In to Read Missives',
    authPromptMessage:
      'In-game delivery alerts and real-time account notifications are available after signing in.',
  },
  {
    label: 'Counsel',
    path: '/profile/support',
    icon: MessageSquare,
    requiresAuth: true,
    authPromptTitle: 'Sign In for Live Counsel Support',
    authPromptMessage:
      'Connect with official Game Masters in real time by signing in to your Pactkeeper account.',
  },
] as const;

const TRUST_PILLARS = [
  {
    title: 'Instant In-Game Delivery',
    description: 'Gems & bundles are credited automatically to your account within seconds.',
    icon: Zap,
  },
  {
    title: '100% Certified & Secure',
    description: 'Encrypted payment channels powered by PayOS & national banking standards.',
    icon: ShieldCheck,
  },
  {
    title: '24/7 Live Counsel',
    description: 'Real-time assistance from Game Masters to resolve payment and account queries.',
    icon: Headphones,
  },
] as const;

const PAYMENT_CHANNELS = ['VietQR', 'Napas 247', 'PayOS', 'Visa / Master'] as const;

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
  const { mode, toggleMode, themeSlug, setThemeSlug } = useThemeMode();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const loginStartedAtRef = useRef<number>(0);
  const prevUnreadCountRef = useRef<number>(unreadCount);
  const prevUnreadCounselRef = useRef<boolean>(hasUnreadCounsel);
  const prevProfileTsRef = useRef<number>(profileUpdateTimestamp);

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
          body: 'Player profile and gem balance updated.',
          type: 'info',
          uniqueID: 'pactkeeper-profile-sync',
          collisionBehavior: 'overwrite',
        });
      }
    }
  }, [isLoggedIn, profileUpdateTimestamp, toast]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const becameUnread = !prevUnreadCounselRef.current && hasUnreadCounsel;
    prevUnreadCounselRef.current = hasUnreadCounsel;
    if (becameUnread && !location.pathname.startsWith('/profile/support')) {
      toast({
        body: 'New reply from Keeper of Records in Counsel Live Support.',
        type: 'info',
        uniqueID: 'pactkeeper-counsel-reply',
        collisionBehavior: 'overwrite',
      });
    }
  }, [isLoggedIn, hasUnreadCounsel, location.pathname, toast]);

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
        body: 'You have a new Missive in your inbox.',
        type: 'info',
        uniqueID: 'pactkeeper-new-missive',
        collisionBehavior: 'overwrite',
      });
    }
  }, [isLoggedIn, unreadCount, toast]);

  const displayUid = playerId
    ? playerId.length > 8
      ? playerId.slice(-8).toUpperCase()
      : playerId
    : '';

  const currentThemeOption =
    ASTRYX_THEME_OPTIONS.find((opt) => opt.slug === themeSlug) ?? ASTRYX_THEME_OPTIONS[0];

  const handleDirectSignIn = () => {
    setIsMobileNavOpen(false);
    setPendingRedirect(null);
    navigate('/login');
  };

  const handleSignOut = () => {
    setIsMobileNavOpen(false);
    logout();
  };

  const desktopNavItems = PLAYER_NAV_ITEMS.map((item) => {
    if (item.requiresAuth && !isLoggedIn) {
      return (
        <TopNavItem
          key={item.path}
          label={item.label}
          icon={<Icon icon={item.icon} size="sm" />}
          onClick={() =>
            openAuthPrompt({
              title: item.authPromptTitle,
              message: item.authPromptMessage || 'Please sign in to access this feature.',
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
              label="New answer from Keeper of Records"
              isPulsing
            />
          )}
        </HStack>
      </TopNavItem>
    );
  });

  const endContent = (
    <HStack gap={2} vAlign="center">
      <DropdownMenu
        alignment="end"
        button={{
          label: currentThemeOption.label,
          variant: 'secondary',
          size: 'sm',
          icon: <Icon icon={Palette} size="sm" />,
        }}
      >
        {ASTRYX_THEME_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.slug}
            label={opt.label}
            description={opt.subtitle}
            endContent={
              themeSlug === opt.slug ? <Icon icon={Check} size="sm" color="accent" /> : undefined
            }
            onClick={() => setThemeSlug(opt.slug)}
          />
        ))}
      </DropdownMenu>

      <IconButton
        variant="ghost"
        size="sm"
        label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        tooltip={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
        onClick={toggleMode}
      />

      {isLoggedIn ? (
        <>
          <HStack gap={2} vAlign="center">
            <Avatar
              size={32}
              name={username || 'Player'}
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Hero'}`}
              status={
                <AvatarStatusDot
                  variant={isRealTimeOnline ? 'success' : 'neutral'}
                  label={isRealTimeOnline ? 'Real-time SignalR active' : 'Polling sync active'}
                />
              }
              tooltip={`${username || 'Player'} · ${
                isRealTimeOnline ? 'SignalR live sync' : 'Polling sync active'
              }`}
            />
            {!isMobile && (
              <VStack gap={0}>
                <Text type="label" size="sm" weight="semibold" maxLines={1}>
                  {username || 'Player'}
                </Text>
                {displayUid && (
                  <Text type="code" size="xsm" color="secondary">
                    ID: {displayUid}
                  </Text>
                )}
              </VStack>
            )}
          </HStack>

          <IconButton
            label="Sign Out"
            tooltip="Sign Out"
            variant="ghost"
            size="sm"
            icon={<Icon icon={LogOut} size="sm" />}
            onClick={handleSignOut}
          />
        </>
      ) : (
        <>
          {!isMobile && (
            <HStack gap={1.5} vAlign="center">
              <StatusDot variant="neutral" label="Guest session" />
              <Text type="supporting" size="sm" color="secondary">
                Guest
              </Text>
            </HStack>
          )}
          <Button
            label="Sign In"
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
      label="Pactkeeper Top-Up Navigation"
      heading={
        <HStack gap={2} vAlign="center">
          {isMobile && (
            <IconButton
              variant="ghost"
              size="sm"
              label="Open navigation menu"
              icon={<Icon icon={Menu} size="md" />}
              onClick={() => setIsMobileNavOpen(true)}
            />
          )}
          <TopNavHeading
            logo={<NavIcon icon={<Icon icon={Gem} size="sm" color="accent" />} />}
            heading="PACTKEEPER"
            superheading="TOP-UP CENTER"
            headingHref="/profile/topup"
          />
        </HStack>
      }
      centerContent={
        !isMobile ? (
          <HStack gap={1} vAlign="center">
            {desktopNavItems}
          </HStack>
        ) : undefined
      }
      endContent={endContent}
    />
  );

  return (
    <>
      <AppShell variant="wash" height="auto" contentPadding={0} topNav={topNav}>
        <VStack gap={0} width="100%" minHeight="calc(100dvh - 64px)" vAlign="between">
          <Layout
            contentWidth={1200}
            height="auto"
            padding={5}
            content={
              <LayoutContent isScrollable={false} padding={0}>
                {children}
              </LayoutContent>
            }
          />

          <Section variant="section" dividers={['top']} padding={0} width="100%">
            <Layout
              contentWidth={1200}
              height="auto"
              padding={6}
              content={
                <LayoutContent isScrollable={false} padding={0}>
                  <VStack gap={5} width="100%">
                    <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={4} width="100%">
                      {TRUST_PILLARS.map((pillar) => (
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
                          © 2026 Pactkeeper Team — FPT University SEP490. All Rights Reserved.
                        </Text>
                        <Text type="supporting" size="xsm" color="disabled" display="block">
                          Pactkeeper Web SDK is the official game top-up platform. Please confirm
                          your UID and Server before purchase.
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
                </LayoutContent>
              }
            />
          </Section>
        </VStack>
      </AppShell>

      <MobileNav
        isOpen={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        header="Pactkeeper Portal"
      >
        <VStack gap={4} width="100%">
          <SideNavSection title="Navigation">
            {PLAYER_NAV_ITEMS.map((item) => {
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
                          item.authPromptMessage || 'Please sign in to access this feature.',
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
                      <StatusDot variant="warning" label="New reply" isPulsing />
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

          <SideNavSection title="Astryx Theme">
            {ASTRYX_THEME_OPTIONS.map((opt) => (
              <SideNavItem
                key={opt.slug}
                label={opt.label}
                icon={<Icon icon={Palette} size="sm" />}
                isSelected={themeSlug === opt.slug}
                endContent={
                  themeSlug === opt.slug ? <Icon icon={Check} size="xsm" color="accent" /> : undefined
                }
                onClick={() => setThemeSlug(opt.slug)}
              />
            ))}
          </SideNavSection>

          <Divider />

          <VStack gap={2} width="100%">
            <Button
              label={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              variant="secondary"
              width="100%"
              icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
              onClick={toggleMode}
            />
            {isLoggedIn ? (
              <Button
                label="Sign Out"
                variant="destructive"
                width="100%"
                icon={<Icon icon={LogOut} size="sm" />}
                onClick={handleSignOut}
              />
            ) : (
              <Button
                label="Sign In"
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
