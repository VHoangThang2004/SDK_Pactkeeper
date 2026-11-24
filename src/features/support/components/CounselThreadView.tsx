import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Paperclip, ShieldCheck, HelpCircle, Receipt, Clock } from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
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
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { Token } from '@astryxdesign/core/Token';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '../../../core/network/apiClient';
import { usePortalDataStore } from '../../../store/portalDataStore';
import { useSyncStore } from '../../../store/syncStore';
import { useTranslation } from '../../../core/i18n';
import { supportHubService, type SupportMessageDto } from '../services/SupportHubService';
import { resolveSupportAttachmentUrl } from '../supportMedia';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const CounselThreadView: React.FC = () => {
  const location = useLocation();
  const showToast = useToast();
  const { setHasUnreadCounsel } = useSyncStore();
  const { history, historyLoaded, fetchHistory } = usePortalDataStore();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(supportHubService.isConnected());
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilledRef = useRef<string | null>(null);

  useEffect(() => {
    setHasUnreadCounsel(false);
  }, [setHasUnreadCounsel]);

  useEffect(() => {
    if (!historyLoaded) {
      fetchHistory();
    }
  }, [historyLoaded, fetchHistory]);

  // Support pre-filling Order ID when navigating from Order History -> Report Issue
  useEffect(() => {
    const prefillOrderCode = (location.state as { prefillOrderCode?: string } | null)
      ?.prefillOrderCode;
    if (prefillOrderCode && prefilledRef.current !== prefillOrderCode) {
      prefilledRef.current = prefillOrderCode;
      setInputText((prev) => {
        const tag = `[TXN-${prefillOrderCode}] `;
        return prev.includes(prefillOrderCode) ? prev : `${tag}${prev}`;
      });
    }
  }, [location.state]);

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

  const handleInsertOrderRef = useCallback(
    (orderCode: string) => {
      setInputText((prev) => {
        const tag = `[TXN-${orderCode}]`;
        if (prev.includes(tag)) return prev;
        return prev.trim().length > 0 ? `${prev.trim()} ${tag} ` : `${tag} `;
      });
      showToast({
        body: t('counsel.orderRefInserted', { orderCode }),
        type: 'info',
      });
    },
    [showToast, t]
  );

  const recentOrderMenuItems = useMemo(() => {
    const recent = history.slice(0, 6);
    if (recent.length === 0) {
      return [
        {
          id: 'no-orders',
          label: t('counsel.noRecentOrders'),
          isDisabled: true,
        },
      ];
    }
    return recent.map((txn) => ({
      id: `order-${txn.orderCode}`,
      label: `TXN-${txn.orderCode}`,
      description: `${txn.amount.toLocaleString('vi-VN')} VND · ${txn.status}`,
      icon: <Icon icon={Receipt} size="xsm" />,
      onClick: () => handleInsertOrderRef(txn.orderCode),
    }));
  }, [history, handleInsertOrderRef, t]);

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
        body: t('counsel.sendFailedToast'),
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      showToast({
        body: t('counsel.imageTooLarge'),
        type: 'error',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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
        body: t('counsel.uploadFailedToast'),
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Grid gap={5} className="supportGrid">
      <Card padding={0} elevation="low" className="chatShell">
        <HStack hAlign="between" vAlign="center" gap={3} padding={4}>
          <HStack gap={3} vAlign="center">
            <Avatar name={t('counsel.keeperOfRecords')} size="sm" />
            <VStack gap={0.5}>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text weight="semibold">{t('counsel.keeperOfRecords')}</Text>
                <Token
                  icon={<Icon icon={ShieldCheck} size="xsm" />}
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
              label={isConnected ? t('counsel.onlineNotice') : t('counsel.disconnectedNotice')}
              isPulsing={isConnected}
            />
            <Text type="supporting" size="2xs" color="secondary">
              {isConnected ? t('counsel.statusLive') : t('counsel.statusSyncing')}
            </Text>
          </HStack>
        </HStack>

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
                icon={<Icon icon={Bot} size="lg" color="accent" />}
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
                    : isSending
                      ? t('counsel.sending')
                      : t('counsel.inputPlaceholder')
                }
                footerActions={
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Icon icon={Paperclip} size="xsm" />}
                      label={t('counsel.attachImage')}
                      isLoading={isUploading}
                      isDisabled={isUploading || isSending}
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <DropdownMenu
                      button={{
                        variant: 'secondary',
                        size: 'sm',
                        label: t('counsel.attachOrder'),
                        icon: <Icon icon={Receipt} size="xsm" />,
                      }}
                      items={recentOrderMenuItems}
                    />
                  </HStack>
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
                        <HStack gap={1.5} vAlign="center">
                          <Timestamp
                            value={msg.createdAt}
                            format="time"
                            size="2xs"
                            color="secondary"
                          />
                          {self && (
                            <Text type="supporting" size="2xs" color="secondary">
                              · {t('counsel.sentLabel')}
                            </Text>
                          )}
                        </HStack>
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
                              aria-label={t('counsel.attachImage')}
                            >
                              <img
                                src={resolvedImg}
                                alt={t('counsel.attachImage')}
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
              ? { src: lightboxSrc, alt: t('counsel.attachImage'), type: 'image' }
              : []
          }
          hasZoom
        />
      </Card>

      {/* Right sidebar: SLA & Quick Payment FAQ */}
      <VStack gap={4} className="supportSidebar">
        <Banner
          status="info"
          icon={<Icon icon={Clock} size="sm" />}
          title={t('counsel.slaBannerTitle')}
          description={t('counsel.slaBannerDesc')}
        />

        <Card padding={4} elevation="low">
          <VStack gap={3}>
            <HStack gap={2} vAlign="center">
              <Icon icon={HelpCircle} size="sm" color="accent" />
              <Heading level={4}>{t('counsel.faqTitle')}</Heading>
            </HStack>

            <Divider />

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
          </VStack>
        </Card>
      </VStack>
    </Grid>
  );
};
