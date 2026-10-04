import React, { useEffect, useState, useRef } from 'react';
import { supportHubService } from './services/SupportHubService';
import { apiClient } from '../../core/network/apiClient';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './SupportChat.module.css';
import { Send, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  attachmentUrl: string;
  createdAt: string;
}

export const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const response = await apiClient.get('/api/support/chat');
        setMessages(response.data || []);
        
        await supportHubService.connect();
        supportHubService.onMessageReceived((_playerId, msg) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      } catch (error) {
        console.error('Failed to init chat', error);
      }
    };
    initChat();

    return () => {
      supportHubService.disconnect();
    };
  }, []);

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
        attachmentUrl: ''
      });
      const sentMsg = response.data;
      setMessages((prev) => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err) {
      console.error('Failed to send message', err);
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
      <div className={styles.chatContainer}>
        {/* Messages List */}
        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>Inscribe a query to summon the Keeper of Records.</div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.sender.toLowerCase() === 'user';
              
              return (
                <div key={msg.id} className={`${styles.messageWrapper} ${isSelf ? styles.self : styles.other}`}>
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
            >
              <Paperclip size={20} className={styles.iconInk} />
            </button>

            <div className={styles.inputBox}>
              <input
                type="text"
                placeholder={isUploading ? "Uploading mystical vision..." : "Inscribe your message..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isUploading}
                className={styles.textInput}
              />
            </div>

            <button 
              type="submit" 
              className={`${styles.sendBtn} ${!inputText.trim() || isUploading ? styles.sendBtnDisabled : ''}`}
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
