import React, { useState } from 'react';
import { LogOut, User, ChevronRight } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { useAuthStore } from '../../store/authStore';
import styles from './AdminDashboardScreen.module.css';

interface ActiveChatPlayer {
  playerId: string;
  playerName: string;
  latestMessageText: string;
  latestMessageTime: string;
}

const mockActivePlayers: ActiveChatPlayer[] = [
  { playerId: 'p1', playerName: 'Wanderer', latestMessageText: 'I lost my gems', latestMessageTime: new Date().toISOString() },
  { playerId: 'p2', playerName: 'Knight_23', latestMessageText: 'Thanks for the help', latestMessageTime: new Date(Date.now() - 3600000).toISOString() },
];

export const AdminDashboardScreen: React.FC = () => {
  const { logout } = useAuthStore();
  const [activePlayers] = useState<ActiveChatPlayer[]>(mockActivePlayers);

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
        {activePlayers.length === 0 ? (
          <div className={styles.emptyState}>All scrolls are archived. No active support requests.</div>
        ) : (
          activePlayers.map((player) => (
            <div key={player.playerId} className={styles.playerCard} onClick={() => alert(`Navigate to chat for ${player.playerName} (Todo: Routing for AdminChatScreen)`)}>
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
