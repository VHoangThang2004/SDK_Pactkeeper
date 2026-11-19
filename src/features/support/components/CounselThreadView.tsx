import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bot, Paperclip, ShieldCheck, HelpCircle } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
} from '@astryxdesign/core/Chat';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { Token } from '@astryxdesign/core/Token';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../../core/network/apiClient';
import { useSyncStore } from '../../../store/syncStore';
import { useTranslation } from '../../../core/i18n';
import { supportHubService, type SupportMessageDto } from '../services/SupportHubService';
import { resolveSupportAttachmentUrl } from '../supportMedia';

export const CounselThreadView: React.FC = () => {
  const showToast = useToast();
  const { setHasUnreadCounsel } = useSyncStore();
  const { t, isVietnamese } = useTranslation();

  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(supportHubService.isConnected());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card padding={0} elevation="low" className="chatShell">
      <HStack hAlign="between" vAlign="center" gap={3} padding={4}>
        <HStack gap={3} vAlign="center">
          <Avatar name={t('counsel.keeperOfRecords')} size="sm" />
          <VStack gap={0.5}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text weight="semibold">{t('counsel.keeperOfRecords')}</Text>
              <Token
                icon={<ShieldCheck size={12} aria-hidden="true" />}
                label={t('counsel.officialGm')}
                size="sm"
              />
            </HStack>
            <Text type="supporting" size="2xs" color="secondary">
              {isConnected ? t('counsel.liveCounselOnline') : t('counsel.activeCounselService')}
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
            {isConnected ? (isVietnamese ? 'Trực tuyến' : 'Live') : (isVietnamese ? 'Đang đồng bộ' : 'Syncing')}
          </Text>
        </HStack>
      </HStack>

      <Divider />

      <Collapsible
        trigger={
          <HStack gap={2} vAlign="center" padding={3}>
            <HelpCircle size={15} aria-hidden="true" />
            <Text weight="medium" size="sm">
              {t('counsel.faqTitle')}
            </Text>
          </HStack>
        }
        defaultIsOpen={false}
      >
        <Card padding={3} variant="muted">
          <CollapsibleGroup type="single" hasDividers>
            <Collapsible
              value="faq-delivery"
              trigger={<Text size="sm" weight="medium">{t('counsel.faq1Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq1A')}
              </Text>
            </Collapsible>
            <Collapsible
              value="faq-vietqr"
              trigger={<Text size="sm" weight="medium">{t('counsel.faq2Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq2A')}
              </Text>
            </Collapsible>
            <Collapsible
              value="faq-support"
              trigger={<Text size="sm" weight="medium">{t('counsel.faq3Q')}</Text>}
            >
              <Text type="supporting" size="sm" color="secondary">
                {t('counsel.faq3A')}
              </Text>
            </Collapsible>
          </CollapsibleGroup>
        </Card>
      </Collapsible>

      <Divider />

      <input
        type="file"
        accept="image/*"
        className="hiddenInput"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      <VStack className="chatBody">
        <ChatLayout
          density="balanced"
          emptyState={
            <EmptyState
              icon={<Bot size={32} aria-hidden="true" />}
              title={t('counsel.emptyChatTitle')}
              description={t('counsel.emptyChatDesc')}
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
                  ? t('counsel.uploading')
                  : t('counsel.inputPlaceholder')
              }
              footerActions={
                <IconButton
                  icon={<Paperclip size={16} aria-hidden="true" />}
                  variant="ghost"
                  size="sm"
                  label={t('counsel.attachImage')}
                  isDisabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
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
                    name={self ? t('counsel.you') : t('counsel.keeperOfRecords')}
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
                          <button
                            type="button"
                            className="attachmentBtn"
                            onClick={() => setLightboxSrc(resolvedImg)}
                            aria-label="Inspect image attachment"
                          >
                            <img
                              src={resolvedImg}
                              alt="Support attachment"
                              className="attachmentImg"
                            />
                          </button>
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
