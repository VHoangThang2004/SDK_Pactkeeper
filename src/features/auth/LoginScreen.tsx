import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, ShieldAlert, User, KeyRound } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { AuthService } from './services/authService';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuthStore();

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter True Name (username)');
      return;
    }
    if (username.length < 3) {
      setError('True Name must contain at least 3 characters');
      return;
    }
    if (!password) {
      setError('Please enter Secret Word (password)');
      return;
    }
    if (password.length < 4) {
      setError('Secret Word must contain at least 4 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login(username, password);
      login(response.token, response.username, response.playerId, response.role);
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleMutation = async (idToken: string | undefined) => {
    if (!idToken) {
      setError('Error: Did not receive token from Google');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.loginWithGoogle(idToken);
      if (!response.token) {
        throw new Error('Authentication token not received from server');
      }
      login(response.token, response.username, response.playerId, response.role);
    } catch (err: any) {
      setError(err.message || 'Google login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Image & Overlay are handled in CSS */}
      <div className={styles.overlay} />
      
      <div className={styles.content}>
        {/* Brand / Logo */}
        <div className={styles.brandWrapper}>
          <BookOpen size={64} className={styles.brandIcon} />
          <h1 className={styles.title}>PACTKEEPER</h1>
          <p className={styles.subtitle}>Forge Your Legend</p>
        </div>

        {/* Login Card Form */}
        <div className={styles.cardWrapper}>
          <div className={styles.cardBody}>
            {!isAdminMode ? (
              // --- Player Login View ---
              <div className={styles.playerView}>
                <p className={styles.instructionText}>
                  Invoke your power and enter the realm
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                    <GoogleLogin 
                      onSuccess={(credentialResponse) => loginWithGoogleMutation(credentialResponse.credential)}
                      onError={() => setError('Google login was cancelled or failed')}
                      useOneTap
                      theme="filled_black"
                      text="signin_with"
                      shape="pill"
                    />
                  </GoogleOAuthProvider>
                </div>

                {error && <div className={styles.errorMessage} style={{marginTop: '1rem', textAlign: 'center'}}>{error}</div>}

                <button 
                  className={styles.textBtn} 
                  onClick={() => {
                    setIsAdminMode(true);
                    setError(null);
                  }}
                >
                  ADMIN ENTRANCE
                </button>
              </div>
            ) : (
              // --- Admin Login View ---
              <form className={styles.adminView} onSubmit={handleNormalLogin}>
                <div className={styles.adminHeader}>
                  <ShieldAlert size={20} className={styles.adminIcon} />
                  <h2>ADMIN ENTRANCE</h2>
                </div>

                <div className={styles.inputGroup}>
                  <label>TRUE NAME</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      placeholder="Elder / Admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>SECRET WORD</label>
                  <div className={styles.inputWrapper}>
                    <KeyRound size={18} className={styles.inputIcon} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <button 
                  type="submit" 
                  className={styles.unsealBtn}
                  disabled={isLoading}
                >
                  {isLoading ? <div className={styles.spinnerGold} /> : 'UNSEAL THE PACT'}
                </button>

                <button 
                  type="button" 
                  className={styles.textBtn} 
                  onClick={() => {
                    setIsAdminMode(false);
                    setError(null);
                    setUsername('');
                    setPassword('');
                  }}
                >
                  BACK TO PLAYER ENTRANCE
                </button>
              </form>
            )}
          </div>

          {/* 4 Corner Circles */}
          <div className={`${styles.cornerCircle} ${styles.topLeft}`} />
          <div className={`${styles.cornerCircle} ${styles.topRight}`} />
          <div className={`${styles.cornerCircle} ${styles.bottomLeft}`} />
          <div className={`${styles.cornerCircle} ${styles.bottomRight}`} />
        </div>
      </div>
    </div>
  );
};
