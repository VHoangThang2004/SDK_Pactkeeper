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
  Trophy,
  PackageCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
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

export const TopUpScreen: React.FC = () => {
  const { username, playerId } = useAuthStore();
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
  const [activeTab, setActiveTab] = useState<'all' | 'gems' | 'bundles'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileResult, packsResult, bannerResult] = await Promise.allSettled([
          apiClient.get<PlayerProfile>('/api/PlayerProfile'),
          apiClient.get<TopUpPack[]>('/api/topuppack'),
          apiClient.get<GachaBanner[]>('/api/gachabanner/active')
        ]);

        // 1. Profile Data from Backend
        if (profileResult.status === 'fulfilled' && profileResult.value?.data) {
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
          const fetchedPacks = packsResult.value.data.filter(p => p.isAvailable !== false);
          setPacks(fetchedPacks);
        }

        // 3. Real Active Gacha / Event Banner from Backend
        if (bannerResult.status === 'fulfilled' && bannerResult.value?.data && bannerResult.value.data.length > 0) {
          setActiveBanner(bannerResult.value.data[0]);
        }
      } catch (err) {
        console.error('Error fetching backend data in TopUpScreen:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, playerId]);

  // Real-time synchronization when payment is completed or profile update event received
  const { profileUpdateTimestamp } = useSyncStore();

  const syncProfileOnly = useCallback(async () => {
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
      // ignore
    }
  }, []);

  useEffect(() => {
    syncProfileOnly();
  }, [profileUpdateTimestamp, syncProfileOnly]);

  useEffect(() => {
    const handleFocus = () => syncProfileOnly();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncProfileOnly]);

  // Filter packs based on real backend inclusions
  const filteredPacks = packs.filter((pack) => {
    const hasInclusions = (pack.weaponNames && pack.weaponNames.length > 0) ||
                          (pack.trinketNames && pack.trinketNames.length > 0) ||
                          (pack.unitNames && pack.unitNames.length > 0) ||
                          (pack.weaponDefinitionIds && pack.weaponDefinitionIds.length > 0) ||
                          (pack.trinketDefinitionIds && pack.trinketDefinitionIds.length > 0) ||
                          (pack.unitDefinitionIds && pack.unitDefinitionIds.length > 0);

    if (activeTab === 'bundles') return hasInclusions;
    if (activeTab === 'gems') return !hasInclusions;
    return true; // 'all'
  });

  const xpProgress = Math.min(Math.max(profile.experience / 100, 0), 1);
  const featuredPack = packs.length > 0 ? packs.reduce((max, p) => p.gemsAmount > max.gemsAmount ? p : max, packs[0]) : null;

  if (isLoading) {
    return (
      <ParchmentBackground padding="2rem 1rem">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <Gem size={36} className={styles.loadingGem} />
          </div>
          <p className={styles.loadingText}>Fetching real data from Backend API (http://localhost:5276)...</p>
        </div>
      </ParchmentBackground>
    );
  }

  return (
    <ParchmentBackground padding="0.5rem 0 2rem">
      <div className={styles.container}>
        
        {/* 1. Hero Event Banner (Driven by Real Backend Data) */}
        {(activeBanner || featuredPack) && (
          <div className={styles.bannerContainer}>
            <div className={styles.bannerCard}>
              <div className={styles.bannerOverlay} />
              <div className={styles.bannerContent}>
                <div className={styles.bannerBadge}>
                  <Sparkles size={14} className={styles.sparkleIcon} />
                  <span>{activeBanner ? 'ACTIVE EVENT BANNER' : 'FEATURED REPLENISHMENT'}</span>
                </div>
                <h2 className={styles.bannerTitle}>
                  {activeBanner ? activeBanner.name : featuredPack?.name}
                </h2>
                <p className={styles.bannerDesc}>
                  {activeBanner 
                    ? activeBanner.description 
                    : `Direct in-game replenishment offering ${featuredPack?.gemsAmount.toLocaleString('en-US')} Gems for ${featuredPack?.priceVnd.toLocaleString('vi-VN')} VND.`}
                </p>
                
                <div className={styles.bannerFooter}>
                  {featuredPack && (
                    <span className={styles.bannerHighlight}>
                      <Gem size={15} />
                      Top Tier: {featuredPack.name} ({featuredPack.gemsAmount} Gems)
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.bannerArt}>
                <GemArt gemsAmount={featuredPack?.gemsAmount || 1000} size={140} />
              </div>
            </div>
          </div>
        )}

        {/* 2. Character Verification & Server Anchor Bar (Real Profile Data) */}
        <div className={styles.verificationBar}>
          <div className={styles.verifyLeft}>
            <div className={styles.verifyAvatarWrap}>
              <img 
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`} 
                alt="character avatar" 
                className={styles.verifyAvatar}
              />
              <span className={styles.lvlBadge}>Lv.{profile.level}</span>
            </div>

            <div className={styles.charInfo}>
              <div className={styles.charHeader}>
                <span className={styles.charName}>{profile.username}</span>
                <span className={styles.serverTag}>Server: Pactkeeper Official</span>
                <span className={styles.verifiedTag}>
                  <ShieldCheck size={14} />
                  <span>Target Verified</span>
                </span>
              </div>
              <div className={styles.charSub}>
                <span className={styles.uidDisplay}>
                  Player ID: {profile.playerId || playerId || 'N/A'}
                </span>
                <span className={styles.dividerDot}>•</span>
                <span className={styles.xpProgressText}>XP: {profile.experience}/100</span>
                <div className={styles.miniXpBar}>
                  <div className={styles.miniXpFill} style={{ width: `${xpProgress * 100}%` }} />
                </div>
                {profile.rating !== undefined && profile.rating > 0 && (
                  <>
                    <span className={styles.dividerDot}>•</span>
                    <span className={styles.ratingBadge}>
                      <Trophy size={12} />
                      Rating: {profile.rating}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.verifyRight}>
            <div className={styles.balanceItem}>
              <span className={styles.balanceLabel}>CURRENT GEMS</span>
              <div className={styles.balanceValue}>
                <Gem size={18} className={styles.gemGlow} />
                <span>{profile.gems.toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className={styles.balanceDivider} />

            <div className={styles.balanceItem}>
              <span className={styles.balanceLabel}>VAULT GOLD</span>
              <div className={styles.balanceValue}>
                <Coins size={18} className={styles.goldGlow} />
                <span>{profile.gold.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Order Security Note */}
        <div className={styles.securityNote}>
          <AlertCircle size={15} className={styles.alertIcon} />
          <span>Confirm your Player ID: <strong>{profile.playerId || playerId}</strong>. Purchases are directly credited via in-game inventory and mail upon PayOS verification.</span>
        </div>

        {/* 3. Category Filter Tabs (Driven by Backend Package Structure) */}
        <div className={styles.tabsRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={15} />
            <span>All Packages ({packs.length})</span>
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'gems' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('gems')}
          >
            <Gem size={15} />
            <span>Pure Gem Packs</span>
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'bundles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('bundles')}
          >
            <Sword size={15} />
            <span>Hero & Weapon Bundles</span>
          </button>
        </div>

        {/* 4. Product Catalog Grid (Real Backend Packs) */}
        {filteredPacks.length === 0 ? (
          <div className={styles.emptyPacksState}>
            <PackageCheck size={40} className={styles.emptyIcon} />
            <h4>No Packages Found in this Category</h4>
            <p>Please check other categories or contact an Administrator.</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filteredPacks.map((pkg) => {
              const hasWeapons = pkg.weaponNames && pkg.weaponNames.length > 0;
              const hasTrinkets = pkg.trinketNames && pkg.trinketNames.length > 0;
              const hasUnits = pkg.unitNames && pkg.unitNames.length > 0;
              const hasInclusions = hasWeapons || hasTrinkets || hasUnits;

              let badgeText = 'OFFICIAL PACK';
              let badgeType = 'default';
              if (hasInclusions) {
                badgeText = 'BUNDLE INCLUDED';
                badgeType = 'hero';
              } else if (pkg.gemsAmount >= 1000) {
                badgeText = 'HIGH TIER';
                badgeType = 'best';
              }

              return (
                <div 
                  key={pkg.id} 
                  className={styles.cardContainer}
                  onClick={() => navigate('/checkout', { state: { pack: pkg } })}
                >
                  <div className={styles.productCard}>
                    {/* Top Badge */}
                    <div className={`${styles.cardBadge} ${styles[`badge_${badgeType}`]}`}>
                      <span>{badgeText}</span>
                    </div>

                    {/* Artwork Showcase */}
                    <div className={styles.artWrapper}>
                      <div className={styles.artBackdrop} />
                      <GemArt gemsAmount={pkg.gemsAmount} size={88} className={styles.gemArtItem} />
                    </div>

                    {/* Product Info */}
                    <div className={styles.cardDetails}>
                      <h3 className={styles.packTitle}>{pkg.name}</h3>

                      <div className={styles.gemAmountRow}>
                        <Gem size={17} className={styles.crystalIcon} />
                        <span className={styles.gemNumber}>
                          {pkg.gemsAmount.toLocaleString('en-US')}
                        </span>
                        <span className={styles.gemUnit}>Gems</span>
                      </div>

                      {/* Real Inclusions from Backend */}
                      <div className={styles.inclusionsArea}>
                        {hasInclusions ? (
                          <div className={styles.inclusionsRow}>
                            {pkg.unitNames?.map((unit, i) => (
                              <span key={`u-${i}`} className={styles.inclusionChip}>
                                ⚔️ {unit}
                              </span>
                            ))}
                            {pkg.weaponNames?.map((wpn, i) => (
                              <span key={`w-${i}`} className={styles.inclusionChip}>
                                🛡️ {wpn}
                              </span>
                            ))}
                            {pkg.trinketNames?.map((trk, i) => (
                              <span key={`t-${i}`} className={styles.inclusionChip}>
                                💍 {trk}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.pureGemsNote}>
                            Standard Gem Top-Up Package
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buy / Price Button */}
                    <div className={styles.cardFooter}>
                      <button className={styles.priceButton}>
                        <span>{pkg.priceVnd.toLocaleString('vi-VN')} VND</span>
                        <ChevronRight size={16} className={styles.priceArrow} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </ParchmentBackground>
  );
};
