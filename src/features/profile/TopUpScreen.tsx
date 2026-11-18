import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Gem,
  Coins,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Layers,
  Sword,
  Shield,
  Users,
  Trophy,
  PackageCheck,
  Lock,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { GemArt } from '../../components/GameIcons/GemArt';
import { apiClient } from '../../core/network/apiClient';
import styles from './TopUpScreen.module.css';

interface PlayerProfile {
  id?: string;
  playerId: string;
  username: string;
  level: number;
  experience: number;
  gems: number;
  gold: number;
  rating?: number;
  rankTier?: number;
  rankWins?: number;
  rankLosses?: number;
}

interface TopUpPack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
  unitDefinitionIds?: number[];
  weaponDefinitionIds?: number[];
  trinketDefinitionIds?: number[];
  unitNames?: string[];
  weaponNames?: string[];
  trinketNames?: string[];
  isAvailable?: boolean;
}

interface GachaBanner {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const hasPackInclusions = (pack: TopUpPack): boolean =>
  Boolean(
    (pack.weaponNames && pack.weaponNames.length > 0) ||
      (pack.trinketNames && pack.trinketNames.length > 0) ||
      (pack.unitNames && pack.unitNames.length > 0) ||
      (pack.weaponDefinitionIds && pack.weaponDefinitionIds.length > 0) ||
      (pack.trinketDefinitionIds && pack.trinketDefinitionIds.length > 0) ||
      (pack.unitDefinitionIds && pack.unitDefinitionIds.length > 0)
  );

const hasVisibleInclusionNames = (pack: TopUpPack): boolean =>
  Boolean(
    (pack.weaponNames && pack.weaponNames.length > 0) ||
      (pack.trinketNames && pack.trinketNames.length > 0) ||
      (pack.unitNames && pack.unitNames.length > 0)
  );

const getPackBadge = (pack: TopUpPack): { label: string; variant: BadgeVariant } => {
  if (hasPackInclusions(pack)) {
    return { label: 'BUNDLE INCLUDED', variant: 'green' };
  }
  if (pack.gemsAmount >= 1000) {
    return { label: 'HIGH TIER', variant: 'yellow' };
  }
  return { label: 'OFFICIAL PACK', variant: 'neutral' };
};

export const TopUpScreen: React.FC = () => {
  const { isLoggedIn, username, playerId, openAuthPrompt, setPendingRedirect } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PlayerProfile>({
    playerId: playerId || '',
    username: username || 'Player',
    level: 1,
    experience: 0,
    gems: 0,
    gold: 0,
    rating: 0,
    rankTier: 0,
  });

  const [packs, setPacks] = useState<TopUpPack[]>([]);
  const [activeBanner, setActiveBanner] = useState<GachaBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'gems' | 'bundles'>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [profileResult, packsResult, bannerResult] = await Promise.allSettled([
        isLoggedIn ? apiClient.get<PlayerProfile>('/api/PlayerProfile') : Promise.resolve(null),
        apiClient.get<TopUpPack[]>('/api/topuppack'),
        apiClient.get<GachaBanner[]>('/api/gachabanner/active'),
      ]);

      // 1. Profile Data from Backend (Authenticated Players only)
      if (isLoggedIn && profileResult.status === 'fulfilled' && profileResult.value?.data) {
        const raw = profileResult.value.data;
        setProfile({
          id: raw.id,
          playerId: raw.playerId || playerId || '',
          username: raw.username || username || 'Player',
          level: raw.level ?? 1,
          experience: raw.experience ?? 0,
          gems: raw.gems ?? 0,
          gold: raw.gold ?? 0,
          rating: raw.rating ?? 0,
          rankTier: raw.rankTier ?? 0,
          rankWins: raw.rankWins ?? 0,
          rankLosses: raw.rankLosses ?? 0,
        });
      }

      // 2. Real Packs Data from Backend
      if (packsResult.status === 'fulfilled' && packsResult.value?.data) {
        const fetchedPacks = packsResult.value.data.filter((p) => p.isAvailable !== false);
        setPacks(fetchedPacks);
      } else if (packsResult.status === 'rejected') {
        const status = (packsResult.reason as { response?: { status?: number } })?.response?.status;
        setLoadError(
          status === 401
            ? 'Public Top-Up price list is temporarily unavailable without sign-in. Please sign in or ensure the Backend server has restarted with public catalog access.'
            : 'Unable to load Top-Up packages from the server. Please check your connection and retry.'
        );
      }

      // 3. Real Active Gacha / Event Banner from Backend
      if (
        bannerResult.status === 'fulfilled' &&
        bannerResult.value?.data &&
        bannerResult.value.data.length > 0
      ) {
        setActiveBanner(bannerResult.value.data[0]);
      }
    } catch (err) {
      console.error('Error fetching backend data in TopUpScreen:', err);
      setLoadError('Unexpected error while fetching catalog data.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, username, playerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time synchronization when payment is completed or profile update event received
  const { profileUpdateTimestamp } = useSyncStore();

  const syncProfileOnly = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await apiClient.get<PlayerProfile>('/api/PlayerProfile');
      if (res.data) {
        const raw = res.data;
        setProfile((prev) => ({
          ...prev,
          gems: raw.gems ?? prev.gems,
          gold: raw.gold ?? prev.gold,
          level: raw.level ?? prev.level,
          experience: raw.experience ?? prev.experience,
        }));
      }
    } catch {
      // ignore transient focus refresh errors
    }
  }, [isLoggedIn]);

  useEffect(() => {
    syncProfileOnly();
  }, [profileUpdateTimestamp, syncProfileOnly]);

  useEffect(() => {
    const handleFocus = () => syncProfileOnly();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncProfileOnly]);

  const handleSelectPack = (pkg: TopUpPack) => {
    if (!isLoggedIn) {
      openAuthPrompt({
        title: `Sign In to Purchase ${pkg.name}`,
        message: `Sign in to buy ${pkg.name} (${pkg.gemsAmount.toLocaleString('en-US')} Gems — ${pkg.priceVnd.toLocaleString('vi-VN')} VND) and deliver rewards directly to your Player ID.`,
        redirectTo: { path: '/checkout', state: { pack: pkg } },
      });
      return;
    }
    navigate('/checkout', { state: { pack: pkg } });
  };

  const handleGuestSignIn = () => {
    setPendingRedirect(null);
    navigate('/login');
  };

  const filteredPacks = packs.filter((pack) => {
    const isBundle = hasPackInclusions(pack);
    if (activeTab === 'bundles') return isBundle;
    if (activeTab === 'gems') return !isBundle;
    return true;
  });

  const featuredPack =
    packs.length > 0
      ? packs.reduce((max, p) => (p.gemsAmount > max.gemsAmount ? p : max), packs[0])
      : null;

  if (isLoading) {
    return (
      <VStack gap={5} width="100%">
        <Skeleton width="100%" height={180} radius={4} index={0} />
        <Skeleton width="100%" height={92} radius={4} index={1} />
        <Grid columns={{ minWidth: 245, max: 4, repeat: 'fit' }} gap={4} width="100%">
          {[0, 1, 2, 3].map((idx) => (
            <Skeleton key={idx} width="100%" height={340} radius={4} index={idx + 2} />
          ))}
        </Grid>
      </VStack>
    );
  }

  return (
    <VStack gap={5} width="100%">
      {/* 1. Hero Event Banner (Driven by Real Backend Data) */}
      {(activeBanner || featuredPack) && (
        <Card variant="default" elevation="med" padding={6} className={styles.heroCard}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroLayout}>
            <VStack gap={3} className={styles.heroCopy}>
              <div>
                <Badge
                  variant={activeBanner ? 'yellow' : 'cyan'}
                  icon={<Sparkles size={13} />}
                  label={activeBanner ? 'ACTIVE EVENT BANNER' : 'FEATURED REPLENISHMENT'}
                />
              </div>

              <Heading level={1}>
                {activeBanner ? activeBanner.name : featuredPack?.name}
              </Heading>

              <Text type="body" color="secondary" display="block">
                {activeBanner
                  ? activeBanner.description
                  : `Direct in-game replenishment offering ${featuredPack?.gemsAmount.toLocaleString('en-US')} Gems for ${featuredPack?.priceVnd.toLocaleString('vi-VN')} VND.`}
              </Text>

              {featuredPack && (
                <div>
                  <Badge
                    variant="cyan"
                    icon={<Gem size={13} />}
                    label={`Top Tier: ${featuredPack.name} (${featuredPack.gemsAmount.toLocaleString('en-US')} Gems)`}
                  />
                </div>
              )}
            </VStack>

            <div className={styles.heroArt} aria-hidden="true">
              <GemArt gemsAmount={featuredPack?.gemsAmount || 1000} size={136} />
            </div>
          </div>
        </Card>
      )}

      {/* 2. Character Verification & Guest Banner */}
      {isLoggedIn ? (
        <VStack gap={3} width="100%">
          <Card variant="default" padding={5} width="100%">
            <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
              <HStack gap={3} vAlign="center" wrap="wrap" className={styles.verifyIdentity}>
                <Avatar
                  size={48}
                  name={profile.username}
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`}
                  status={<AvatarStatusDot variant="success" label="Target Verified" />}
                />
                <VStack gap={1.5}>
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Heading level={3}>{profile.username}</Heading>
                    <Badge variant="yellow" label={`Lv.${profile.level}`} />
                    <Badge variant="cyan" label="Pactkeeper Official" />
                    <Badge
                      variant="success"
                      icon={<ShieldCheck size={12} />}
                      label="Target Verified"
                    />
                  </HStack>

                  <HStack gap={3} vAlign="center" wrap="wrap">
                    <Text type="code" size="xsm" color="secondary">
                      Player ID: {profile.playerId || playerId || 'N/A'}
                    </Text>
                    <HStack gap={2} vAlign="center">
                      <Text type="supporting" size="xsm" color="secondary">
                        XP {profile.experience}/100
                      </Text>
                      <div className={styles.xpBarWrap}>
                        <ProgressBar
                          value={profile.experience}
                          max={100}
                          label="Account experience progress"
                          isLabelHidden
                          variant="accent"
                        />
                      </div>
                    </HStack>
                    {profile.rating !== undefined && profile.rating > 0 && (
                      <Badge
                        variant="neutral"
                        icon={<Trophy size={12} />}
                        label={`Rating: ${profile.rating}`}
                      />
                    )}
                  </HStack>
                </VStack>
              </HStack>

              <HStack gap={3} wrap="wrap">
                <Card variant="muted" padding={3} className={styles.balanceTile}>
                  <VStack gap={0.5}>
                    <Text type="supporting" size="xsm" color="secondary">
                      CURRENT GEMS
                    </Text>
                    <HStack gap={1.5} vAlign="center">
                      <Gem size={17} className={styles.gemIcon} aria-hidden="true" />
                      <Text type="large" weight="bold" hasTabularNumbers>
                        {profile.gems.toLocaleString('en-US')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>

                <Card variant="muted" padding={3} className={styles.balanceTile}>
                  <VStack gap={0.5}>
                    <Text type="supporting" size="xsm" color="secondary">
                      VAULT GOLD
                    </Text>
                    <HStack gap={1.5} vAlign="center">
                      <Coins size={17} className={styles.goldIcon} aria-hidden="true" />
                      <Text type="large" weight="bold" hasTabularNumbers>
                        {profile.gold.toLocaleString('en-US')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              </HStack>
            </HStack>
          </Card>

          <Banner
            status="info"
            title={`Confirm Player ID: ${profile.playerId || playerId}`}
            description="Purchases are credited directly via in-game inventory and mail upon PayOS verification."
          />
        </VStack>
      ) : (
        <VStack gap={3} width="100%">
          <Card variant="default" padding={5} width="100%">
            <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap">
              <HStack gap={3} vAlign="center" wrap="wrap">
                <Avatar size={48} alt="Guest Explorer" />
                <VStack gap={1}>
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Heading level={3}>Guest Explorer</Heading>
                    <Badge variant="neutral" label="Pactkeeper Official" />
                    <Badge variant="yellow" icon={<Lock size={12} />} label="Guest Access" />
                  </HStack>
                  <Text type="supporting" size="sm" color="secondary">
                    Sign in to verify your target Player ID and view your live Gems and Vault Gold
                    balance.
                  </Text>
                </VStack>
              </HStack>

              <Button
                label="Sign In to Top Up"
                variant="primary"
                size="md"
                icon={<LogIn size={16} />}
                onClick={handleGuestSignIn}
              />
            </HStack>
          </Card>

          <Banner
            status="warning"
            title="Browsing as Guest (View-Only Mode)"
            description="All package prices are live from the catalog. Sign in is required before checkout or viewing Ledger, Missives, and Counsel."
          />
        </VStack>
      )}

      {/* 3. Category Filter Tabs */}
      <TabList
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'all' | 'gems' | 'bundles')}
        hasDivider
      >
        <Tab
          value="all"
          label={`All Packages (${packs.length})`}
          icon={<Layers size={15} />}
        />
        <Tab value="gems" label="Pure Gem Packs" icon={<Gem size={15} />} />
        <Tab value="bundles" label="Hero & Weapon Bundles" icon={<Sword size={15} />} />
      </TabList>

      {/* 4. Product Catalog Grid */}
      {loadError ? (
        <Card variant="default" padding={6}>
          <EmptyState
            icon={<AlertCircle size={36} />}
            title="Catalog Temporarily Unavailable"
            description={loadError}
            actions={
              <HStack gap={2} hAlign="center" wrap="wrap">
                <Button
                  label="Retry"
                  variant="secondary"
                  icon={<RefreshCw size={15} />}
                  onClick={fetchData}
                />
                {!isLoggedIn && (
                  <Button
                    label="Sign In"
                    variant="primary"
                    icon={<LogIn size={15} />}
                    onClick={handleGuestSignIn}
                  />
                )}
              </HStack>
            }
          />
        </Card>
      ) : filteredPacks.length === 0 ? (
        <Card variant="default" padding={6}>
          <EmptyState
            icon={<PackageCheck size={36} />}
            title="No Packages Found in this Category"
            description="Please switch category filters or check back once administrators publish additional packs."
          />
        </Card>
      ) : (
        <Grid
          columns={{ minWidth: 255, max: 4, repeat: 'fit' }}
          gap={4}
          width="100%"
          className={styles.catalogGrid}
        >
          {filteredPacks.map((pkg) => {
            const hasNamedInclusions = hasVisibleInclusionNames(pkg);
            const isBundle = hasPackInclusions(pkg);
            const badge = getPackBadge(pkg);
            const cardA11yLabel = isLoggedIn
              ? `Buy ${pkg.name}, ${pkg.gemsAmount} Gems, ${pkg.priceVnd.toLocaleString('vi-VN')} VND`
              : `Sign in required to buy ${pkg.name}, ${pkg.gemsAmount} Gems, ${pkg.priceVnd.toLocaleString('vi-VN')} VND`;

            return (
              <ClickableCard
                key={pkg.id}
                label={cardA11yLabel}
                onClick={() => handleSelectPack(pkg)}
                variant="default"
                padding={0}
                height="100%"
                className={styles.productCard}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardHeaderRow}>
                    <Badge variant={badge.variant} label={badge.label} />
                  </div>

                  <div className={styles.artStage} aria-hidden="true">
                    <div className={styles.artGlow} />
                    <GemArt gemsAmount={pkg.gemsAmount} size={88} className={styles.gemArtItem} />
                  </div>

                  <VStack gap={1.5} hAlign="center" width="100%">
                    <Heading level={3} justify="center">
                      {pkg.name}
                    </Heading>
                    <HStack gap={1.5} vAlign="center" hAlign="center">
                      <Gem size={16} className={styles.gemIcon} aria-hidden="true" />
                      <Text type="large" weight="bold" hasTabularNumbers>
                        {pkg.gemsAmount.toLocaleString('en-US')}
                      </Text>
                      <Text type="supporting" size="sm" className={styles.gemUnit}>
                        Gems
                      </Text>
                    </HStack>
                  </VStack>

                  <div className={styles.inclusionsArea}>
                    {hasNamedInclusions ? (
                      <div className={styles.inclusionsRow}>
                        {pkg.unitNames?.map((unit, idx) => (
                          <Token
                            key={`u-${idx}`}
                            label={unit}
                            size="sm"
                            color="blue"
                            icon={<Users size={12} />}
                          />
                        ))}
                        {pkg.weaponNames?.map((weapon, idx) => (
                          <Token
                            key={`w-${idx}`}
                            label={weapon}
                            size="sm"
                            color="cyan"
                            icon={<Sword size={12} />}
                          />
                        ))}
                        {pkg.trinketNames?.map((trinket, idx) => (
                          <Token
                            key={`t-${idx}`}
                            label={trinket}
                            size="sm"
                            color="yellow"
                            icon={<Shield size={12} />}
                          />
                        ))}
                      </div>
                    ) : (
                      <Text
                        type="supporting"
                        size="xsm"
                        color="secondary"
                        justify="center"
                        display="block"
                      >
                        {isBundle
                          ? 'In-Game Hero & Equipment Bundle'
                          : 'Standard Gem Top-Up Package'}
                      </Text>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceCta} aria-hidden="true">
                      <Text type="label" weight="bold" hasTabularNumbers className={styles.priceLabel}>
                        {pkg.priceVnd.toLocaleString('vi-VN')} VND
                      </Text>
                      {isLoggedIn ? (
                        <ChevronRight size={16} className={styles.priceIcon} />
                      ) : (
                        <Lock size={14} className={styles.priceIcon} />
                      )}
                    </div>
                  </div>
                </div>
              </ClickableCard>
            );
          })}
        </Grid>
      )}
    </VStack>
  );
};
