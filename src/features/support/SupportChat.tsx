import React, { useEffect, useState, useRef } from 'react';
import { supportHubService } from './services/SupportHubService';
import { apiClient } from '../../core/network/apiClient';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import styles from './SupportChat.module.css';
import { Send, Paperclip } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  timestamp: string;
  imageUrl?: string;
}

export const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { role } = useAuthStore();

  useEffect(() => {
    // 1. Fetch thread ID (Assuming API provides active thread)
    const initChat = async () => {
      try {
        const response = await apiClient.get('/api/Support/my-thread');
        setThreadId(response.data.id);
        setMessages(response.data.messages || []);
        
        // 2. Connect SignalR
        await supportHubService.connect();
        supportHubService.onMessageReceived((msg) => {
          setMessages((prev) => [...prev, msg]);
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
    if (!inputText.trim() || !threadId) return;

    await supportHubService.sendMessage(inputText, threadId);
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !threadId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threadId', threadId);

    try {
      await apiClient.post('/api/Support/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Backend will broadcast the message via SignalR once uploaded
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
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <ParchmentBackground padding="0">
      <div className={styles.chatContainer}>
        {/* Messages List */}
        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>The conversation is currently empty.</div>
          ) : (
            messages.map((msg) => {
              // If user is Admin, then Admin is self. If user is User, then User is self.
              // We'll simplify this by checking if the senderRole matches our own role.
              // Note: our role is from authStore. The mobile app distinguishes visually by 'isSelf'.
              const isSelf = msg.senderRole === role;
              
              return (
                <div key={msg.id} className={`${styles.messageWrapper} ${isSelf ? styles.self : styles.other}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      {msg.content && <p>{msg.content}</p>}
                      {msg.imageUrl && (
                        <img 
                          src={`http://localhost:5276/api/Support/image/${msg.imageUrl}`} 
                          alt="Attachment" 
                          className={styles.imageAttachment} 
                        />
                      )}
                    </div>
                    <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
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
                placeholder={isUploading ? "Uploading attachment..." : "Inscribe your answer..."}
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
