import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Inbox, Maximize2, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Layout, LayoutContent, LayoutPanel, HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService } from '../support/services/SupportHubService';
import { CounselThreadView } from '../support/components/CounselThreadView';
import styles from './AdminDashboardScreen.module.css';

interface ActiveChatPlayer {
  playerId: string;
  playerName: string;
  latestMessageText: string;
  latestMessageTime: string;
}

export const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activePlayers, setActivePlayers] = useState<ActiveChatPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const response = await apiClient.get<ActiveChatPlayer[]>('/api/support/admin/players');
      if (response.data) {
        setActivePlayers(response.data);
      }
    } catch (err) {
      console.error('Error fetching active players:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPlayers();
    supportHubService.connect();

    const unsubMsg = supportHubService.onMessage(() => {
      if (isMounted) fetchPlayers();
    });

    const unsubRecon = supportHubService.onReconnected(() => {
      if (isMounted) fetchPlayers();
    });

    const interval = setInterval(() => {
      if (isMounted) fetchPlayers();
    }, 6000);

    const handleFocus = () => {
      if (isMounted) fetchPlayers();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      unsubMsg();
      unsubRecon();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchPlayers]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activePlayers;
    return activePlayers.filter(
      (player) =>
        player.playerName.toLowerCase().includes(q) ||
        player.playerId.toLowerCase().includes(q) ||
        player.latestMessageText.toLowerCase().includes(q)
    );
  }, [activePlayers, searchQuery]);

  const effectiveSelectedId = useMemo(() => {
    if (selectedPlayerId && activePlayers.some((p) => p.playerId === selectedPlayerId)) {
      return selectedPlayerId;
    }
    return filteredPlayers[0]?.playerId ?? activePlayers[0]?.playerId ?? null;
  }, [selectedPlayerId, activePlayers, filteredPlayers]);

  const selectedPlayer = useMemo(
    () => activePlayers.find((p) => p.playerId === effectiveSelectedId) ?? null,
    [activePlayers, effectiveSelectedId]
  );

  const searchControls = (
    <VStack gap={3} width="100%">
      <HStack hAlign="between" vAlign="center" width="100%">
        <Heading level={3}>Active Scrolls</Heading>
        <Badge variant="info" label={filteredPlayers.length} />
      </HStack>
      <TextInput
        label="Filter support threads"
        isLabelHidden
        placeholder="Search player or message..."
        value={searchQuery}
        onChange={setSearchQuery}
        startIcon={<Search size={15} />}
        hasClear
        width="100%"
      />
      <Divider />
    </VStack>
  );

  const renderPlayerList = (isMobileList: boolean) => {
    if (isLoading) {
      return (
        <VStack gap={2} width="100%">
          {[0, 1, 2].map((idx) => (
            <Skeleton key={idx} width="100%" height={60} radius={2} index={idx} />
          ))}
        </VStack>
      );
    }

    if (filteredPlayers.length === 0) {
      return (
        <EmptyState
          isCompact
          icon={<Inbox size={28} />}
          title={searchQuery.trim() ? 'No matching scrolls' : 'No active scrolls'}
          description={
            searchQuery.trim()
              ? 'Try another player name, UID, or keyword.'
              : 'All support scrolls have been archived.'
          }
        />
      );
    }

    return (
      <List edge={isMobileList ? 'bleed' : 'outset'} hasDividers density="balanced">
        {filteredPlayers.map((player) => (
          <ListItem
            key={player.playerId}
            isSelected={!isMobileList && effectiveSelectedId === player.playerId}
            onClick={() => {
              if (isMobileList) {
                navigate(`/profile/admin-chat/${player.playerId}`);
              } else {
                setSelectedPlayerId(player.playerId);
              }
            }}
            startContent={<Avatar size={36} name={player.playerName} />}
            label={
              <HStack hAlign="between" vAlign="center" gap={2}>
                <Text weight="semibold" maxLines={1}>
                  {player.playerName}
                </Text>
                <Timestamp value={player.latestMessageTime} format="relative_short" isLive />
              </HStack>
            }
            description={player.latestMessageText || 'Image attachment'}
            endContent={
              isMobileList ? <ChevronRight size={16} aria-hidden="true" /> : undefined
            }
          />
        ))}
      </List>
    );
  };

  return (
    <VStack gap={4} width="100%">
      {/* Desktop 2-Pane Split Inbox + Thread */}
      <div className={styles.desktopWorkspace}>
        <Card variant="default" elevation="med" padding={0} className={styles.workspaceCard}>
          <Layout
            height="fill"
            defaultHasDividers={false}
            start={
              <LayoutPanel hasDivider width={320} padding={3} role="navigation" label="Player threads">
                <VStack gap={3} width="100%">
                  {searchControls}
                  {renderPlayerList(false)}
                </VStack>
              </LayoutPanel>
            }
            content={
              <LayoutContent padding={0} isScrollable={false}>
                {selectedPlayer ? (
                  <CounselThreadView
                    mode="staff"
                    targetPlayerId={selectedPlayer.playerId}
                    headerTitle={selectedPlayer.playerName}
                    headerBadge={`ID: ${selectedPlayer.playerId.slice(-8).toUpperCase()}`}
                    headerSubtitle={`Full Player ID: ${selectedPlayer.playerId}`}
                    headerEnd={
                      <Button
                        label="Open standalone view"
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        icon={<Maximize2 size={15} />}
                        tooltip="Open fullscreen thread"
                        onClick={() =>
                          navigate(`/profile/admin-chat/${selectedPlayer.playerId}`)
                        }
                      />
                    }
                    embedded
                  />
                ) : (
                  <div className={styles.emptyPane}>
                    <EmptyState
                      icon={<Inbox size={36} />}
                      title="Select a Support Thread"
                      description="Choose an active player thread from Active Scrolls on the left to view history and reply in real time."
                    />
                  </div>
                )}
              </LayoutContent>
            }
          />
        </Card>
      </div>

      {/* Mobile Inbox Stack */}
      <div className={styles.mobileInbox}>
        <Card variant="default" padding={4} width="100%">
          <VStack gap={3} width="100%">
            {searchControls}
            {renderPlayerList(true)}
          </VStack>
        </Card>
      </div>
    </VStack>
  );
};
