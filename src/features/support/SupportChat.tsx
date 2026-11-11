import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supportHubService, type SupportMessageDto } from './services/SupportHubService';
import { apiClient } from '../../core/network/apiClient';
import { useSyncStore } from '../../store/syncStore';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './SupportChat.module.css';
import { Send, Paperclip, Bot, Sparkles } from 'lucide-react';

type Message = SupportMessageDto;

export const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(supportHubService.isConnected());
  const { setHasUnreadCounsel } = useSyncStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear unread badge when entering chat
  useEffect(() => {
    setHasUnreadCounsel(false);
  }, [setHasUnreadCounsel]);

  const syncChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get<Message[]>('/api/support/chat');
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial history fetch
    syncChatHistory();

    // 2. Ensure SignalR connection is active
    supportHubService.connect();

    // 3. Real-time message subscription
    const unsubMsg = supportHubService.onMessage((_playerId, msg) => {
      if (!isMounted) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // 4. Connection state listener
    const unsubConn = supportHubService.onConnectionChange((connected) => {
      if (isMounted) setIsConnected(connected);
    });

    // 5. Auto-sync on reconnection to recover any dropped packets
    const unsubRecon = supportHubService.onReconnected(() => {
      if (isMounted) syncChatHistory();
    });

    // 6. Active chat polling fallback (Smart Sync every 4s) so user NEVER needs to reload
    const interval = setInterval(() => {
      if (isMounted) syncChatHistory();
    }, 4000);

    // 7. Instant sync when tab regains focus
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const response = await apiClient.post('/api/support/chat', {
        text: textToSend,
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await apiClient.post('/api/support/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.url;

      const response = await apiClient.post('/api/support/chat', {
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
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (isoString: string) => {
    const dt = new Date(isoString);
    let hours = dt.getHours();
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <ParchmentBackground padding="0.5rem 0 2rem">
      <div className={styles.chatWrapper}>
        <div className={styles.chatContainer}>
          
          {/* Bot / GM Header */}
          <div className={styles.botHeader}>
            <div className={styles.botAvatar}>
              <Bot size={22} className={styles.botIcon} />
            </div>
            <div className={styles.botInfo}>
              <div className={styles.botTitleRow}>
                <span className={styles.botTitle}>Keeper of Records</span>
                <span className={styles.officialBadge}>Official GM</span>
              </div>
              <span className={styles.botSub}>
                {isConnected ? 'Live Real-Time Counsel Online' : 'Active Support Counsel Service'}
              </span>
            </div>
          </div>

          {/* Messages List */}
          <div className={styles.messageList}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyBotWrap}>
                  <Bot size={36} className={styles.emptyBotIcon} />
                </div>
                <h4>Counsel Live Support</h4>
                <p>Have an inquiry about your top-up, in-game deliveries, or account? Type your message below to summon the Keeper of Records.</p>
                <span className={styles.emptyHint}>
                  <Sparkles size={13} />
                  Live assistance is monitored by official game masters
                </span>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.sender.toLowerCase() === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageWrapper} ${isSelf ? styles.self : styles.other}`}
                  >
                    <div className={styles.messageContent}>
                      <div className={styles.messageBubble}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.attachmentUrl && (
                          <img
                            src={msg.attachmentUrl}
                            alt="Attachment"
                            className={styles.imageAttachment}
                          />
                        )}
                      </div>
                      <span className={styles.timestamp}>{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputAreaWrapper}>
            {isUploading && (
              <div className={styles.uploadingBar}>
                <div className={styles.progressFill}></div>
              </div>
            )}
            <form className={styles.inputArea} onSubmit={handleSend}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Attach screenshot or receipt image"
              >
                <Paperclip size={18} className={styles.iconInk} />
              </button>

              <div className={styles.inputBox}>
                <input
                  type="text"
                  placeholder={
                    isUploading
                      ? 'Uploading mystical attachment...'
                      : 'Type your message to the Keeper of Records...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isUploading}
                  className={styles.textInput}
                />
              </div>

              <button
                type="submit"
                className={`${styles.sendBtn} ${
                  !inputText.trim() || isUploading ? styles.sendBtnDisabled : ''
                }`}
                disabled={!inputText.trim() || isUploading}
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </ParchmentBackground>
  );
};
