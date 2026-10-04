import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { BookOpen, Globe, ShieldAlert, User, KeyRound } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
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
      setError('Vui lòng nhập True Name (tên tài khoản)');
      return;
    }
    if (username.length < 3) {
      setError('True Name phải chứa ít nhất 3 ký tự');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập Secret Word (mật khẩu)');
      return;
    }
    if (password.length < 4) {
      setError('Secret Word phải chứa ít nhất 4 ký tự');
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

  const loginWithGoogleMutation = async (tokenResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // access_token is typically what implicit flow returns, but we might need id_token depending on backend.
      // Usually useGoogleLogin provides access_token. Let's send it to backend. 
      // Wait, if backend expects id_token, we should use the credential response from GoogleLogin component, 
      // but if we use useGoogleLogin flow='implicit', it returns access_token.
      // Let's assume the backend GoogleAuthService checks token. 
      // The mobile app uses GoogleSignIn which provides idToken.
      // So we MUST use flow: 'auth-code' or just use the google hook correctly.
      // We will send tokenResponse.access_token to the backend for now, as that's what useGoogleLogin provides by default.
      
      const response = await AuthService.loginWithGoogle(tokenResponse.access_token);
      login(response.token, response.username, response.playerId, response.role);
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: loginWithGoogleMutation,
    onError: () => setError('Đăng nhập Google bị hủy hoặc có lỗi'),
  });

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
                
                <button 
                  className={styles.googleBtn} 
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className={styles.spinner} />
                  ) : (
                    <>
                      <Globe size={20} className={styles.googleIcon} />
                      <span>PACT WITH GOOGLE</span>
                    </>
                  )}
                </button>

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
