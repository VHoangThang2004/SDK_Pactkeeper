import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
  HelpCircle,
  QrCode,
  Zap,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
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
import { useToast } from '@astryxdesign/core/Toast';
import { Token, type TokenColor } from '@astryxdesign/core/Token';
import { useAuthStore } from '../../store/authStore';
import {
  usePortalDataStore,
  type PlayerProfile,
  type TopUpPack,
} from '../../store/portalDataStore';
import { useSyncStore } from '../../store/syncStore';
import { useTranslation, type TranslationKey } from '../../core/i18n';
import { GemArt } from '../../components/GameIcons/GemArt';

const MAX_VISIBLE_CARD_PILLS = 3;

const isTestPack = (pack: TopUpPack): boolean => /\btest\b/i.test(pack.name);

const hasPackInclusions = (pack: TopUpPack): boolean =>
  Boolean(
    (pack.weaponNames && pack.weaponNames.length > 0) ||
      (pack.trinketNames && pack.trinketNames.length > 0) ||
      (pack.unitNames && pack.unitNames.length > 0) ||
      (pack.weaponDefinitionIds && pack.weaponDefinitionIds.length > 0) ||
      (pack.trinketDefinitionIds && pack.trinketDefinitionIds.length > 0) ||
      (pack.unitDefinitionIds && pack.unitDefinitionIds.length > 0)
  );

interface InclusionPill {
  key: string;
  label: string;
  color: TokenColor;
  icon: typeof Users;
}

const getInclusionPills = (pack: TopUpPack): InclusionPill[] => {
  const pills: InclusionPill[] = [];
  pack.unitNames?.forEach((unit, idx) =>
    pills.push({ key: `u-${idx}`, label: unit, color: 'blue', icon: Users })
  );
  pack.weaponNames?.forEach((weapon, idx) =>
    pills.push({ key: `w-${idx}`, label: weapon, color: 'cyan', icon: Sword })
  );
  pack.trinketNames?.forEach((trinket, idx) =>
    pills.push({ key: `t-${idx}`, label: trinket, color: 'yellow', icon: Shield })
  );
  return pills;
};

