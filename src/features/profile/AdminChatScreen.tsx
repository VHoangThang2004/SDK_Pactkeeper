import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Paperclip, Send } from 'lucide-react';
import { ParchmentBackground } from '../../components/ParchmentBackground/ParchmentBackground';
import { useAuthStore } from '../../store/authStore';
import styles from './AdminChatScreen.module.css';
import chatStyles from '../support/SupportChat.module.css'; // Reuse chat styles

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  timestamp: string;
  imageUrl?: string;
}

export const AdminChatScreen: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // In a real app, fetch messages for this playerId
    const mockMessages: Message[] = [
      { id: '1', content: 'I lost my gems', senderId: playerId!, senderRole: 'User', timestamp: new Date(Date.now() - 300000).toISOString() },
    ];
    setMessages(mockMessages);
  }, [playerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      content: inputText,
      senderId: 'admin1',
      senderRole: 'Admin',
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setInputText('');
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
              const isSelf = msg.senderRole === role;
              
              return (
                <div key={msg.id} className={`${chatStyles.messageWrapper} ${isSelf ? chatStyles.self : chatStyles.other}`}>
                  <div className={chatStyles.messageContent}>
                    <div className={chatStyles.messageBubble}>
                      {msg.content && <p>{msg.content}</p>}
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Attachment" 
                          className={chatStyles.imageAttachment} 
                        />
                      )}
                    </div>
                    <span className={chatStyles.timestamp}>{formatTime(msg.timestamp)}</span>
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
