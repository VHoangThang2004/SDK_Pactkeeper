import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gem,
  ScrollText,
  ShieldCheck,
  Zap,
  Headphones,
  LogOut,
  LogIn,
  Lock,
} from 'lucide-react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Section } from '@astryxdesign/core/Section';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { useAuthStore, isStaffRole } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { PLAYER_NAV_ITEMS } from '../navigation/playerNavItems';
import { AuthPromptModal } from '../AuthPromptModal/AuthPromptModal';
import styles from './LayoutWrapper.module.css';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const TRUST_PILLARS = [
  {
    title: 'Instant In-Game Delivery',
    description:
      'Gems and bundles are credited automatically to your account within seconds.',
    icon: Zap,
  },
  {
    title: '100% Certified & Secure',
    description:
      'Encrypted payment channels powered by PayOS and national banking standards.',
    icon: ShieldCheck,
  },
  {
    title: '24/7 Live Counsel',
    description:
      'Real-time assistance from Game Masters to resolve payment and account queries.',
    icon: Headphones,
  },
] as const;

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const { isLoggedIn, username, playerId, role, logout, openAuthPrompt, setPendingRedirect } =
    useAuthStore();
  const {
    unreadCount,
    hasUnreadCounsel,
    isRealTimeOnline,
    profileUpdateTimestamp,
    startGlobalSync,
    setHasUnreadCounsel,
  } = useSyncStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isStaff = isStaffRole(role);

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

  // Global non-blocking toast notifications for real-time SignalR / sync events
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

  const handleDirectSignIn = () => {
    setPendingRedirect(null);
    navigate('/login');
  };

  const navItems = isStaff ? (
    <TopNavItem
      label="Keeper's Archives"
      href="/profile/admin-dashboard"
      icon={<ScrollText size={16} />}
      isSelected={
        location.pathname.startsWith('/profile/admin-dashboard') ||
        location.pathname.startsWith('/profile/admin-chat')
      }
    />
  ) : (
    PLAYER_NAV_ITEMS.map((item) => {
      const IconComp = item.icon;
      if (item.requiresAuth && !isLoggedIn) {
        return (
          <TopNavItem
            key={item.path}
            label={item.label}
            icon={<IconComp size={16} />}
            onClick={() =>
              openAuthPrompt({
                title: item.authPromptTitle,
                message: item.authPromptMessage || 'Please sign in to access this feature.',
                redirectTo: { path: item.path },
              })
            }
          >
            <HStack gap={1.5} vAlign="center">
              <span>{item.label}</span>
              <Lock size={12} aria-hidden="true" className={styles.lockedIcon} />
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
          icon={<IconComp size={16} />}
          isSelected={isSelected}
          onClick={() => {
            if (item.path === '/profile/support') {
              setHasUnreadCounsel(false);
            }
          }}
        >
          <HStack gap={1.5} vAlign="center">
            <span>{item.label}</span>
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
    })
  );

  const endContent = isLoggedIn ? (
    <HStack gap={2} vAlign="center">
      <div className={styles.accountBadge}>
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
        <VStack gap={0} className={styles.accountMeta}>
          <HStack gap={1.5} vAlign="center">
            <Text type="label" size="sm" weight="semibold" maxLines={1}>
              {username || 'Player'}
            </Text>
            <Badge variant="cyan" label="Official Server" />
          </HStack>
          {displayUid && (
            <Text type="code" size="xsm" color="secondary">
              ID: {displayUid}
            </Text>
          )}
        </VStack>
      </div>
      <Button
        label="Sign Out"
        variant="ghost"
        size="sm"
        isIconOnly
        icon={<LogOut size={16} />}
        tooltip="Sign Out"
        onClick={logout}
      />
    </HStack>
  ) : (
    <HStack gap={2} vAlign="center">
      <div className={styles.guestBadge}>
        <Avatar size={32} alt="Guest session" tooltip="Guest Mode — View Only" />
        <VStack gap={0} className={styles.accountMeta}>
          <HStack gap={1.5} vAlign="center">
            <Text type="label" size="sm" weight="semibold">
              Guest
            </Text>
            <Badge variant="yellow" label="View Only" />
          </HStack>
          <Text type="supporting" size="xsm" color="secondary">
            Sign in to top up
          </Text>
        </VStack>
      </div>
      <Button
        label="Sign In"
        variant="primary"
        size="sm"
        icon={<LogIn size={14} />}
        onClick={handleDirectSignIn}
      />
    </HStack>
  );

  const topNav = (
    <TopNav
      label="Pactkeeper main navigation"
      className={styles.topNavBar}
      heading={
        <TopNavHeading
          logo={<NavIcon icon={<Gem size={16} />} />}
          heading="PACTKEEPER"
          superheading="TOP-UP CENTER"
          headingHref={isStaff ? '/profile/admin-dashboard' : '/profile/topup'}
        />
      }
      centerContent={navItems}
      endContent={endContent}
    />
  );

  return (
    <>
      <AppShell
        variant="wash"
        height="auto"
        contentPadding={0}
        topNav={topNav}
        mobileNav={{ breakpoint: 'md' }}
      >
        <div className={styles.shellBody}>
          <div className={styles.contentInner}>{children}</div>

          <footer className={styles.footerWrap}>
            <Section variant="section" dividers={['top']} padding={0}>
              <div className={styles.footerContainer}>
                <Grid columns={{ minWidth: 250, max: 3, repeat: 'fit' }} gap={4}>
                  {TRUST_PILLARS.map((pillar) => {
                    const PillarIcon = pillar.icon;
                    return (
                      <Card key={pillar.title} variant="default" padding={4}>
                        <HStack gap={3} vAlign="start">
                          <span className={styles.trustIconBox} aria-hidden="true">
                            <PillarIcon size={20} />
                          </span>
                          <VStack gap={1}>
                            <Heading level={4}>{pillar.title}</Heading>
                            <Text type="supporting" size="sm" color="secondary" display="block">
                              {pillar.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </Card>
                    );
                  })}
                </Grid>

                <Divider />

                <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
                  <VStack gap={0.5}>
                    <Text type="supporting" size="sm" color="secondary" display="block">
                      © 2026 Pactkeeper Team — FPT University SEP490. All Rights Reserved.
                    </Text>
                    <Text type="supporting" size="xsm" color="disabled" display="block">
                      Pactkeeper Web SDK is the official game top-up platform. Please confirm your
                      UID and Server before purchase.
                    </Text>
                  </VStack>
                  <HStack gap={1.5} wrap="wrap">
                    <Badge variant="neutral" label="VietQR" />
                    <Badge variant="neutral" label="Napas 247" />
                    <Badge variant="info" label="PayOS" />
                    <Badge variant="neutral" label="Visa / Master" />
                  </HStack>
                </HStack>
              </div>
            </Section>
          </footer>
        </div>
      </AppShell>

      <AuthPromptModal />
    </>
  );
};
