import React, { useState, useEffect } from 'react';
import { Shield, LogOut, Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { useAuthStore } from '../../store/authStore';
import styles from './TopUpScreen.module.css';

// Mock data types
interface PlayerProfile {
  username: string;
  level: number;
  experience: number;
  gems: number;
}

interface TopUpPack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
}

const mockProfile: PlayerProfile = {
  username: 'Wanderer',
  level: 12,
  experience: 45,
  gems: 1250,
};

const mockPacks: TopUpPack[] = [
  { id: '1', name: 'Handful of Gems', gemsAmount: 100, priceVnd: 22000 },
  { id: '2', name: 'Pouch of Gems', gemsAmount: 300, priceVnd: 66000 },
  { id: '3', name: 'Chest of Gems', gemsAmount: 600, priceVnd: 129000 }, // best value
  { id: '4', name: 'Hoard of Gems', gemsAmount: 1500, priceVnd: 299000 },
  { id: '5', name: 'Dragon\'s Treasure', gemsAmount: 3500, priceVnd: 699000 },
  { id: '6', name: 'Kingdom\'s Wealth', gemsAmount: 8000, priceVnd: 1499000 },
];

export const TopUpScreen: React.FC = () => {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile>({ ...mockProfile, username: username || 'Wanderer' });
  const [packs, setPacks] = useState<TopUpPack[]>(mockPacks);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, fetch these from an API
  // useEffect(() => { ... fetch profile & packs ... }, []);

  const xpProgress = Math.min(Math.max(profile.experience / 100, 0), 1);

  return (
    <ParchmentBackground padding="1rem">
      <div className={styles.container}>
        {/* Player Card */}
        <div className={styles.playerCard}>
          <div className={styles.watermark}>
            <Shield size={120} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.topRow}>
              <div className={styles.infoCol}>
                <span className={styles.heroLabel}>HERO</span>
                <h2 className={styles.username}>{profile.username}</h2>
                <div className={styles.levelRow}>
                  <div className={styles.levelBadge}>LEVEL {profile.level}</div>
                  <span className={styles.xpText}>XP: {profile.experience} / 100</span>
                </div>
                <div className={styles.xpBarContainer}>
                  <div className={styles.xpBarFill} style={{ width: `${xpProgress * 100}%` }} />
                </div>
              </div>
              <div className={styles.avatarCol}>
                <div className={styles.avatarWrapper}>
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`} 
                    alt="avatar" 
                    className={styles.avatar}
                  />
                </div>
                <button onClick={logout} className={styles.logoutBtn}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            
            <div className={styles.wealthContainer}>
              <span className={styles.wealthLabel}>CURRENT GEMS</span>
              <div className={styles.wealthValue}>
                <Gem size={24} className={styles.gemIcon} />
                <span>{profile.gems.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className={styles.sectionTitle}>
          <div className={styles.dividerLeft} />
          <div className={styles.titleContent}>
            <Gem size={20} className={styles.titleIcon} />
            <h3>Acquire Gems</h3>
            <Gem size={20} className={styles.titleIcon} />
          </div>
          <div className={styles.dividerRight} />
        </div>

        {/* Packages Grid */}
        <div className={styles.grid}>
          {packs.map((pkg) => {
            const isPopular = pkg.gemsAmount >= 550 && pkg.gemsAmount < 6500;
            return (
              <div key={pkg.id} className={styles.packWrapper}>
                <div 
                  className={styles.packCard}
                  onClick={() => navigate('/checkout', { state: { pack: pkg } })}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.packInner}>
                    <div className={styles.packIconWrapper}>
                      <Gem size={32} className={styles.packGem} />
                    </div>
                    <div className={styles.packAmount}>
                      <Gem size={16} className={styles.packGemSmall} />
                      <span>{pkg.gemsAmount}</span>
                    </div>
                    <div className={styles.packName}>
                      {pkg.name}
                    </div>
                    <button className={styles.priceBtn}>
                      {pkg.priceVnd.toLocaleString('vi-VN')} VND
                    </button>
                  </div>
                </div>
                {isPopular && (
                  <div className={styles.bestValueBadge}>
                    Best Value
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ParchmentBackground>
  );
};
