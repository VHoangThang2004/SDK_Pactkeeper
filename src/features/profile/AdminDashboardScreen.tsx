import React, { useState, useEffect } from 'react';
import { LogOut, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import styles from './AdminDashboardScreen.module.css';

interface ActiveChatPlayer {
  playerId: string;
  playerName: string;
  latestMessageText: string;
  latestMessageTime: string;
}

export const AdminDashboardScreen: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [activePlayers, setActivePlayers] = useState<ActiveChatPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await apiClient.get<ActiveChatPlayer[]>('/api/support/admin/players');
        setActivePlayers(response.data);
      } catch (err) {
        console.error('Error fetching active players:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayers();
    
    // Optional: Refresh periodically or use SignalR to listen for new active players.
    // For now, simple polling every 30s.
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    const dt = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dt.getMonth()];
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    return `${dt.getDate()} ${month}, ${hours}:${minutes}`;
  };

  return (
    <ParchmentBackground padding="1rem">
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Active Scrolls</h2>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className={styles.listContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>Loading scrolls...</div>
        ) : activePlayers.length === 0 ? (
          <div className={styles.emptyState}>All scrolls are archived. No active support requests.</div>
        ) : (
          activePlayers.map((player) => (
            <div key={player.playerId} className={styles.playerCard} onClick={() => navigate(`/profile/admin-chat/${player.playerId}`)}>
              <div className={styles.avatarWrapper}>
                <User size={22} className={styles.avatarIcon} />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.topRow}>
                  <span className={styles.playerName}>{player.playerName}</span>
                  <span className={styles.timeText}>{formatTime(player.latestMessageTime)}</span>
                </div>
                <div className={styles.bottomRow}>
                  <span className={styles.messageText}>{player.latestMessageText}</span>
                </div>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </div>
          ))
        )}
      </div>
    </ParchmentBackground>
  );
};
