import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Gem, ShieldAlert, User, KeyRound, CheckCircle2, LogIn } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { loginUseCase, loginWithGoogleUseCase } from './di';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  
  const { login } = useAuthStore();

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await loginUseCase.execute(username, password);
      login(user.token, user.username, user.playerId, user.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials against Backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleMutation = async (idToken: string | undefined) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogleUseCase.execute(idToken);
      login(user.token, user.username, user.playerId, user.role);
    } catch (err: any) {
      setError(err.message || 'Google login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      
      <div className={styles.content}>
        
        {/* Brand / Logo */}
        <div className={styles.brandWrapper}>
          <div className={styles.brandIconWrap}>
            <Gem size={38} className={styles.brandIcon} />
          </div>
          <h1 className={styles.title}>PACTKEEPER</h1>
          <p className={styles.subtitle}>Official Web Top-Up Center & Account Portal</p>
        </div>

        {/* Login Card Form */}
        <div className={styles.cardWrapper}>
          
          {/* Card Tabs: Player vs Admin */}
          <div className={styles.tabHeader}>
            <button
              type="button"
              className={`${styles.tabBtn} ${!isAdminMode ? styles.tabActive : ''}`}
              onClick={() => {
                setIsAdminMode(false);
                setError(null);
              }}
            >
              Player Portal
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${isAdminMode ? styles.tabActive : ''}`}
              onClick={() => {
                setIsAdminMode(true);
                setError(null);
              }}
            >
              Staff Portal
            </button>
          </div>

          <div className={styles.cardBody}>
            {!isAdminMode ? (
              // --- Player Login View ---
              <div className={styles.playerView}>
                <p className={styles.instructionText}>
                  Sign in to your Pactkeeper player account to access the Treasury and recharge Gems.
                </p>

                {!usePasswordLogin ? (
                  <>
                    <div className={styles.googleBtnWrap}>
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

                    <div className={styles.dividerWrap}>
                      <span className={styles.dividerLine} />
                      <span className={styles.dividerText}>OR</span>
                      <span className={styles.dividerLine} />
                    </div>

                    <button 
                      type="button"
                      className={styles.switchAuthBtn}
                      onClick={() => {
                        setUsePasswordLogin(true);
                        setError(null);
                      }}
                    >
                      <LogIn size={15} />
                      <span>Sign in with Game Account (player1, player2...)</span>
                    </button>
                  </>
                ) : (
                  <form className={styles.adminView} onSubmit={handleNormalLogin}>
                    <div className={styles.inputGroup}>
                      <label>Player Account / Username</label>
                      <div className={styles.inputWrapper}>
                        <User size={16} className={styles.inputIcon} />
                        <input 
                          type="text" 
                          placeholder="e.g. player1"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Password</label>
                      <div className={styles.inputWrapper}>
                        <KeyRound size={16} className={styles.inputIcon} />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={styles.unsealBtn}
                      disabled={isLoading}
                    >
                      {isLoading ? <div className={styles.spinnerGold} /> : 'SIGN IN TO PLAYER ACCOUNT'}
                    </button>

                    <button
                      type="button"
                      className={styles.switchBackBtn}
                      onClick={() => {
                        setUsePasswordLogin(false);
                        setError(null);
                      }}
                    >
                      Use Google One-Tap Sign-In
                    </button>
                  </form>
                )}

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.benefitsBox}>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={14} className={styles.checkIcon} />
                    <span>Real-time sync with Backend (http://localhost:5276)</span>
                  </div>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={14} className={styles.checkIcon} />
                    <span>Instant automatic in-game delivery</span>
                  </div>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={14} className={styles.checkIcon} />
                    <span>Official PayOS payment gateway integration</span>
                  </div>
                </div>
              </div>
            ) : (
              // --- Admin Login View ---
              <form className={styles.adminView} onSubmit={handleNormalLogin}>
                <div className={styles.adminHeader}>
                  <ShieldAlert size={18} className={styles.adminIcon} />
                  <span>STAFF & ADMIN AUTHENTICATION</span>
                </div>

                <div className={styles.inputGroup}>
                  <label>Staff Username / Account</label>
                  <div className={styles.inputWrapper}>
                    <User size={16} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      placeholder="e.g. admin, techsupport"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Access Key / Password</label>
                  <div className={styles.inputWrapper}>
                    <KeyRound size={16} className={styles.inputIcon} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <button 
                  type="submit" 
                  className={styles.unsealBtn}
                  disabled={isLoading}
                >
                  {isLoading ? <div className={styles.spinnerGold} /> : 'ENTER MANAGEMENT ARCHIVES'}
                </button>
              </form>
            )}
          </div>

          {/* Server Status Footer */}
          <div className={styles.serverStatusFooter}>
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot} />
              <span>Backend Target: http://localhost:5276</span>
            </div>
            <span className={styles.versionTag}>SDK Live</span>
          </div>
        </div>

      </div>
    </div>
  );
};
