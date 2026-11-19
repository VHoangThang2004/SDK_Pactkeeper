import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
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
  const [banner, setBanner] = useState<GachaBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'gems' | 'bundles'>('all');

  const { profileUpdateTimestamp } = useSyncStore();

  const fetchBackendData = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        if (isLoggedIn) {
          const [profRes, packRes] = await Promise.all([
            apiClient.get<PlayerProfile>('/api/playerprofile'),
            apiClient.get<TopUpPack[]>('/api/topuppack'),
          ]);

          if (profRes.data) {
            setProfile(profRes.data);
          }

          if (packRes.data && Array.isArray(packRes.data)) {
            const validPacks = packRes.data.filter((p) => p.isAvailable !== false);
            validPacks.sort((a, b) => a.priceVnd - b.priceVnd);
            setPacks(validPacks);
          }
        } else {
          const packRes = await apiClient.get<TopUpPack[]>('/api/topuppack');
          if (packRes.data && Array.isArray(packRes.data)) {
            const validPacks = packRes.data.filter((p) => p.isAvailable !== false);
            validPacks.sort((a, b) => a.priceVnd - b.priceVnd);
            setPacks(validPacks);
          }
        }

        try {
          const bannerRes = await apiClient.get<GachaBanner>('/api/gachabanner/active');
          if (bannerRes.data && bannerRes.data.isActive) {
            setBanner(bannerRes.data);
          }
        } catch {
          // Optional banner endpoint
        }
      } catch (err: unknown) {
        console.error('Error fetching real backend data:', err);
        if (isInitial) {
          setLoadError(
            'Could not connect to Backend API (http://localhost:5276). Please ensure the server is running.'
          );
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [isLoggedIn]
  );

  useEffect(() => {
    fetchBackendData(true);
  }, [fetchBackendData]);

  useEffect(() => {
    if (isLoggedIn && profileUpdateTimestamp > 0) {
      fetchBackendData(false);
    }
  }, [isLoggedIn, profileUpdateTimestamp, fetchBackendData]);

  useEffect(() => {
    const handleFocus = () => fetchBackendData(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchBackendData]);

  const handleSelectPack = (pack: TopUpPack) => {
    const checkoutPack = {
      ...pack,
      resolvedUnitNames: pack.unitNames || [],
      resolvedWeaponNames: pack.weaponNames || [],
      resolvedTrinketNames: pack.trinketNames || [],
    };

    if (!isLoggedIn) {
      openAuthPrompt({
        title: `Sign In to Purchase ${pack.name}`,
        message: `You are browsing the official Top-Up price list as a Guest. Please sign in to your Pactkeeper account to purchase "${
          pack.name
        }" (${pack.priceVnd.toLocaleString('vi-VN')} VND) and deliver ${pack.gemsAmount.toLocaleString(
          'en-US'
        )} Gems to your character.`,
        redirectTo: {
          path: '/checkout',
          state: { pack: checkoutPack },
        },
      });
      return;
    }

    navigate('/checkout', {
      state: { pack: checkoutPack },
    });
  };

  const handleSignInFromGuest = () => {
    setPendingRedirect({ path: '/profile/topup' });
    navigate('/login');
  };

  const pureGemPacksCount = useMemo(
    () => packs.filter((p) => !hasPackInclusions(p)).length,
    [packs]
  );
  const bundlePacksCount = useMemo(
    () => packs.filter((p) => hasPackInclusions(p)).length,
    [packs]
  );

  const filteredPacks = useMemo(
    () =>
      packs.filter((p) => {
        const hasBundle = hasPackInclusions(p);
        if (activeTab === 'gems') return !hasBundle;
        if (activeTab === 'bundles') return hasBundle;
        return true;
      }),
    [packs, activeTab]
  );

  const xpPercent = Math.min(100, Math.max(0, profile.experience || 0));

  return (
    <VStack gap={5} width="100%">
      {/* Hero Banner + Account Status Card */}
      <Section variant="muted" padding={5} width="100%">
        <Grid columns={{ minWidth: 300, max: 2, repeat: 'fit' }} gap={5} width="100%">
          <VStack gap={3} vAlign="center">
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Token
                color="yellow"
                size="sm"
                icon={<Icon icon={Sparkles} size="xsm" />}
                label={banner ? 'Active Event Banner' : 'Official Top-Up Center'}
              />
              <HStack gap={1.5} vAlign="center">
                <StatusDot variant="success" label="PayOS Verified" />
                <Text type="supporting" size="xsm" color="secondary">
                  PayOS Direct Delivery
                </Text>
              </HStack>
            </HStack>

            <Heading level={1}>{banner ? banner.name : 'Pactkeeper Treasury'}</Heading>

            <Text type="body" color="secondary" display="block">
              {banner
                ? banner.description
                : 'Recharge Gems and claim exclusive Equipment & Hero Bundles directly delivered to your Pactkeeper character account.'}
            </Text>
          </VStack>

          <Card variant="default" elevation="low" padding={5}>
            {isLoggedIn ? (
              <VStack gap={4} width="100%">
                <HStack hAlign="between" vAlign="start" gap={3} wrap="wrap" width="100%">
                  <HStack gap={3} vAlign="center">
                    <Avatar
                      size={48}
                      name={profile.username || username || 'Hero'}
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${
                        profile.username || username || 'Hero'
                      }`}
                      status={<AvatarStatusDot variant="success" label="Character active" />}
                    />
                    <VStack gap={1}>
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Heading level={3}>{profile.username || username}</Heading>
                        <Token color="yellow" size="sm" label={`Lv.${profile.level}`} />
                      </HStack>
                      <Text type="code" size="xsm" color="secondary">
                        Player ID: {profile.playerId || playerId || 'N/A'}
                      </Text>
                      <HStack gap={2} vAlign="center">
                        <Text type="supporting" size="xsm" color="secondary" hasTabularNumbers>
                          XP {profile.experience}/100
                        </Text>
                        <ProgressBar
                          label="Character experience"
                          value={xpPercent}
                          max={100}
                        />
                      </HStack>
                    </VStack>
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

                <Grid columns={2} gap={3} width="100%">
                  <Card variant="muted" padding={3}>
                    <HStack gap={2} vAlign="center">
                      <Icon icon={Gem} size="md" color="cyan" />
                      <VStack gap={0}>
                        <Text type="supporting" size="xsm" color="secondary">
                          Current Gems
                        </Text>
                        <Text type="label" size="base" weight="bold" hasTabularNumbers>
                          {(profile.gems || 0).toLocaleString('en-US')}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>

                  <Card variant="muted" padding={3}>
                    <HStack gap={2} vAlign="center">
                      <Icon icon={Coins} size="md" color="yellow" />
                      <VStack gap={0}>
                        <Text type="supporting" size="xsm" color="secondary">
                          Current Gold
                        </Text>
                        <Text type="label" size="base" weight="bold" hasTabularNumbers>
                          {(profile.gold || 0).toLocaleString('en-US')}
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>
                </Grid>
              </VStack>
            ) : (
              <VStack gap={4} width="100%">
                <HStack hAlign="between" vAlign="start" gap={3} wrap="wrap" width="100%">
                  <HStack gap={3} vAlign="center">
                    <Avatar size={48} name="Guest Explorer" />
                    <VStack gap={1}>
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Heading level={3}>Guest Explorer</Heading>
                        <Token
                          color="gray"
                          size="sm"
                          icon={<Icon icon={Lock} size="xsm" />}
                          label="Preview Mode"
                        />
                      </HStack>
                      <Text type="supporting" size="xsm" color="secondary">
                        Public price catalog · Sign in required to purchase
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>

                <Text type="supporting" size="sm" color="secondary" display="block">
                  You can freely inspect all official Top-Up packages and bundle inclusions below.
                  Sign in to link your Character UID and unlock instant PayOS checkout.
                </Text>

                <Button
                  label="Sign In to Top Up"
                  variant="primary"
                  width="100%"
                  icon={<Icon icon={LogIn} size="sm" />}
                  onClick={handleSignInFromGuest}
                />
              </VStack>
            )}
          </Card>
        </Grid>
      </Section>

      {/* Account / Guest Verification Notice */}
      {isLoggedIn ? (
        <Banner
          status="info"
          title={`Confirm your Player ID: ${profile.playerId || playerId || 'Bound Account'}`}
          description="Purchases are directly credited via in-game inventory and mail upon PayOS verification."
        />
      ) : (
        <Banner
          status="info"
          title="Browsing as Guest"
          description="All Top-Up prices below are live from the official game server. Selecting any package will prompt you to sign in before proceeding to PayOS checkout."
          endContent={
            <Button
              label="Sign In"
              variant="secondary"
              size="sm"
              icon={<Icon icon={LogIn} size="sm" />}
              onClick={handleSignInFromGuest}
            />
          }
        />
      )}

      {/* Package Category Filter Tabs */}
      <TabList
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'all' | 'gems' | 'bundles')}
        hasDivider
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
          endContent={<Badge variant="neutral" label={pureGemPacksCount} />}
        />
        <Tab
          value="bundles"
          label="Hero & Weapon Bundles"
          icon={<Icon icon={Sword} size="sm" />}
          endContent={<Badge variant="neutral" label={bundlePacksCount} />}
        />
      </TabList>

      {/* Top-Up Packages Grid */}
      {isLoading ? (
        <Grid columns={{ minWidth: 260, max: 4, repeat: 'fit' }} gap={4} width="100%">
          {[0, 1, 2, 3].map((idx) => (
            <Card key={idx} variant="default" padding={5}>
              <VStack gap={4} hAlign="center" width="100%">
                <Skeleton width={72} height={72} />
                <Skeleton width="70%" height={20} />
                <Skeleton width="50%" height={20} />
                <Skeleton width="100%" height={36} />
              </VStack>
            </Card>
          ))}
        </Grid>
      ) : loadError ? (
        <Card variant="default" padding={6}>
          <EmptyState
            icon={<Icon icon={AlertCircle} size="lg" color="error" />}
            title="Unable to Load Treasury Data"
            description={loadError}
            actions={
              <Button
                label="Retry Connection"
                variant="primary"
                icon={<Icon icon={RefreshCw} size="sm" />}
                onClick={() => fetchBackendData(true)}
              />
            }
          />
        </Card>
      ) : filteredPacks.length === 0 ? (
        <Card variant="default" padding={6}>
          <EmptyState
            icon={<Icon icon={Gem} size="lg" color="secondary" />}
            title="No Packages Available"
            description="No top-up packages are currently configured in this category."
          />
        </Card>
      ) : (
        <Grid columns={{ minWidth: 260, max: 4, repeat: 'fit' }} gap={4} width="100%">
          {filteredPacks.map((pack) => {
            const tierToken = getPackTierToken(pack);
            const hasBundle = hasPackInclusions(pack);
            const hasNames = hasVisibleInclusionNames(pack);

            return (
              <Card key={pack.id} variant="default" elevation="low" padding={5}>
                <VStack gap={4} hAlign="center" vAlign="between" height="100%" width="100%">
                  <VStack gap={3} hAlign="center" width="100%">
                    <HStack hAlign="end" width="100%">
                      <Token color={tierToken.color} size="sm" label={tierToken.label} />
                    </HStack>

                    <Center paddingBlock={1}>
                      <GemArt gemsAmount={pack.gemsAmount} size={64} />
                    </Center>

                    <VStack gap={1} hAlign="center" width="100%">
                      <Heading level={3} justify="center">
                        {pack.name}
                      </Heading>
                      <HStack gap={1.5} vAlign="center" hAlign="center">
                        <Icon icon={Gem} size="sm" color="cyan" />
                        <Text
                          type="large"
                          size="xl"
                          weight="bold"
                          color="primary"
                          hasTabularNumbers
                        >
                          {pack.gemsAmount.toLocaleString('en-US')}
                        </Text>
                        <Text type="label" size="xsm" color="accent" weight="semibold">
                          GEMS
                        </Text>
                      </HStack>
                    </VStack>

                    <Center width="100%">
                      {hasBundle ? (
                        hasNames ? (
                          <HStack gap={1} wrap="wrap" hAlign="center">
                            {pack.unitNames?.map((name, i) => (
                              <Token
                                key={`u-${i}`}
                                size="sm"
                                color="orange"
                                icon={<Icon icon={Users} size="xsm" />}
                                label={name}
                              />
                            ))}
                            {pack.weaponNames?.map((name, i) => (
                              <Token
                                key={`w-${i}`}
                                size="sm"
                                color="blue"
                                icon={<Icon icon={Shield} size="xsm" />}
                                label={name}
                              />
                            ))}
                            {pack.trinketNames?.map((name, i) => (
                              <Token
                                key={`t-${i}`}
                                size="sm"
                                color="purple"
                                icon={<Icon icon={Sparkles} size="xsm" />}
                                label={name}
                              />
                            ))}
                          </HStack>
                        ) : (
                          <Token
                            size="sm"
                            color="green"
                            icon={<Icon icon={PackageCheck} size="xsm" />}
                            label="Bonus Equipment Included"
                          />
                        )
                      ) : (
                        <Text
                          type="supporting"
                          size="xsm"
                          color="secondary"
                          justify="center"
                          display="block"
                        >
                          Standard Gem Top-Up Package
                        </Text>
                      )}
                    </Center>
                  </VStack>

                  <Button
                    label={`${pack.priceVnd.toLocaleString('vi-VN')} VND`}
                    variant="primary"
                    size="md"
                    width="100%"
                    tooltip={
                      isLoggedIn
                        ? `Proceed to checkout for ${pack.name}`
                        : `Sign in required to purchase ${pack.name}`
                    }
                    endContent={<Icon icon={isLoggedIn ? ChevronRight : Lock} size="xsm" />}
                    onClick={() => handleSelectPack(pack)}
                  />
                </VStack>
              </Card>
            );
          })}
        </Grid>
      )}
    </VStack>
  );
};
