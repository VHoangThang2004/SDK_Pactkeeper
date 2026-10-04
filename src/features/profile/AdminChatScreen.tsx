import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Paperclip, Send } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { apiClient } from '../../core/network/apiClient';
import { supportHubService } from '../support/services/SupportHubService';
import styles from './AdminChatScreen.module.css';
import chatStyles from '../support/SupportChat.module.css'; // Reuse chat styles

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: string;
  imageUrl?: string;
  text?: string;
  attachmentUrl?: string;
  createdAt?: string;
}

export const AdminChatScreen: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!playerId) return;

    const initChat = async () => {
      try {
        const response = await apiClient.get<Message[]>(`/api/support/admin/chat/${playerId}`);
        setMessages(response.data);
        
        await supportHubService.connect();
        supportHubService.onMessageReceived((msg) => {
          // Verify message belongs to this thread if needed, but typically it will.
          setMessages((prev) => [...prev, msg]);
        });
      } catch (error) {
        console.error('Failed to load chat', error);
      }
    };
    initChat();

    return () => {
      supportHubService.disconnect();
    };
  }, [playerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !playerId) return;

    try {
      await apiClient.post(`/api/support/admin/chat/${playerId}`, {
        text: inputText,
        attachmentUrl: '' // Add upload logic later if needed
      });
      setInputText('');
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
      await apiClient.post(`/api/support/admin/chat/${playerId}`, {
        text: '',
        attachmentUrl: uploadRes.data.url
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
              // The backend returns msg.sender as 'admin' or 'user'
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
                    <span className={chatStyles.timestamp}>{formatTime(msg.createdAt || new Date().toISOString())}</span>
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
    </ParchmentBackground>
  );
};
