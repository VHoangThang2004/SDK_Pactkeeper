import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Gem, 
  ScrollText, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import styles from './LayoutWrapper.module.css';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const { username, playerId, role, logout } = useAuthStore();
  const { unreadCount, hasUnreadCounsel, isRealTimeOnline, startGlobalSync, setHasUnreadCounsel } = useSyncStore();
  const navigate = useNavigate();
  const isAdmin = role === 'Admin' || role === 'Technical Support';

  useEffect(() => {
    const cleanup = startGlobalSync();
    return cleanup;
  }, [startGlobalSync]);

  const displayUid = playerId ? (playerId.length > 8 ? playerId.slice(-8).toUpperCase() : playerId) : '';

  return (
    <div className={styles.wrapper}>
      {/* Top HoYoverse Style Navigation Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          {/* Logo & Brand */}
          <div className={styles.brand} onClick={() => navigate('/profile/topup')}>
            <div className={styles.logoBadge}>
              <Gem size={20} className={styles.logoIcon} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.gameTitle}>PACTKEEPER</span>
              <span className={styles.portalTag}>TOP-UP CENTER</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className={styles.desktopNav}>
            {isAdmin ? (
              <NavLink 
                to="/profile/admin-dashboard" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
              >
                <ScrollText size={16} />
                <span>Keeper's Archives</span>
              </NavLink>
            ) : (
              <>
                <NavLink 
                  to="/profile/topup" 
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                >
                  <Gem size={16} />
                  <span>Treasury</span>
                </NavLink>
                <NavLink 
                  to="/profile/history" 
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                >
                  <ScrollText size={16} />
                  <span>Ledger</span>
                </NavLink>
                <NavLink 
                  to="/profile/missives" 
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                >
                  <Mail size={16} />
                  <span>Missives</span>
                  {unreadCount > 0 && (
                    <span className={styles.navBadge}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
                <NavLink 
                  to="/profile/support" 
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}
                  onClick={() => setHasUnreadCounsel(false)}
                >
                  <MessageSquare size={16} />
                  <span>Counsel</span>
                  {hasUnreadCounsel && <span className={styles.navDot} title="New answer from Keeper of Records" />}
                </NavLink>
              </>
            )}
          </nav>

          {/* User Account Bar on Top Right */}
          <div className={styles.userSection}>
            <div className={styles.userBadge}>
              <div className={styles.avatarWrapper}>
                <img 
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Hero'}`} 
                  alt="avatar" 
                  className={styles.avatar}
                />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userNameRow}>
                  <span className={styles.userName}>{username || 'Player'}</span>
                  <span className={styles.serverPill}>
                    <span
                      className={`${styles.statusDot} ${
                        isRealTimeOnline ? styles.statusOnline : styles.statusOffline
                      }`}
                      title={isRealTimeOnline ? 'Real-time SignalR active' : 'Polling sync active'}
                    />
                    Official Server
                  </span>
                </div>
                {displayUid && <span className={styles.uidText}>ID: {displayUid}</span>}
              </div>
            </div>

            <button 
              onClick={logout} 
              className={styles.logoutBtn} 
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className={styles.mainContent}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>

      {/* HoYoverse Trust Pillars & Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* Trust Guarantees */}
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <div className={styles.trustIconWrapper}>
                <Zap size={22} className={styles.trustIcon} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>Instant In-Game Delivery</h4>
                <p className={styles.trustDesc}>Gems & bundles are credited automatically to your account within seconds.</p>
              </div>
            </div>

            <div className={styles.trustCard}>
              <div className={styles.trustIconWrapper}>
                <ShieldCheck size={22} className={styles.trustIcon} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>100% Certified & Secure</h4>
                <p className={styles.trustDesc}>Encrypted payment channels powered by PayOS & national banking standards.</p>
              </div>
            </div>

            <div className={styles.trustCard}>
              <div className={styles.trustIconWrapper}>
                <Headphones size={22} className={styles.trustIcon} />
              </div>
              <div>
                <h4 className={styles.trustTitle}>24/7 Live Counsel</h4>
                <p className={styles.trustDesc}>Real-time assistance from Game Masters to resolve payment queries.</p>
              </div>
            </div>
          </div>

          <div className={styles.footerDivider} />

          {/* Legal and Payment Brands */}
          <div className={styles.legalRow}>
            <div className={styles.legalInfo}>
              <p className={styles.copyright}>
                © 2026 Pactkeeper Team — FPT University SEP490. All Rights Reserved.
              </p>
              <p className={styles.disclaimer}>
                Pactkeeper Web SDK is the official game top-up platform. Please confirm your UID and Server before purchase.
              </p>
            </div>
            <div className={styles.paymentBadges}>
              <span className={styles.payBadge}>VietQR</span>
              <span className={styles.payBadge}>Napas 247</span>
              <span className={styles.payBadge}>PayOS</span>
              <span className={styles.payBadge}>Visa / Master</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
