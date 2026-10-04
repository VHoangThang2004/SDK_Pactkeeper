import React, { useState } from 'react';
import { Shield, LogOut, Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { useAuthStore } from '../../store/authStore';
import styles from './TopUpScreen.module.css';

import { apiClient } from '../../core/network/apiClient';

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

export const TopUpScreen: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [packs, setPacks] = useState<TopUpPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, packsRes] = await Promise.all([
          apiClient.get<PlayerProfile>('/api/PlayerProfile'),
          apiClient.get<TopUpPack[]>('/api/topuppack')
        ]);
        setProfile(profileRes.data);
        setPacks(packsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !profile) {
    return (
      <ParchmentBackground padding="1rem">
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>
      </ParchmentBackground>
    );
  }

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
