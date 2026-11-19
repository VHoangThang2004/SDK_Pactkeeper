import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Bot, Paperclip, Sparkles, User } from 'lucide-react';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSendButton,
} from '@astryxdesign/core/Chat';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Layout, LayoutContent, LayoutHeader, HStack, VStack } from '@astryxdesign/core/Layout';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../../core/network/apiClient';
import { useSyncStore } from '../../../store/syncStore';
import { supportHubService, type SupportMessageDto } from '../services/SupportHubService';
import { resolveSupportAttachmentUrl } from '../supportMedia';
import styles from './CounselThreadView.module.css';

interface CounselThreadViewProps {
  mode: 'player' | 'staff';
  targetPlayerId?: string;
  headerTitle: string;
  headerSubtitle?: string;
  headerBadge?: string;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  embedded?: boolean;
}

interface MessageRun {
  key: string;
  senderRole: 'user' | 'assistant';
  items: SupportMessageDto[];
}

export const CounselThreadView: React.FC<CounselThreadViewProps> = ({
  mode,
  targetPlayerId,
  headerTitle,
  headerSubtitle,
  headerBadge,
  headerStart,
  headerEnd,
  embedded = false,
}) => {
  const toast = useToast();
  const { setHasUnreadCounsel } = useSyncStore();

  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(supportHubService.isConnected());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatEndpoint =
    mode === 'staff' && targetPlayerId
      ? `/api/support/admin/chat/${targetPlayerId}`
      : '/api/support/chat';

  useEffect(() => {
    if (mode === 'player') {
      setHasUnreadCounsel(false);
    }
  }, [mode, setHasUnreadCounsel]);

  const syncChatHistory = useCallback(async () => {
    if (mode === 'staff' && !targetPlayerId) return;
    try {
      const response = await apiClient.get<SupportMessageDto[]>(chatEndpoint);
      if (response.data && Array.isArray(response.data)) {
        setMessages((prev) => {
          if (
            prev.length === response.data.length &&
            prev[prev.length - 1]?.id === response.data[response.data.length - 1]?.id
          ) {
            return prev;
          }
          return response.data;
        });
      }
    } catch (error) {
      console.warn('Failed to sync chat history:', error);
    }
  }, [chatEndpoint, mode, targetPlayerId]);

  useEffect(() => {
    if (mode === 'staff' && !targetPlayerId) return;
    let isMounted = true;
    setMessages([]);

    syncChatHistory();
    supportHubService.connect();

    const unsubMsg = supportHubService.onMessage((receivedPlayerId, msg) => {
      if (!isMounted) return;
      if (mode === 'staff' && receivedPlayerId !== targetPlayerId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    const unsubConn = supportHubService.onConnectionChange((connected) => {
      if (isMounted) setIsConnected(connected);
    });

    const unsubRecon = supportHubService.onReconnected(() => {
      if (isMounted) syncChatHistory();
    });

    const interval = setInterval(() => {
      if (isMounted) syncChatHistory();
    }, 4000);

    const handleFocus = () => {
      if (isMounted) syncChatHistory();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      unsubMsg();
      unsubConn();
      unsubRecon();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [mode, targetPlayerId, syncChatHistory]);

  const handleSend = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    if (mode === 'staff' && !targetPlayerId) return;

    setInputText('');
    try {
      const response = await apiClient.post<SupportMessageDto>(chatEndpoint, {
        text: trimmed,
        attachmentUrl: '',
      });
      const sentMsg = response.data;
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        body: 'Message could not be sent. Please try again.',
        type: 'error',
        uniqueID: 'counsel-send-error',
        collisionBehavior: 'overwrite',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === 'staff' && !targetPlayerId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await apiClient.post<{ url: string }>('/api/support/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.url;

      const response = await apiClient.post<SupportMessageDto>(chatEndpoint, {
        text: '',
        attachmentUrl: imageUrl,
      });
      const sentMsg = response.data;
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        body: 'Failed to upload image attachment.',
        type: 'error',
        uniqueID: 'counsel-upload-error',
        collisionBehavior: 'overwrite',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const messageRuns = useMemo<MessageRun[]>(() => {
    const runs: MessageRun[] = [];
    for (const msg of messages) {
      const fromPlayer = msg.sender.toLowerCase() === 'user';
      const senderRole: 'user' | 'assistant' =
        mode === 'player' ? (fromPlayer ? 'user' : 'assistant') : !fromPlayer ? 'user' : 'assistant';

      const prevRun = runs[runs.length - 1];
      if (prevRun && prevRun.senderRole === senderRole) {
        prevRun.items.push(msg);
      } else {
        runs.push({
          key: msg.id,
          senderRole,
          items: [msg],
        });
      }
    }
    return runs;
  }, [messages, mode]);

  const counterpartLabel = mode === 'player' ? 'Keeper of Records' : headerTitle;
  const resolvedSubtitle =
    headerSubtitle ||
    (isConnected ? 'Real-time SignalR counsel connected' : 'Active 4s live polling sync');

  const chatCore = (
    <Layout
      height="fill"
      defaultHasDividers={false}
      header={
        <LayoutHeader hasDivider padding={4}>
          <HStack hAlign="between" vAlign="center" gap={3} width="100%">
            <HStack gap={3} vAlign="center">
              {headerStart}
              <Avatar
                size={36}
                name={counterpartLabel}
                status={
                  <AvatarStatusDot
                    variant={isConnected ? 'success' : 'neutral'}
                    label={isConnected ? 'Online' : 'Polling'}
                  />
                }
              />
              <VStack gap={0.5}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Heading level={3}>{headerTitle}</Heading>
                  {headerBadge && <Badge variant="yellow" label={headerBadge} />}
                </HStack>
                <Text type="supporting" size="xsm" color="secondary">
                  {resolvedSubtitle}
                </Text>
              </VStack>
            </HStack>

            {headerEnd}
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0} isScrollable={false}>
          <ChatLayout
            density="balanced"
            emptyState={
              <EmptyState
                icon={mode === 'player' ? <Bot size={36} /> : <User size={36} />}
                title={mode === 'player' ? 'Counsel Live Support' : 'Empty Support Thread'}
                description={
                  mode === 'player'
                    ? 'Have a question about your top-up, in-game delivery, or PayOS receipt? Send a message below to reach the Keeper of Records.'
                    : 'No messages exchanged in this player thread yet.'
                }
                actions={
                  mode === 'player' ? (
                    <Badge
                      variant="cyan"
                      icon={<Sparkles size={13} />}
                      label="Monitored by official Game Masters"
                    />
                  ) : undefined
                }
              />
            }
            composer={
              <>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFileInput}
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <ChatComposer
                  value={inputText}
                  onChange={setInputText}
                  onSubmit={(val) => void handleSend(val)}
                  isDisabled={isUploading}
                  placeholder={
                    isUploading
                      ? 'Uploading image attachment...'
                      : mode === 'staff'
                        ? 'Inscribe your reply...'
                        : 'Type your message to the Keeper of Records...'
                  }
                  headerContext={
                    isUploading ? (
                      <Text type="supporting" size="xsm" color="accent">
                        Uploading image attachment...
                      </Text>
                    ) : undefined
                  }
                  footerActions={
                    <Button
                      label="Attach image"
                      variant="ghost"
                      size="md"
                      isIconOnly
                      icon={<Paperclip size={17} />}
                      tooltip="Attach screenshot or PayOS receipt"
                      isDisabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    />
                  }
                  sendButton={<ChatSendButton />}
                />
              </>
            }
          >
            {messageRuns.length > 0 && (
              <ChatMessageList>
                {messageRuns.map((run) => {
                  const isOther = run.senderRole === 'assistant';
                  return (
                    <ChatMessage
                      key={run.key}
                      sender={run.senderRole}
                      avatar={
                        isOther ? (
                          <Avatar size={32} name={counterpartLabel} />
                        ) : undefined
                      }
                    >
                      {run.items.map((msg, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === run.items.length - 1;
                        const groupPos =
                          run.items.length === 1
                            ? undefined
                            : isFirst
                              ? 'first'
                              : isLast
                                ? 'last'
                                : 'middle';
                        const safeImgUrl = resolveSupportAttachmentUrl(msg.attachmentUrl);

                        return (
                          <React.Fragment key={msg.id}>
                            {msg.text && (
                              <ChatMessageBubble
                                group={groupPos}
                                name={isOther && isFirst ? counterpartLabel : undefined}
                                metadata={
                                  isLast && !safeImgUrl ? (
                                    <ChatMessageMetadata
                                      timestamp={<Timestamp value={msg.createdAt} format="time" />}
                                    />
                                  ) : undefined
                                }
                              >
                                {msg.text}
                              </ChatMessageBubble>
                            )}
                            {safeImgUrl && (
                              <ChatMessageBubble
                                variant="ghost"
                                name={!msg.text && isOther && isFirst ? counterpartLabel : undefined}
                                metadata={
                                  isLast ? (
                                    <ChatMessageMetadata
                                      timestamp={<Timestamp value={msg.createdAt} format="time" />}
                                    />
                                  ) : undefined
                                }
                              >
                                <button
                                  type="button"
                                  className={styles.imageButton}
                                  onClick={() => setLightboxSrc(safeImgUrl)}
                                  aria-label="Inspect attached screenshot fullscreen"
                                >
                                  <img
                                    src={safeImgUrl}
                                    alt="Support chat attachment"
                                    className={styles.imageAttachment}
                                  />
                                </button>
                              </ChatMessageBubble>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </ChatMessage>
                  );
                })}
              </ChatMessageList>
            )}
          </ChatLayout>
        </LayoutContent>
      }
    />
  );

  return (
    <>
      {embedded ? (
        <div className={styles.embeddedFrame}>{chatCore}</div>
      ) : (
        <Card variant="default" elevation="med" padding={0} className={styles.standaloneCard}>
          {chatCore}
        </Card>
      )}

      <Lightbox
        isOpen={Boolean(lightboxSrc)}
        onOpenChange={(open) => {
          if (!open) setLightboxSrc(null);
        }}
        media={
          lightboxSrc
            ? { src: lightboxSrc, alt: 'Support chat screenshot attachment', type: 'image' }
            : { src: '', alt: '' }
        }
        hasZoom
      />
    </>
  );
};