const getPackTierToken = (
  pack: TopUpPack,
  bestValuePackId: string | null,
  t: (k: TranslationKey) => string
): { label: string; color: TokenColor } => {
  if (bestValuePackId && pack.id === bestValuePackId) {
    return { label: t('topup.bestValue'), color: 'yellow' };
  }
  if (hasPackInclusions(pack)) {
    return { label: t('topup.bundleIncluded'), color: 'green' };
  }
  if (pack.gemsAmount >= 1000 && !isTestPack(pack)) {
    return { label: t('topup.highTier'), color: 'yellow' };
  }
  return { label: t('topup.officialPack'), color: 'gray' };
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'gems-desc';

export const TopUpScreen: React.FC = () => {
  const { isLoggedIn, username, playerId, openAuthPrompt, setPendingRedirect } = useAuthStore();
  const {
    profile: cachedProfile,
    packs,
    packsLoaded,
    packsErrorType,
    fetchProfile,
    fetchPacks,
  } = usePortalDataStore();
  const { profileUpdateTimestamp } = useSyncStore();
  const { t } = useTranslation();
  const showToast = useToast();
  const navigate = useNavigate();

  const sortLabels = useMemo<Record<SortOption, string>>(
    () => ({
      default: t('topup.sortDefault'),
      'price-asc': t('topup.sortPriceAsc'),
      'price-desc': t('topup.sortPriceDesc'),
      'gems-desc': t('topup.sortGemsDesc'),
    }),
    [t]
  );

  const profile: PlayerProfile = useMemo(
    () =>
      cachedProfile ?? {
        playerId: playerId || '',
        username: username || t('common.player'),
        level: 1,
        experience: 0,
        gems: 0,
        gold: 0,
        rating: 0,
        rankTier: 0,
      },
    [cachedProfile, playerId, username, t]
  );

  const [activeTab, setActiveTab] = useState<'all' | 'gems' | 'bundles'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedPackForDrawer, setSelectedPackForDrawer] = useState<TopUpPack | null>(null);
  const [uidCopied, setUidCopied] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const gameScenes = useMemo(
    () => [
      {
        id: 'awaken',
        num: '01',
        src: '/game-assets/hero-awaken.png',
        title: t('topup.scene1Label'),
        caption: t('topup.scene1Caption'),
      },
      {
        id: 'briefing',
        num: '02',
        src: '/game-assets/hero-briefing.png',
        title: t('topup.scene2Label'),
        caption: t('topup.scene2Caption'),
      },
      {
        id: 'eye',
        num: '03',
        src: '/game-assets/hero-eye.png',
        title: t('topup.scene3Label'),
        caption: t('topup.scene3Caption'),
      },
    ],
    [t]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPacks();
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, fetchPacks, fetchProfile]);

  useEffect(() => {
    if (isLoggedIn && profileUpdateTimestamp > 0) {
      fetchProfile();
    }
  }, [isLoggedIn, profileUpdateTimestamp, fetchProfile]);

  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn) fetchProfile();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, fetchProfile]);

  const loadError = useMemo(() => {
    if (!packsErrorType) return null;
    if (packsErrorType === 'auth') return t('topup.catalogAuthError');
    if (packsErrorType === 'network') return t('topup.catalogNetworkError');
    return t('topup.catalogUnexpectedError');
  }, [packsErrorType, t]);

  const handleCopyUid = () => {
    const idToCopy = profile.playerId || playerId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setUidCopied(true);
    showToast({
      body: t('common.uidCopiedToast', { id: idToCopy }),
      type: 'info',
      uniqueID: 'pactkeeper-topup-copy-uid',
      collisionBehavior: 'overwrite',
    });
    window.setTimeout(() => setUidCopied(false), 1600);
  };

  const handleSelectPack = (pkg: TopUpPack) => {
    if (!isLoggedIn) {
      openAuthPrompt({
        title: t('topup.purchaseAuthTitle', { name: pkg.name }),
        message: t('topup.purchaseAuthDesc', {
          name: pkg.name,
          gems: pkg.gemsAmount.toLocaleString('en-US'),
          price: `${pkg.priceVnd.toLocaleString('vi-VN')} VND`,
        }),
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

  const handleScrollToGuide = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pureGemCount = useMemo(
    () => packs.filter((pack) => !hasPackInclusions(pack)).length,
    [packs]
  );

  const bundleCount = useMemo(
    () => packs.filter((pack) => hasPackInclusions(pack)).length,
    [packs]
  );

  const eligiblePromoPacks = useMemo(
    () => packs.filter((p) => !isTestPack(p) && p.priceVnd > 0),
    [packs]
  );

  const featuredPack = useMemo(() => {
    const pool = eligiblePromoPacks.length > 0 ? eligiblePromoPacks : packs;
    if (pool.length === 0) return null;
    return pool.reduce((max, p) => (p.gemsAmount > max.gemsAmount ? p : max), pool[0]);
  }, [eligiblePromoPacks, packs]);

  const bestValuePackId = useMemo(() => {
    const pureEligible = eligiblePromoPacks.filter((p) => !hasPackInclusions(p));
    if (pureEligible.length < 2) return null;
    const best = pureEligible.reduce((top, p) =>
      p.gemsAmount / p.priceVnd > top.gemsAmount / top.priceVnd ? p : top
    );
    return best.id;
  }, [eligiblePromoPacks]);

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

  const deliverySteps = useMemo(
    () => [
      {
        num: '01',
        icon: UserCheck,
        title: t('topup.guideStep1Title'),
        desc: t('topup.guideStep1Desc'),
      },
      {
        num: '02',
        icon: QrCode,
        title: t('topup.guideStep2Title'),
        desc: t('topup.guideStep2Desc'),
      },
      {
        num: '03',
        icon: Zap,
        title: t('topup.guideStep3Title'),
        desc: t('topup.guideStep3Desc'),
      },
    ],
    [t]
  );

  const xpPercent = Math.min(Math.max(profile.experience, 0), 100);

  if (!packsLoaded && packs.length === 0) {
    return (
      <VStack gap={5} width="100%">
        <Skeleton width="100%" height={220} radius={4} />
        <Skeleton width="100%" height={110} radius={4} />
        <Grid columns={{ minWidth: 250, max: 4, repeat: 'fit' }} gap={4} width="100%">
          {[0, 1, 2, 3].map((idx) => (
            <Skeleton key={idx} width="100%" height={360} radius={4} />
          ))}
        </Grid>
      </VStack>
    );
  }

  return (
    <VStack gap={6} width="100%">
      {/* TIER 1: Cinematic Unity_Pactkeeper Hero Stage + Featured Pack Showcase */}
      {featuredPack && (
        <Section variant="section" padding={6} width="100%" className="heroPromoSurface">
          <VStack className="heroBgLayer">
            {gameScenes.map((scene, idx) => (
              <img
                key={scene.id}
                src={scene.src}
                alt=""
                aria-hidden="true"
                className={
                  idx === activeSceneIndex
                    ? 'heroBgImage heroBgImageActive'
                    : 'heroBgImage'
                }
              />
            ))}
          </VStack>
          <VStack className="heroBgScrim" />

          <VStack gap={5} width="100%" className="heroForeground">
            <Grid gap={5} width="100%" className="heroGrid">
              <VStack gap={4} className="heroCopy">
                <HStack gap={2} wrap="wrap" vAlign="center">
                  <Token
                    color="yellow"
                    size="md"
                    icon={<Icon icon={Sparkles} size="xsm" />}
                    label={t('topup.promoTag')}
                  />
                  <HStack gap={1.5} vAlign="center">
                    <StatusDot variant="success" label="Official server online" isPulsing />
                    <Text type="supporting" size="base" color="secondary">
                      {t('topup.serverStatus')}
                    </Text>
                  </HStack>
                </HStack>

                <Heading level={1} weight="bold">
                  {t('topup.promoHeading')}
                </Heading>

                <Text type="body" size="lg" color="secondary" display="block">
                  {t('topup.promoDesc')}
                </Text>

                <HStack gap={2} wrap="wrap">
                  <Token size="md" color="gray" icon={<Icon icon={QrCode} size="xsm" />} label={t('topup.heroPillFee')} />
                  <Token size="md" color="gray" icon={<Icon icon={Zap} size="xsm" />} label={t('topup.heroPillSpeed')} />
                  <Token size="md" color="gray" icon={<Icon icon={ShieldCheck} size="xsm" />} label={t('topup.heroPillVerified')} />
                </HStack>

                <HStack gap={3} wrap="wrap" className="primaryCtaWrap">
                  <Button
                    label={t('topup.promoCta')}
                    variant="primary"
                    size="lg"
                    endContent={<Icon icon={ChevronRight} size="sm" />}
                    onClick={() => setSelectedPackForDrawer(featuredPack)}
                  />
                  {bundleCount > 0 && (
                    <Button
                      label={t('topup.promoBundlesCta')}
                      variant="secondary"
                      size="lg"
                      icon={<Icon icon={Sword} size="sm" />}
                      onClick={() => setActiveTab('bundles')}
                    />
                  )}
                  <Button
                    label={t('topup.promoHowItWorksCta')}
                    variant="ghost"
                    size="lg"
                    onClick={handleScrollToGuide}
                  />
                </HStack>
              </VStack>

              <Card
                variant="default"
                padding={5}
                elevation="med"
                className="heroShowcaseCard"
              >
                <VStack gap={3} hAlign="center">
                  <Token
                    color="cyan"
                    size="md"
                    icon={<Icon icon={Gem} size="xsm" />}
                    label={t('topup.featuredShowcaseLabel')}
                  />
                  <Center height={120} className="heroShowcaseGem">
                    <GemArt gemsAmount={featuredPack.gemsAmount} size={112} />
                  </Center>
                  <VStack gap={0.5} hAlign="center">
                    <Heading level={3} justify="center">
                      {featuredPack.name}
                    </Heading>
                    <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                      +{featuredPack.gemsAmount.toLocaleString('en-US')} {t('topup.gems')}
                    </Text>
                    <Text type="supporting" size="base" color="secondary" hasTabularNumbers>
                      {featuredPack.priceVnd.toLocaleString('vi-VN')} VND
                    </Text>
                  </VStack>
                  <Button
                    label={t('topup.viewDetails')}
                    variant="secondary"
                    size="md"
                    width="100%"
                    endContent={<Icon icon={ChevronRight} size="sm" />}
                    onClick={() => setSelectedPackForDrawer(featuredPack)}
                  />
                </VStack>
              </Card>
            </Grid>

            {/* Interactive In-Game Scene Selector Strip */}
            <HStack gap={2} wrap="wrap" vAlign="center">
              {gameScenes.map((scene, idx) => {
                const isActive = idx === activeSceneIndex;
                return (
                  <Button
                    key={scene.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    label={`${scene.num} · ${scene.title}`}
                    className="scenePillBtn"
                    onClick={() => setActiveSceneIndex(idx)}
                  />
                );
              })}
            </HStack>
          </VStack>
        </Section>
      )}

      {/* TIER 2: Verified Character Identity & Balance Ribbon */}
      {isLoggedIn ? (
        <Section variant="section" padding={5} width="100%" className="accountRibbon">
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
                    <Heading level={2} weight="bold">
                      {profile.username}
                    </Heading>
                    <Token color="yellow" size="sm" label={`Lv.${profile.level}`} />
                    <HStack gap={1} vAlign="center">
                      <StatusDot variant="success" label="Verified" />
                      <Text type="supporting" size="sm" color="secondary">
                        {t('topup.verifiedServer')}
                      </Text>
                    </HStack>
                  </HStack>

                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text type="code" size="sm" color="secondary" weight="semibold">
                      {t('common.playerIdLabel')}: {profile.playerId || playerId || 'N/A'}
                    </Text>
                    {(profile.playerId || playerId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Icon icon={uidCopied ? Check : Copy} size="xsm" color={uidCopied ? 'success' : 'secondary'} />}
                        label={uidCopied ? t('topup.copiedUidShort') : t('topup.copyUidAction')}
                        onClick={handleCopyUid}
                      />
                    )}
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
                <Card variant="muted" padding={4} className="interactiveCard">
                  <VStack gap={1}>
                    <Text type="supporting" size="base" color="secondary" weight="bold">
                      {t('topup.currentGems')}
                    </Text>
                    <HStack gap={2} vAlign="center">
                      <Icon icon={Gem} size="lg" color="accent" />
                      <Text type="large" size="3xl" weight="bold" hasTabularNumbers>
                        {profile.gems.toLocaleString('en-US')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>

                <Card variant="muted" padding={4} className="interactiveCard">
                  <VStack gap={1}>
                    <Text type="supporting" size="base" color="secondary" weight="bold">
                      {t('topup.vaultGold')}
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
                {t('topup.heroEventNotice')}
              </Text>
            </HStack>
          </VStack>
        </Section>
      ) : (
        <Section variant="section" padding={5} width="100%" className="accountRibbon">
          <HStack hAlign="between" vAlign="center" gap={4} wrap="wrap" width="100%">
            <HStack gap={3} vAlign="center" wrap="wrap" className="identityCol">
              <Avatar size="xl" name={t('common.guest')} />
              <VStack gap={1.5}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Heading level={2} weight="bold">
                    {t('topup.guestExplorer')}
                  </Heading>
                  <Token
                    color="yellow"
                    size="md"
                    icon={<Icon icon={Lock} size="xsm" />}
                    label={t('topup.guestAccess')}
                  />
                </HStack>
                <Text type="body" size="base" color="secondary" display="block">
                  {t('topup.guestExplorerDesc')}
                </Text>
              </VStack>
            </HStack>

            <Button
              label={t('topup.signInToTopUp')}
              variant="primary"
              size="lg"
              icon={<Icon icon={LogIn} size="sm" />}
              onClick={handleGuestSignIn}
            />
          </HStack>
        </Section>
      )}

      {/* TIER 3: Modular Storefront Catalog with Animated Tab Panel Transitions */}
      <VStack gap={4} width="100%">
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3} width="100%">
          <TabList
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'all' | 'gems' | 'bundles')}
          >
            <Tab
              value="all"
              label={t('topup.allPackages')}
              icon={<Icon icon={Layers} size="sm" />}
              endContent={<Badge variant="neutral" label={packs.length} />}
            />
            <Tab
              value="gems"
              label={t('topup.pureGems')}
              icon={<Icon icon={Gem} size="sm" />}
              endContent={<Badge variant="neutral" label={pureGemCount} />}
            />
            <Tab
              value="bundles"
              label={t('topup.heroBundles')}
              icon={<Icon icon={Sword} size="sm" />}
              endContent={<Badge variant="neutral" label={bundleCount} />}
            />
          </TabList>

          <DropdownMenu
            button={{
              variant: 'secondary',
              size: 'sm',
              label: t('topup.sortPrefix', { label: sortLabels[sortBy] }),
              icon: <Icon icon={ArrowDownUp} size="sm" />,
            }}
            items={[
              {
                id: 'default',
                label: t('topup.sortDefault'),
                onClick: () => setSortBy('default'),
              },
              {
                id: 'price-asc',
                label: t('topup.sortPriceAsc'),
                onClick: () => setSortBy('price-asc'),
              },
              {
                id: 'price-desc',
                label: t('topup.sortPriceDesc'),
                onClick: () => setSortBy('price-desc'),
              },
              {
                id: 'gems-desc',
                label: t('topup.sortGemsDesc'),
                onClick: () => setSortBy('gems-desc'),
              },
            ]}
          />
        </HStack>

        {loadError && packs.length === 0 ? (
          <Card variant="default" padding={6} width="100%">
            <EmptyState
              icon={<Icon icon={AlertCircle} size="lg" color="accent" />}
              title={t('topup.catalogUnavailableTitle')}
              description={loadError}
              actions={
                <HStack gap={2} hAlign="center" wrap="wrap">
                  <Button
                    label={t('topup.retry')}
                    variant="secondary"
                    icon={<Icon icon={RefreshCw} size="sm" />}
                    onClick={() => fetchPacks()}
                  />
                  {!isLoggedIn && (
                    <Button
                      label={t('common.signIn')}
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
              title={t('topup.emptyCategoryTitle')}
              description={t('topup.emptyCategoryDesc')}
            />
          </Card>
        ) : (
          <VStack key={`${activeTab}-${sortBy}`} width="100%" className="tabPanelMotion">
            <Grid
              columns={{ minWidth: 250, max: 4, repeat: 'fit' }}
              gap={4}
              width="100%"
              className="catalogGrid"
            >
              {sortedPacks.map((pkg) => {
                const isBundle = hasPackInclusions(pkg);
                const allPills = getInclusionPills(pkg);
                const visiblePills = allPills.slice(0, MAX_VISIBLE_CARD_PILLS);
                const hiddenCount = Math.max(0, allPills.length - MAX_VISIBLE_CARD_PILLS);
                const tierToken = getPackTierToken(pkg, bestValuePackId, t);
                const isBestValue = Boolean(bestValuePackId && pkg.id === bestValuePackId);

                return (
                  <Card
                    key={pkg.id}
                    variant="default"
                    padding={5}
                    height="100%"
                    className={isBestValue ? 'packCard packCardFeatured' : 'packCard'}
                  >
                    <VStack gap={4} hAlign="center" height="100%" width="100%">
                      <HStack hAlign="end" width="100%">
                        <Token size="md" color={tierToken.color} label={tierToken.label} />
                      </HStack>

                      <Center height={116} width="100%" className="packGemArt">
                        <GemArt gemsAmount={pkg.gemsAmount} size={104} />
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
                            {t('topup.gems')}
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
                        {visiblePills.length > 0 ? (
                          <HStack gap={1.5} hAlign="center" wrap="wrap" width="100%">
                            {visiblePills.map((pill) => (
                              <Token
                                key={pill.key}
                                label={pill.label}
                                size="sm"
                                color={pill.color}
                                icon={<Icon icon={pill.icon} size="xsm" />}
                              />
                            ))}
                            {hiddenCount > 0 && (
                              <Token
                                label={t('topup.moreItems', { count: hiddenCount })}
                                size="sm"
                                color="gray"
                              />
                            )}
                          </HStack>
                        ) : (
                          <Text
                            type="supporting"
                            size="base"
                            color="secondary"
                            justify="center"
                            display="block"
                          >
                            {isBundle ? t('topup.standardBundleDesc') : t('topup.standardGemDesc')}
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
                              ? t('topup.reviewTooltip')
                              : t('topup.signInRequiredTooltip')
                          }
                          onClick={() => setSelectedPackForDrawer(pkg)}
                        />
                      </VStack>
                    </VStack>
                  </Card>
                );
              })}
            </Grid>
          </VStack>
        )}
      </VStack>

      {/* TIER 4A: Inside the World of Pactkeeper (Unity_Pactkeeper Key Art Showcase) */}
      <Section variant="section" padding={5} width="100%">
        <VStack gap={4} width="100%">
          <VStack gap={1}>
            <Heading level={2} weight="bold">
              {t('topup.worldSectionTitle')}
            </Heading>
            <Text type="supporting" size="base" color="secondary" display="block">
              {t('topup.worldSectionDesc')}
            </Text>
          </VStack>

          <Grid columns={{ minWidth: 260, max: 3, repeat: 'fit' }} gap={4} width="100%">
            {gameScenes.map((scene, idx) => (
              <Card key={`world-${scene.id}`} variant="default" padding={0} className="worldSceneCard">
                <VStack gap={0} width="100%">
                  <VStack className="worldSceneThumbWrap">
                    <img
                      src={scene.src}
                      alt={scene.title}
                      className="worldSceneThumb"
                      loading="lazy"
                    />
                  </VStack>
                  <VStack gap={1} padding={4}>
                    <HStack hAlign="between" vAlign="center" width="100%">
                      <Heading level={4}>{scene.title}</Heading>
                      <Token
                        size="sm"
                        color={idx === activeSceneIndex ? 'yellow' : 'gray'}
                        label={scene.num}
                      />
                    </HStack>
                    <Text type="supporting" size="base" color="secondary" display="block">
                      {scene.caption}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* TIER 4B: 3-Step Instant Delivery Guide */}
      <Section id="how-it-works" variant="section" padding={5} width="100%">
        <VStack gap={4} width="100%">
          <VStack gap={1}>
            <Heading level={2} weight="bold">
              {t('topup.guideSectionTitle')}
            </Heading>
            <Text type="supporting" size="base" color="secondary" display="block">
              {t('topup.guideSectionDesc')}
            </Text>
          </VStack>

          <Grid columns={{ minWidth: 240, max: 3, repeat: 'fit' }} gap={4} width="100%">
            {deliverySteps.map((step) => (
              <Card key={step.num} variant="muted" padding={4} className="interactiveCard">
                <VStack gap={3}>
                  <HStack hAlign="between" vAlign="center" width="100%">
                    <Center className="stepNumberBadge">
                      <Text type="code" size="sm" weight="bold">
                        {step.num}
                      </Text>
                    </Center>
                    <Icon icon={step.icon} size="md" color="accent" />
                  </HStack>
                  <VStack gap={1}>
                    <Heading level={4}>{step.title}</Heading>
                    <Text type="supporting" size="base" color="secondary" display="block">
                      {step.desc}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Section>

      {/* TIER 5: Quick Top-Up FAQ */}
      <Card variant="default" padding={5} width="100%">
        <VStack gap={3} width="100%">
          <HStack gap={2} vAlign="center">
            <Icon icon={HelpCircle} size="md" color="accent" />
            <Heading level={3}>{t('topup.quickFaqTitle')}</Heading>
          </HStack>
          <Divider />
          <CollapsibleGroup type="single" hasDividers>
            <Collapsible
              value="topup-faq-1"
              trigger={<Text size="base" weight="medium">{t('counsel.faq1Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq1A')}
              </Text>
            </Collapsible>
            <Collapsible
              value="topup-faq-2"
              trigger={<Text size="base" weight="medium">{t('counsel.faq2Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq2A')}
              </Text>
            </Collapsible>
            <Collapsible
              value="topup-faq-3"
              trigger={<Text size="base" weight="medium">{t('counsel.faq3Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq3A')}
              </Text>
            </Collapsible>
          </CollapsibleGroup>
        </VStack>
      </Card>

      {/* Quick Pack Order Drawer */}
      <Drawer
        isOpen={Boolean(selectedPackForDrawer)}
        onOpenChange={(open) => {
          if (!open) setSelectedPackForDrawer(null);
        }}
        label={
          selectedPackForDrawer
            ? t('topup.orderDrawerTitle', { name: selectedPackForDrawer.name })
            : t('topup.orderSummaryFallback')
        }
        side="end"
        width={420}
      >
        {selectedPackForDrawer && (
          <VStack gap={5} width="100%" padding={4}>
            <HStack hAlign="between" vAlign="center" width="100%">
              <VStack gap={0.5}>
                <Text type="supporting" size="sm" color="secondary" weight="semibold">
                  {t('topup.orderPreviewLabel')}
                </Text>
                <Heading level={2}>{selectedPackForDrawer.name}</Heading>
              </VStack>
              <Token
                color={getPackTierToken(selectedPackForDrawer, bestValuePackId, t).color}
                label={getPackTierToken(selectedPackForDrawer, bestValuePackId, t).label}
              />
            </HStack>

            <Divider />

            <Card variant="muted" padding={4} width="100%">
              <HStack gap={4} vAlign="center">
                <Center width={80} height={80}>
                  <GemArt gemsAmount={selectedPackForDrawer.gemsAmount} size={72} />
                </Center>
                <VStack gap={1}>
                  <HStack gap={1.5} vAlign="center">
                    <Icon icon={Gem} size="sm" color="accent" />
                    <Text type="large" weight="bold" hasTabularNumbers>
                      +{selectedPackForDrawer.gemsAmount.toLocaleString('en-US')} {t('topup.gems')}
                    </Text>
                  </HStack>
                  <Text type="supporting" size="sm" color="secondary">
                    {t('topup.directCreditDesc')}
                  </Text>
                </VStack>
              </HStack>
            </Card>

            {hasPackInclusions(selectedPackForDrawer) && (
              <VStack gap={2} width="100%">
                <Text type="supporting" size="sm" color="secondary">
                  {t('topup.includedPactItems')}
                </Text>
                <HStack gap={1.5} wrap="wrap">
                  {getInclusionPills(selectedPackForDrawer).map((pill) => (
                    <Token
                      key={`drawer-${pill.key}`}
                      label={pill.label}
                      size="sm"
                      color={pill.color}
                      icon={<Icon icon={pill.icon} size="xsm" />}
                    />
                  ))}
                </HStack>
              </VStack>
            )}

            <Card variant="default" padding={3} width="100%">
              <VStack gap={2} width="100%">
                <Text type="supporting" size="sm" color="secondary" weight="semibold">
                  {t('topup.deliveryRecipientLabel')}
                </Text>
                {isLoggedIn ? (
                  <HStack hAlign="between" vAlign="center" width="100%">
                    <HStack gap={2} vAlign="center">
                      <Avatar size="sm" name={profile.username} />
                      <VStack gap={0.5}>
                        <Text weight="semibold" size="base">
                          {profile.username}
                        </Text>
                        <Text type="code" size="sm" color="secondary">
                          {t('common.uid')}: {profile.playerId || playerId}
                        </Text>
                      </VStack>
                    </HStack>
                    <StatusDot variant="success" label="Verified Destination" />
                  </HStack>
                ) : (
                  <Banner
                    status="warning"
                    title={t('topup.guestExplorer')}
                    description={t('topup.guestDrawerDesc')}
                  />
                )}
              </VStack>
            </Card>

            <VStack gap={3} width="100%">
              <HStack hAlign="between" vAlign="center" width="100%">
                <Text color="secondary" size="base">
                  {t('topup.totalPriceLabel')}
                </Text>
                <Heading level={2}>
                  {selectedPackForDrawer.priceVnd.toLocaleString('vi-VN')} VND
                </Heading>
              </HStack>

              <HStack gap={2} vAlign="start">
                <Icon icon={ShieldCheck} size="sm" color="accent" />
                <Text type="supporting" size="sm" color="secondary">
                  {t('topup.gatewayGuaranteeShort')}
                </Text>
              </HStack>
            </VStack>

            <Divider />

            <VStack gap={2} width="100%" className="primaryCtaWrap">
              <Button
                label={
                  isLoggedIn
                    ? t('topup.proceedPayosCta', {
                        price: `${selectedPackForDrawer.priceVnd.toLocaleString('vi-VN')} VND`,
                      })
                    : t('topup.signInToTopUp')
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
                label={t('topup.closeKeepBrowsing')}
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
