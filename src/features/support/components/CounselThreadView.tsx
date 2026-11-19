import React, { useEffect, useState, useCallback } from 'react';
import { Bot, Paperclip, ShieldCheck } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
} from '@astryxdesign/core/Chat';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { Token } from '@astryxdesign/core/Token';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../../core/network/apiClient';
import { useSyncStore } from '../../../store/syncStore';
import { supportHubService, type SupportMessageDto } from '../services/SupportHubService';
import { resolveSupportAttachmentUrl } from '../supportMedia';

export const CounselThreadView: React.FC = () => {
  const showToast = useToast();
  const { setHasUnreadCounsel } = useSyncStore();

  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(supportHubService.isConnected());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    setHasUnreadCounsel(false);
  }, [setHasUnreadCounsel]);

  const syncChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get<SupportMessageDto[]>('/api/support/chat');
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
      console.warn('Failed to sync counsel history:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    syncChatHistory();
    supportHubService.connect();

    const unsubMsg = supportHubService.onMessage((_playerId, msg) => {
      if (!isMounted) return;
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
  }, [syncChatHistory]);

  const handleSend = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      const response = await apiClient.post<SupportMessageDto>('/api/support/chat', {
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
      setInputText(trimmed);
      showToast({
        body: 'Could not deliver your message. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const uploadImageFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await apiClient.post<{ url: string }>(
        '/api/support/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const imageUrl = uploadResponse.data.url;

      const response = await apiClient.post<SupportMessageDto>('/api/support/chat', {
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
      showToast({
        body: 'Could not upload the image attachment. Please try a smaller image.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerFilePicker = () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.onchange = () => {
      const file = picker.files?.[0];
      if (file) {
        void uploadImageFile(file);
      }
    };
    picker.click();
  };

  return (
    <Card padding={0} elevation="low">
      <HStack hAlign="between" vAlign="center" gap={3} padding={4} width="100%">
        <HStack gap={3} vAlign="center">
          <Avatar name="Keeper of Records" size="sm" />
          <VStack gap={0.5}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text weight="semibold">Keeper of Records</Text>
              <Token
                icon={<Icon icon={ShieldCheck} size="xsm" />}
                label="Official GM"
                size="sm"
              />
            </HStack>
            <Text type="supporting" size="2xs" color="secondary">
              {isConnected ? 'Live Real-Time Counsel Online' : 'Active Support Counsel Service'}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={1.5} vAlign="center">
          <StatusDot
            variant={isConnected ? 'success' : 'warning'}
            label={isConnected ? 'Real-time connection active' : 'Syncing messages'}
            isPulsing={isConnected}
          />
          <Text type="supporting" size="2xs" color="secondary">
            {isConnected ? 'Live' : 'Syncing'}
          </Text>
        </HStack>
      </HStack>

      <Divider />

      <VStack height="65dvh" minHeight={480} isScrollable width="100%">
        <ChatLayout
          density="balanced"
          emptyState={
            <EmptyState
              icon={<Icon icon={Bot} size="lg" color="accent" />}
              title="Counsel Live Support"
              description="Have an inquiry about your top-up, in-game deliveries, or account? Send a message below to summon the Keeper of Records."
            />
          }
          composer={
            <ChatComposer
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSend}
              isDisabled={isUploading || isSending}
              placeholder={
                isUploading
                  ? 'Uploading attachment...'
                  : 'Type your message to the Keeper of Records...'
              }
              footerActions={
                <IconButton
                  icon={<Icon icon={Paperclip} size="sm" />}
                  variant="ghost"
                  size="sm"
                  label="Attach screenshot or receipt image"
                  isDisabled={isUploading}
                  onClick={handleTriggerFilePicker}
                />
              }
            />
          }
        >
          {messages.length > 0 && (
            <ChatMessageList>
              {messages.map((msg) => {
                const self = msg.sender.toLowerCase() === 'user';
                const resolvedImg = resolveSupportAttachmentUrl(msg.attachmentUrl);

                return (
                  <ChatMessage
                    key={msg.id}
                    sender={self ? 'user' : 'assistant'}
                    name={self ? 'You' : 'Keeper of Records'}
                    metadata={
                      <Timestamp
                        value={msg.createdAt}
                        format="time"
                        size="2xs"
                        color="secondary"
                      />
                    }
                  >
                    <ChatMessageBubble>
                      <VStack gap={2}>
                        {msg.text && <Text color="inherit">{msg.text}</Text>}
                        {resolvedImg && (
                          <Thumbnail
                            src={resolvedImg}
                            alt="Support attachment"
                            label="Inspect image attachment"
                            onClick={() => setLightboxSrc(resolvedImg)}
                          />
                        )}
                      </VStack>
                    </ChatMessageBubble>
                  </ChatMessage>
                );
              })}
            </ChatMessageList>
          )}
        </ChatLayout>
      </VStack>

      <Lightbox
        isOpen={Boolean(lightboxSrc)}
        onOpenChange={(open) => {
          if (!open) setLightboxSrc(null);
        }}
        media={
          lightboxSrc
            ? { src: lightboxSrc, alt: 'Support attachment', type: 'image' }
            : []
        }
        hasZoom
      />
    </Card>
  );
};
