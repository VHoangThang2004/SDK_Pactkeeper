import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Paperclip,
  ShieldCheck,
  HelpCircle,
  Receipt,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
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

  useEffect(() => {
    document.getElementById('counsel-chat-end')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

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

  const recentOrders = useMemo(() => history.slice(0, 4), [history]);

  const recentOrderMenuItems = useMemo(() => {
    if (recentOrders.length === 0) {
      return [
        {
          id: 'no-orders',
          label: t('counsel.noRecentOrders'),
          isDisabled: true,
        },
      ];
    }
    return recentOrders.map((txn) => ({
      id: `order-${txn.orderCode}`,
      label: `TXN-${txn.orderCode}`,
      description: `${txn.amount.toLocaleString('vi-VN')} VND · ${txn.status}`,
      icon: <Icon icon={Receipt} size="xsm" />,
      onClick: () => handleInsertOrderRef(txn.orderCode),
    }));
  }, [recentOrders, handleInsertOrderRef, t]);

  const quickTopics = useMemo(
    () => [t('counsel.quickTopic1'), t('counsel.quickTopic2'), t('counsel.quickTopic3')],
    [t]
  );

  const handleSend = async (rawValue?: string) => {
    const trimmed = (rawValue ?? inputText).trim();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      {/* Main Chat Container: Fixed Header + Scrollable Stream + Always-Visible Composer */}
      <Card padding={0} elevation="low" className="chatShell">
        {/* Pinned Header */}
        <HStack hAlign="between" vAlign="center" gap={3} padding={4}>
          <HStack gap={3} vAlign="center">
            <Avatar name={t('counsel.keeperOfRecords')} src="/logo.png" size="md" />
            <VStack gap={0.5}>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text weight="bold" size="base">
                  {t('counsel.keeperOfRecords')}
                </Text>
                <Token
                  icon={<Icon icon={ShieldCheck} size="xsm" />}
                  label={t('counsel.officialGm')}
                  size="sm"
                  color="yellow"
                />
              </HStack>
              <Text type="supporting" size="sm" color="secondary">
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
            <Text type="supporting" size="sm" weight="medium" color="secondary">
              {isConnected ? t('counsel.statusLive') : t('counsel.statusSyncing')}
            </Text>
          </HStack>
        </HStack>

        <Divider />

        {/* Scrollable Message Thread */}
        <VStack className="chatMessagesScroll">
          {/* Official Welcome Message Bubble */}
          <VStack gap={1.5} hAlign="start" width="100%">
            <Text type="supporting" size="sm" weight="semibold" color="secondary">
              {t('counsel.keeperOfRecords')}
            </Text>
            <VStack gap={2} className="chatBubbleStaff">
              <Text type="body" size="base" color="primary" display="block">
                {t('counsel.welcomeAutoMsg')}
              </Text>
            </VStack>
          </VStack>

          {/* Quick Topic Chips for effortless 1-click inquiries */}
          <VStack gap={2} hAlign="start" width="100%">
            <HStack gap={1.5} vAlign="center">
              <Icon icon={Sparkles} size="xsm" color="accent" />
              <Text type="supporting" size="sm" weight="semibold" color="secondary">
                {t('counsel.quickTopicsLabel')}
              </Text>
            </HStack>
            <HStack gap={2} wrap="wrap">
              {quickTopics.map((topic, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  label={topic}
                  onClick={() => setInputText(topic)}
                />
              ))}
            </HStack>
          </VStack>

          {/* Actual Conversation Messages */}
          {messages.map((msg) => {
            const self = msg.sender.toLowerCase() === 'user';
            const resolvedImg = resolveSupportAttachmentUrl(msg.attachmentUrl);

            return (
              <VStack
                key={msg.id}
                gap={1}
                hAlign={self ? 'end' : 'start'}
                width="100%"
              >
                <HStack gap={1.5} vAlign="center">
                  <Text type="supporting" size="sm" weight="semibold" color="secondary">
                    {self ? t('counsel.you') : t('counsel.keeperOfRecords')}
                  </Text>
                  <Timestamp value={msg.createdAt} format="time" size="sm" color="secondary" />
                  {self && (
                    <Text type="supporting" size="sm" color="secondary">
                      · {t('counsel.sentLabel')}
                    </Text>
                  )}
                </HStack>

                <VStack gap={2} className={self ? 'chatBubbleSelf' : 'chatBubbleStaff'}>
                  {msg.text && (
                    <Text type="body" size="base" color="inherit" display="block">
                      {msg.text}
                    </Text>
                  )}
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
              </VStack>
            );
          })}

          <VStack id="counsel-chat-end" />
        </VStack>

        {/* Pinned Composer (Never Clipped) */}
        <VStack gap={2} className="chatComposerBox">
          <input
            type="file"
            accept="image/*"
            className="hiddenInput"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <textarea
            className="chatTextarea"
            rows={2}
            value={inputText}
            disabled={isUploading || isSending}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isUploading
                ? t('counsel.uploading')
                : isSending
                  ? t('counsel.sending')
                  : t('counsel.inputPlaceholder')
            }
          />

          <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2} width="100%">
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

            <HStack gap={3} vAlign="center">
              <Text type="supporting" size="sm" color="secondary" className="desktopOnly">
                {t('counsel.enterToSendHint')}
              </Text>
              <Button
                variant="primary"
                size="md"
                icon={<Icon icon={Send} size="xsm" />}
                label={isSending ? t('counsel.sending') : t('counsel.send')}
                isLoading={isSending}
                isDisabled={isUploading || isSending || !inputText.trim()}
                onClick={() => handleSend()}
              />
            </HStack>
          </HStack>
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

      {/* Right Sidebar: SLA + 1-Click Recent Orders + Quick FAQ */}
      <VStack gap={4} className="supportSidebar">
        <Banner
          status="info"
          icon={<Icon icon={Clock} size="sm" />}
          title={t('counsel.slaBannerTitle')}
          description={t('counsel.slaBannerDesc')}
        />

        {recentOrders.length > 0 && (
          <Card padding={4} elevation="low">
            <VStack gap={3}>
              <HStack gap={2} vAlign="center">
                <Icon icon={Receipt} size="sm" color="accent" />
                <Heading level={4}>{t('counsel.recentOrdersSidebarTitle')}</Heading>
              </HStack>
              <Divider />
              <VStack gap={2} width="100%">
                {recentOrders.slice(0, 3).map((txn) => (
                  <Button
                    key={txn.orderCode}
                    variant="secondary"
                    size="sm"
                    width="100%"
                    icon={<Icon icon={Receipt} size="xsm" />}
                    label={`TXN-${txn.orderCode} · ${txn.amount.toLocaleString('vi-VN')} VND`}
                    onClick={() => handleInsertOrderRef(txn.orderCode)}
                  />
                ))}
              </VStack>
            </VStack>
          </Card>
        )}

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
                trigger={<Text size="base" weight="medium">{t('counsel.faq1Q')}</Text>}
              >
                <Text type="supporting" size="sm" color="secondary">
                  {t('counsel.faq1A')}
                </Text>
              </Collapsible>
              <Collapsible
                value="faq-vietqr"
                trigger={<Text size="base" weight="medium">{t('counsel.faq2Q')}</Text>}
              >
                <Text type="supporting" size="sm" color="secondary">
                  {t('counsel.faq2A')}
                </Text>
              </Collapsible>
              <Collapsible
                value="faq-support"
                trigger={<Text size="base" weight="medium">{t('counsel.faq3Q')}</Text>}
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
