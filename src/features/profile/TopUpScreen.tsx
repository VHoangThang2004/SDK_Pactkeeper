import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ArrowDownUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { Drawer } from '@astryxdesign/core/Drawer';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Section } from '@astryxdesign/core/Section';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Token, type TokenColor } from '@astryxdesign/core/Token';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { GemArt } from '../../components/GameIcons/GemArt';
import { apiClient } from '../../core/network/apiClient';

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

const getPackTierToken = (pack: TopUpPack): { label: string; color: TokenColor } => {
  if (hasPackInclusions(pack)) {
    return { label: 'Bundle Included', color: 'green' };
  }
  if (pack.gemsAmount >= 1000) {
    return { label: 'High Tier', color: 'yellow' };
  }
  return { label: 'Official Pack', color: 'gray' };
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'gems-desc';

const sortLabels: Record<SortOption, string> = {
  default: 'Default Order',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'gems-desc': 'Most Gems First',
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
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedPackForDrawer, setSelectedPackForDrawer] = useState<TopUpPack | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [profileResult, packsResult, bannerResult] = await Promise.allSettled([
        isLoggedIn ? apiClient.get<PlayerProfile>('/api/PlayerProfile') : Promise.resolve(null),
        apiClient.get<TopUpPack[]>('/api/topuppack'),
        apiClient.get<GachaBanner[]>('/api/gachabanner/active'),
      ]);

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
      // Ignore transient focus sync errors
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

  const pureGemCount = useMemo(
    () => packs.filter((pack) => !hasPackInclusions(pack)).length,
    [packs]
  );

  const bundleCount = useMemo(
    () => packs.filter((pack) => hasPackInclusions(pack)).length,
    [packs]
  );

  const filteredPacks = useMemo(
    () =>
      packs.filter((pack) => {
        const isBundle = hasPackInclusions(pack);
        if (activeTab === 'bundles') return isBundle;
        if (activeTab === 'gems') return !isBundle;
        return true;
      }),
    [packs, activeTab]
  );

  const sortedPacks = useMemo(() => {
    const list = [...filteredPacks];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.priceVnd - b.priceVnd);
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.priceVnd - a.priceVnd);
    }
    if (sortBy === 'gems-desc') {
      return list.sort((a, b) => b.gemsAmount - a.gemsAmount);
    }
    return list;
  }, [filteredPacks, sortBy]);

  const xpPercent = Math.min(Math.max(profile.experience, 0), 100);
  const featuredPack =
    packs.length > 0
      ? packs.reduce((max, p) => (p.gemsAmount > max.gemsAmount ? p : max), packs[0])
      : null;

  if (isLoading) {
    return (
      <VStack gap={5} width="100%">
        <Skeleton width="100%" height={180} radius={4} />
        <Skeleton width="100%" height={96} radius={4} />
        <Grid columns={{ minWidth: 250, max: 4, repeat: 'fit' }} gap={4} width="100%">
          {[0, 1, 2, 3].map((idx) => (
            <Skeleton key={idx} width="100%" height={360} radius={4} />
          ))}
        </Grid>
      </VStack>
    );
  }

  return (
    <VStack gap={5} width="100%">
      {/* 1. Character Identity & Balance (Primary Player Context) */}
      {isLoggedIn ? (
        <Section variant="section" padding={5} width="100%">
          <VStack gap={4} width="100%">
            <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap" width="100%">
              <HStack gap={3} vAlign="center" wrap="wrap" className="identityCol">
                <Avatar
                  size="xl"
                  name={profile.username}
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`}
                  status={<AvatarStatusDot variant="success" label="Target account verified" />}
                />
                <VStack gap={1.5}>
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Heading level={2} weight="bold">{profile.username}</Heading>
                    <Token color="yellow" size="sm" label={`Lv.${profile.level}`} />
                    <HStack gap={1} vAlign="center">
                      <StatusDot variant="success" label="Verified" />
                      <Text type="supporting" size="sm" color="secondary">
                        Target Account Verified · Official Server
                      </Text>
                    </HStack>
                  </HStack>

                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text type="code" size="sm" color="secondary" weight="semibold">
                      Player ID: {profile.playerId || playerId || 'N/A'}
                    </Text>
                    <HStack gap={1.5} vAlign="center">
                      <Text type="supporting" size="sm" color="secondary" hasTabularNumbers>
                        XP {profile.experience}/100
                      </Text>
                      <ProgressBar
                        label="Character experience"
                        isLabelHidden
                        value={xpPercent}
                        max={100}
                        className="xpBar"
                      />
                    </HStack>
                    {profile.rating !== undefined && profile.rating > 0 && (
                      <Token
                        color="yellow"
                        size="sm"
                        icon={<Icon icon={Trophy} size="xsm" />}
                        label={`Rating ${profile.rating}`}
                      />
                    )}
                  </HStack>
                </VStack>
              </HStack>

              <HStack gap={3} wrap="wrap">
                <Card variant="muted" padding={4}>
                  <VStack gap={1}>
                    <Text type="supporting" size="base" color="secondary" weight="bold">
                      CURRENT GEMS
                    </Text>
                    <HStack gap={2} vAlign="center">
                      <Icon icon={Gem} size="lg" color="accent" />
                      <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                        {profile.gems.toLocaleString('en-US')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>

                <Card variant="muted" padding={4}>
                  <VStack gap={1}>
                    <Text type="supporting" size="base" color="secondary" weight="bold">
                      VAULT GOLD
                    </Text>
                    <HStack gap={2} vAlign="center">
                      <Icon icon={Coins} size="lg" color="accent" />
                      <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                        {profile.gold.toLocaleString('en-US')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              </HStack>
            </HStack>

            <Divider />

            <HStack gap={2} vAlign="center">
              <Icon icon={ShieldCheck} size="md" color="accent" />
              <Text type="supporting" size="base" color="secondary">
                Purchases are credited directly via in-game inventory and mailbox upon PayOS verification.
              </Text>
            </HStack>
          </VStack>
        </Section>
      ) : (
        <Section variant="section" padding={5} width="100%">
          <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap" width="100%">
            <HStack gap={3} vAlign="center" wrap="wrap" className="identityCol">
              <Avatar size="xl" name="Guest" />
              <VStack gap={1.5}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Heading level={2} weight="bold">Guest Explorer</Heading>
                  <Token
                    color="yellow"
                    size="md"
                    icon={<Icon icon={Lock} size="xsm" />}
                    label="Guest Access"
                  />
                </HStack>
                <Text type="body" size="base" color="secondary" display="block">
                  Sign in to verify your target Player ID and view your live Gems &amp; Vault Gold balance.
                </Text>
              </VStack>
            </HStack>

            <Button
              label="Sign In to Top Up"
              variant="primary"
              size="lg"
              icon={<Icon icon={LogIn} size="sm" />}
              onClick={handleGuestSignIn}
            />
          </HStack>
        </Section>
      )}

      {/* 2. Hero Event Banner (Active Events & Top Tier Promo) */}
      {(activeBanner || featuredPack) && (
        <Section variant="section" padding={5} width="100%">
          <HStack hAlign="between" vAlign="center" gap={6} wrap="wrap" width="100%">
            <VStack gap={2} className="heroCopy">
              <HStack gap={2} wrap="wrap">
                <Token
                  color={activeBanner ? 'yellow' : 'cyan'}
                  size="md"
                  icon={<Icon icon={Sparkles} size="xsm" />}
                  label={activeBanner ? 'Active Event' : 'Featured Replenishment'}
                />
                {featuredPack && (
                  <Token
                    color="cyan"
                    size="md"
                    icon={<Icon icon={Gem} size="xsm" />}
                    label={`Top Tier: ${featuredPack.name} (+${featuredPack.gemsAmount.toLocaleString('en-US')} Gems)`}
                  />
                )}
              </HStack>

              <Heading level={2} weight="bold">
                {activeBanner ? activeBanner.name : featuredPack?.name}
              </Heading>

              <Text type="body" size="lg" color="secondary" display="block">
                {activeBanner
                  ? activeBanner.description
                  : `Direct in-game replenishment offering ${featuredPack?.gemsAmount.toLocaleString('en-US')} Gems for ${featuredPack?.priceVnd.toLocaleString('vi-VN')} VND.`}
              </Text>
            </VStack>

            <Center>
              <GemArt gemsAmount={featuredPack?.gemsAmount || 1000} size={120} />
            </Center>
          </HStack>
        </Section>
      )}

      {/* 3. Category Filter Tabs & Sort Dropdown */}
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3} width="100%">
        <TabList
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'all' | 'gems' | 'bundles')}
        >
          <Tab
            value="all"
            label="All Packages"
            icon={<Icon icon={Layers} size="sm" />}
            endContent={<Badge variant="neutral" label={packs.length} />}
          />
          <Tab
            value="gems"
            label="Pure Gem Packs"
            icon={<Icon icon={Gem} size="sm" />}
            endContent={<Badge variant="neutral" label={pureGemCount} />}
          />
          <Tab
            value="bundles"
            label="Hero & Weapon Bundles"
            icon={<Icon icon={Sword} size="sm" />}
            endContent={<Badge variant="neutral" label={bundleCount} />}
          />
        </TabList>

        <DropdownMenu
          button={{
            variant: 'secondary',
            size: 'sm',
            label: `Sort: ${sortLabels[sortBy]}`,
            icon: <Icon icon={ArrowDownUp} size="sm" />,
          }}
          items={[
            {
              id: 'default',
              label: 'Default Order',
              onClick: () => setSortBy('default'),
            },
            {
              id: 'price-asc',
              label: 'Price: Low to High',
              onClick: () => setSortBy('price-asc'),
            },
            {
              id: 'price-desc',
              label: 'Price: High to Low',
              onClick: () => setSortBy('price-desc'),
            },
            {
              id: 'gems-desc',
              label: 'Most Gems First',
              onClick: () => setSortBy('gems-desc'),
            },
          ]}
        />
      </HStack>

      {/* 4. Product Catalog Grid (Real Backend Packs) */}
      {loadError ? (
        <Card variant="default" padding={6} width="100%">
          <EmptyState
            icon={<Icon icon={AlertCircle} size="lg" color="accent" />}
            title="Catalog Temporarily Unavailable"
            description={loadError}
            actions={
              <HStack gap={2} hAlign="center" wrap="wrap">
                <Button
                  label="Retry"
                  variant="secondary"
                  icon={<Icon icon={RefreshCw} size="sm" />}
                  onClick={fetchData}
                />
                {!isLoggedIn && (
                  <Button
                    label="Sign In"
                    variant="primary"
                    icon={<Icon icon={LogIn} size="sm" />}
                    onClick={handleGuestSignIn}
                  />
                )}
              </HStack>
            }
          />
        </Card>
      ) : sortedPacks.length === 0 ? (
        <Card variant="default" padding={6} width="100%">
          <EmptyState
            icon={<Icon icon={PackageCheck} size="lg" color="accent" />}
            title="No Packages Found in this Category"
            description="Please check other categories or contact an Administrator."
          />
        </Card>
      ) : (
        <Grid
          columns={{ minWidth: 250, max: 4, repeat: 'fit' }}
          gap={4}
          width="100%"
          className="catalogGrid"
        >
          {sortedPacks.map((pkg) => {
            const isBundle = hasPackInclusions(pkg);
            const hasNamedInclusions = hasVisibleInclusionNames(pkg);
            const tierToken = getPackTierToken(pkg);

            return (
              <Card key={pkg.id} variant="default" padding={5} height="100%" className="packCard">
                <VStack gap={4} hAlign="center" height="100%" width="100%">
                  <HStack hAlign="end" width="100%">
                    <Token size="md" color={tierToken.color} label={tierToken.label} />
                  </HStack>

                  <Center height={116} width="100%">
                    <GemArt gemsAmount={pkg.gemsAmount} size={92} />
                  </Center>

                  <VStack gap={1} hAlign="center" width="100%">
                    <Heading level={3} weight="bold" justify="center">
                      {pkg.name}
                    </Heading>
                    <HStack gap={1.5} vAlign="center" hAlign="center">
                      <Icon icon={Gem} size="md" color="accent" />
                      <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                        {pkg.gemsAmount.toLocaleString('en-US')}
                      </Text>
                      <Text type="supporting" size="base" color="secondary">
                        Gems
                      </Text>
                    </HStack>
                  </VStack>

                  <VStack
                    gap={1.5}
                    hAlign="center"
                    vAlign="center"
                    width="100%"
                    className="inclusionsArea"
                  >
                    {hasNamedInclusions ? (
                      <HStack gap={1.5} hAlign="center" wrap="wrap" width="100%">
                        {pkg.unitNames?.map((unit, idx) => (
                          <Token
                            key={`u-${idx}`}
                            label={unit}
                            size="md"
                            color="blue"
                            icon={<Icon icon={Users} size="xsm" />}
                          />
                        ))}
                        {pkg.weaponNames?.map((weapon, idx) => (
                          <Token
                            key={`w-${idx}`}
                            label={weapon}
                            size="md"
                            color="cyan"
                            icon={<Icon icon={Sword} size="xsm" />}
                          />
                        ))}
                        {pkg.trinketNames?.map((trinket, idx) => (
                          <Token
                            key={`t-${idx}`}
                            label={trinket}
                            size="md"
                            color="yellow"
                            icon={<Icon icon={Shield} size="xsm" />}
                          />
                        ))}
                      </HStack>
                    ) : (
                      <Text
                        type="supporting"
                        size="base"
                        color="secondary"
                        justify="center"
                        display="block"
                      >
                        {isBundle
                          ? 'In-Game Hero & Equipment Bundle'
                          : 'Standard Gem Top-Up Package'}
                      </Text>
                    )}
                  </VStack>

                  <VStack width="100%" className="cardFooter">
                    <Button
                      label={`${pkg.priceVnd.toLocaleString('vi-VN')} VND`}
                      variant="primary"
                      size="lg"
                      width="100%"
                      endContent={
                        isLoggedIn ? (
                          <Icon icon={ChevronRight} size="md" />
                        ) : (
                          <Icon icon={Lock} size="sm" />
                        )
                      }
                      tooltip={
                        isLoggedIn
                          ? 'Review Package & Checkout'
                          : 'Sign in required to purchase this package'
                      }
                      onClick={() => setSelectedPackForDrawer(pkg)}
                    />
                  </VStack>
                </VStack>
              </Card>
            );
          })}
        </Grid>
      )}

      {/* 5. Quick Pack Order Drawer */}
      <Drawer
        isOpen={Boolean(selectedPackForDrawer)}
        onOpenChange={(open) => {
          if (!open) setSelectedPackForDrawer(null);
        }}
        label={
          selectedPackForDrawer
            ? `Order: ${selectedPackForDrawer.name}`
            : 'Order Summary'
        }
        side="end"
        width={420}
      >
        {selectedPackForDrawer && (
          <VStack gap={5} width="100%" padding={4}>
            {/* Header */}
            <HStack hAlign="between" vAlign="center" width="100%">
              <VStack gap={0.5}>
                <Text type="supporting" size="2xs" color="secondary">
                  ORDER PREVIEW
                </Text>
                <Heading level={2}>{selectedPackForDrawer.name}</Heading>
              </VStack>
              <Token
                color={getPackTierToken(selectedPackForDrawer).color}
                label={getPackTierToken(selectedPackForDrawer).label}
              />
            </HStack>

            <Divider />

            {/* Package Illustration & Value */}
            <Card variant="muted" padding={4} width="100%">
              <HStack gap={4} vAlign="center">
                <Center width={80} height={80}>
                  <GemArt gemsAmount={selectedPackForDrawer.gemsAmount} size={72} />
                </Center>
                <VStack gap={1}>
                  <HStack gap={1.5} vAlign="center">
                    <Icon icon={Gem} size="sm" color="accent" />
                    <Text type="large" weight="bold" hasTabularNumbers>
                      +{selectedPackForDrawer.gemsAmount.toLocaleString('en-US')} Gems
                    </Text>
                  </HStack>
                  <Text type="supporting" size="sm" color="secondary">
                    Direct credit to in-game Vault
                  </Text>
                </VStack>
              </HStack>
            </Card>

            {/* Included items if bundle */}
            {hasPackInclusions(selectedPackForDrawer) && (
              <VStack gap={2} width="100%">
                <Text type="supporting" size="sm" color="secondary">
                  Included Bonus Items:
                </Text>
                <HStack gap={1.5} wrap="wrap">
                  {selectedPackForDrawer.unitNames?.map((u, i) => (
                    <Token
                      key={`du-${i}`}
                      label={u}
                      size="sm"
                      color="blue"
                      icon={<Icon icon={Users} size="xsm" />}
                    />
                  ))}
                  {selectedPackForDrawer.weaponNames?.map((w, i) => (
                    <Token
                      key={`dw-${i}`}
                      label={w}
                      size="sm"
                      color="cyan"
                      icon={<Icon icon={Sword} size="xsm" />}
                    />
                  ))}
                  {selectedPackForDrawer.trinketNames?.map((t, i) => (
                    <Token
                      key={`dt-${i}`}
                      label={t}
                      size="sm"
                      color="yellow"
                      icon={<Icon icon={Shield} size="xsm" />}
                    />
                  ))}
                </HStack>
              </VStack>
            )}

            {/* Character Target info */}
            <Card variant="default" padding={3} width="100%">
              <VStack gap={2} width="100%">
                <Text type="supporting" size="2xs" color="secondary">
                  DELIVERY RECIPIENT
                </Text>
                {isLoggedIn ? (
                  <HStack hAlign="between" vAlign="center" width="100%">
                    <HStack gap={2} vAlign="center">
                      <Avatar size="sm" name={profile.username} />
                      <VStack gap={0.5}>
                        <Text weight="semibold" size="sm">
                          {profile.username}
                        </Text>
                        <Text type="code" size="2xs" color="secondary">
                          UID: {profile.playerId || playerId}
                        </Text>
                      </VStack>
                    </HStack>
                    <StatusDot variant="success" label="Verified Destination" />
                  </HStack>
                ) : (
                  <Banner
                    status="warning"
                    title="Guest Mode"
                    description="Sign in is required before checkout to deliver rewards directly to your Player ID."
                  />
                )}
              </VStack>
            </Card>

            {/* Price & Guarantee */}
            <VStack gap={3} width="100%">
              <HStack hAlign="between" vAlign="center" width="100%">
                <Text color="secondary" size="base">
                  Total Price
                </Text>
                <Heading level={2}>
                  {selectedPackForDrawer.priceVnd.toLocaleString('vi-VN')} VND
                </Heading>
              </HStack>

              <HStack gap={2} vAlign="start">
                <Icon icon={ShieldCheck} size="sm" color="accent" />
                <Text type="supporting" size="2xs" color="secondary">
                  Official PayOS VietQR Gateway · 0 VND fee · Instant 3-15s in-game credit
                </Text>
              </HStack>
            </VStack>

            <Divider />

            {/* Action CTA */}
            <VStack gap={2} width="100%">
              <Button
                label={
                  isLoggedIn
                    ? `Proceed to PayOS Checkout (${selectedPackForDrawer.priceVnd.toLocaleString('vi-VN')} VND)`
                    : 'Sign In to Purchase'
                }
                variant="primary"
                size="lg"
                width="100%"
                icon={<Icon icon={isLoggedIn ? ChevronRight : LogIn} size="sm" />}
                onClick={() => {
                  const pkg = selectedPackForDrawer;
                  setSelectedPackForDrawer(null);
                  handleSelectPack(pkg);
                }}
              />

              <Button
                label="Close & Keep Browsing"
                variant="ghost"
                width="100%"
                onClick={() => setSelectedPackForDrawer(null)}
              />
            </VStack>
          </VStack>
        )}
      </Drawer>
    </VStack>
  );
};
