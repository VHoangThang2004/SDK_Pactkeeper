import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gem,
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
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { Section } from '@astryxdesign/core/Section';
import { SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { Token } from '@astryxdesign/core/Token';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { PLAYER_NAV_ITEMS } from '../navigation/playerNavItems';
import { AuthPromptModal } from '../AuthPromptModal/AuthPromptModal';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const TRUST_PILLARS = [
  {
    title: 'Instant In-Game Delivery',
    description: 'Gems and bundles are credited automatically to your account within seconds.',
    icon: Zap,
  },
  {
    title: '100% Certified & Secure',
    description: 'Encrypted payment channels powered by PayOS and national banking standards.',
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
  const { mode, toggleMode } = useThemeMode();
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

  const handleCopyUid = () => {
    if (!playerId) return;
    navigator.clipboard.writeText(playerId);
    toast({
      body: `Player ID (${playerId}) copied to clipboard.`,
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
      <IconButton
        variant="ghost"
        size="sm"
        label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        tooltip={mode === 'dark' ? 'Light Mode (Parchment)' : 'Dark Mode (Obsidian Gold)'}
        icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
        onClick={toggleMode}
      />

      {isLoggedIn ? (
        <DropdownMenu
          button={{
            variant: 'ghost',
            size: 'sm',
            label: username || 'Player',
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
              label: `UID: ${displayUid || 'Current Account'}`,
              description: 'Click to copy full player ID',
              icon: <Icon icon={Copy} size="xsm" />,
              onClick: handleCopyUid,
            },
            {
              id: 'menu-ledger',
              label: 'Treasury Ledger',
              icon: <Icon icon={Receipt} size="xsm" />,
              onClick: () => navigate('/profile/history'),
            },
            {
              id: 'menu-missives',
              label: 'Missives Inbox',
              icon: <Icon icon={Mail} size="xsm" />,
              endContent: unreadCount > 0 ? <Badge variant="error" label={unreadCount} /> : undefined,
              onClick: () => navigate('/profile/missives'),
            },
            {
              id: 'menu-counsel',
              label: 'Counsel Support',
              icon: <Icon icon={MessageSquare} size="xsm" />,
              onClick: () => navigate('/profile/support'),
            },
            {
              id: 'menu-signout',
              label: 'Sign Out',
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
              Guest
            </Text>
          </HStack>
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
          <IconButton
            className="mobileOnly"
            variant="ghost"
            size="sm"
            label="Open navigation menu"
            icon={<Icon icon={Menu} size="md" />}
            onClick={() => setIsMobileNavOpen(true)}
          />
          <TopNavHeading
            logo={<NavIcon icon={<Icon icon={Gem} size="sm" color="accent" />} />}
            heading="PACTKEEPER"
            superheading="TOP-UP CENTER"
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
