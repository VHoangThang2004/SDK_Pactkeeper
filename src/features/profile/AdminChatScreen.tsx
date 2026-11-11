import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Paperclip, Send } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService, type SupportMessageDto } from '../support/services/SupportHubService';
import styles from './AdminChatScreen.module.css';
import chatStyles from '../support/SupportChat.module.css'; // Reuse chat styles

type Message = SupportMessageDto;

export const AdminChatScreen: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncChatHistory = useCallback(async () => {
    if (!playerId) return;
    try {
      const response = await apiClient.get<Message[]>(`/api/support/admin/chat/${playerId}`);
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
      console.warn('Failed to sync admin chat history:', error);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    let isMounted = true;

    // 1. Initial fetch
    syncChatHistory();

    // 2. Connect hub
    supportHubService.connect();

    // 3. Real-time message listener
    const unsubMsg = supportHubService.onMessage((receivedPlayerId, msg) => {
      if (!isMounted) return;
      if (receivedPlayerId === playerId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    // 4. Reconnect sync
    const unsubRecon = supportHubService.onReconnected(() => {
      if (isMounted) syncChatHistory();
    });

    // 5. Smart sync polling fallback (every 4s)
    const interval = setInterval(() => {
      if (isMounted) syncChatHistory();
    }, 4000);

    // 6. Window focus listener
    const handleFocus = () => {
      if (isMounted) syncChatHistory();
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
  }, [playerId, syncChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !playerId) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const response = await apiClient.post(`/api/support/admin/chat/${playerId}`, {
        text: textToSend,
        attachmentUrl: ''
      });
      const sentMsg = response.data;
      setMessages((prev) => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playerId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await apiClient.post('/api/support/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadRes.data.url;
      
      const response = await apiClient.post(`/api/support/admin/chat/${playerId}`, {
        text: '',
        attachmentUrl: imageUrl
      });
      const sentMsg = response.data;
      setMessages((prev) => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (error) {
      console.error('Image upload failed', error);
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
    <ParchmentBackground padding="0">
      <div className={chatStyles.chatWrapper}>
        <div className={chatStyles.chatContainer}>
          {/* Admin Header override */}
        <div className={styles.adminHeader}>
          <button onClick={() => navigate('/profile/admin-dashboard')} className={styles.backBtn}>
            <ArrowLeft size={24} />
          </button>
          <div className={styles.avatarWrapper}>
            <User size={18} className={styles.avatarIcon} />
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerTitle}>Counsel: {playerId}</span>
            <span className={styles.headerSub}>Replying as Keeper of Records</span>
          </div>
        </div>

        {/* Messages List */}
        <div className={chatStyles.messageList}>
          {messages.length === 0 ? (
            <div className={chatStyles.emptyState}>The conversation is currently empty.</div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.sender === 'admin';
              
              return (
                <div key={msg.id} className={`${chatStyles.messageWrapper} ${isSelf ? chatStyles.self : chatStyles.other}`}>
                  <div className={chatStyles.messageContent}>
                    <div className={chatStyles.messageBubble}>
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachmentUrl && (
                        <img 
                          src={msg.attachmentUrl} 
                          alt="Attachment" 
                          className={chatStyles.imageAttachment} 
                        />
                      )}
                    </div>
                    <span className={chatStyles.timestamp}>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={chatStyles.inputAreaWrapper}>
          {isUploading && (
            <div className={chatStyles.uploadingBar}>
              <div className={chatStyles.progressFill}></div>
            </div>
          )}
          <form className={chatStyles.inputArea} onSubmit={handleSend}>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              type="button"
              className={chatStyles.iconBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip size={20} className={chatStyles.iconInk} />
            </button>

            <div className={chatStyles.inputBox}>
              <input
                type="text"
                placeholder={isUploading ? "Uploading attachment..." : "Inscribe your answer..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isUploading}
                className={chatStyles.textInput}
              />
            </div>

            <button 
              type="submit" 
              className={`${chatStyles.sendBtn} ${!inputText.trim() || isUploading ? chatStyles.sendBtnDisabled : ''}`}
              disabled={!inputText.trim() || isUploading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  </ParchmentBackground>
);
};
