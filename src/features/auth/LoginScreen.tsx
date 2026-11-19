import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gem,
  ShieldAlert,
  User,
  KeyRound,
  CheckCircle2,
  LogIn,
  ArrowLeft,
} from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Card } from '@astryxdesign/core/Card';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack, HStack } from '@astryxdesign/core/Layout';
import { useAuthStore } from '../../store/authStore';
import { loginUseCase, loginWithGoogleUseCase } from './di';
import styles from './LoginScreen.module.css';

export const LoginScreen: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);

  const { login, setPendingRedirect } = useAuthStore();
  const navigate = useNavigate();

  const handleBrowseAsGuest = () => {
    setPendingRedirect(null);
    navigate('/profile/topup');
  };

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await loginUseCase.execute(username, password);
      login(user.token, user.username, user.playerId, user.role);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Login failed. Please verify credentials against Backend.';
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.backdropGlow} aria-hidden="true" />

      <div className={styles.shell}>
        <VStack gap={3} hAlign="center">
          <div className={styles.brandIconWrap} aria-hidden="true">
            <Gem size={32} />
          </div>
          <VStack gap={1} hAlign="center">
            <Heading level={1} justify="center">
              PACTKEEPER
            </Heading>
            <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
              Official Web Top-Up Center & Account Portal
            </Text>
          </VStack>
        </VStack>

        <Card variant="default" elevation="med" padding={6} width="100%">
          <VStack gap={5}>
            <SegmentedControl
              label="Portal mode"
              layout="fill"
              value={isAdminMode ? 'staff' : 'player'}
              onChange={(value) => {
                setIsAdminMode(value === 'staff');
                setError(null);
              }}
            >
              <SegmentedControlItem value="player" label="Player Portal" />
              <SegmentedControlItem value="staff" label="Staff Portal" />
            </SegmentedControl>

            {!isAdminMode ? (
              <VStack gap={4}>
                <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
                  Sign in to your Pactkeeper player account to access the Treasury and recharge Gems.
                </Text>

                {!usePasswordLogin ? (
                  <VStack gap={3}>
                    <div className={styles.googleBtnWrap}>
                      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                        <GoogleLogin
                          onSuccess={(credentialResponse) =>
                            loginWithGoogleMutation(credentialResponse.credential)
                          }
                          onError={() => setError('Google login was cancelled or failed')}
                          useOneTap
                          theme="filled_black"
                          text="signin_with"
                          shape="pill"
                        />
                      </GoogleOAuthProvider>
                    </div>

                    <Divider label="OR" />

                    <Button
                      label="Sign in with Game Account"
                      variant="secondary"
                      width="100%"
                      size="lg"
                      icon={<LogIn size={16} />}
                      onClick={() => {
                        setUsePasswordLogin(true);
                        setError(null);
                      }}
                    />
                  </VStack>
                ) : (
                  <form onSubmit={handleNormalLogin}>
                    <VStack gap={3}>
                      <TextInput
                        label="Player Account / Username"
                        placeholder="e.g. player1"
                        value={username}
                        onChange={(val) => setUsername(val)}
                        startIcon={<User size={16} />}
                        autoComplete="username"
                        width="100%"
                        isRequired
                      />
                      <TextInput
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(val) => setPassword(val)}
                        startIcon={<KeyRound size={16} />}
                        autoComplete="current-password"
                        width="100%"
                        isRequired
                      />
                      <Button
                        type="submit"
                        label="Sign In to Player Account"
                        variant="primary"
                        width="100%"
                        size="lg"
                        isLoading={isLoading}
                      />
                      <Button
                        type="button"
                        label="Use Google One-Tap Sign-In"
                        variant="ghost"
                        width="100%"
                        onClick={() => {
                          setUsePasswordLogin(false);
                          setError(null);
                        }}
                      />
                    </VStack>
                  </form>
                )}

                {error && (
                  <Banner status="error" title="Sign In Failed" description={error} role="alert" />
                )}

                <Card variant="muted" padding={3}>
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center">
                      <CheckCircle2 size={15} className={styles.benefitIcon} aria-hidden="true" />
                      <Text type="supporting" size="sm" color="secondary">
                        Instant automatic in-game delivery
                      </Text>
                    </HStack>
                    <HStack gap={2} vAlign="center">
                      <CheckCircle2 size={15} className={styles.benefitIcon} aria-hidden="true" />
                      <Text type="supporting" size="sm" color="secondary">
                        Official PayOS & national banking gateway
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              </VStack>
            ) : (
              <form onSubmit={handleNormalLogin}>
                <VStack gap={3}>
                  <Banner
                    status="warning"
                    title="Staff & Admin Authentication"
                    description="Authorized Game Masters, Technical Support, and Administrators only."
                    icon={<ShieldAlert size={16} />}
                  />
                  <TextInput
                    label="Staff Username / Account"
                    placeholder="e.g. admin, techsupport"
                    value={username}
                    onChange={(val) => setUsername(val)}
                    startIcon={<User size={16} />}
                    autoComplete="username"
                    width="100%"
                    isRequired
                  />
                  <TextInput
                    type="password"
                    label="Access Key / Password"
                    placeholder="Enter access key"
                    value={password}
                    onChange={(val) => setPassword(val)}
                    startIcon={<KeyRound size={16} />}
                    autoComplete="current-password"
                    width="100%"
                    isRequired
                  />
                  {error && (
                    <Banner status="error" title="Access Denied" description={error} role="alert" />
                  )}
                  <Button
                    type="submit"
                    label="Enter Management Archives"
                    variant="primary"
                    width="100%"
                    size="lg"
                    isLoading={isLoading}
                  />
                </VStack>
              </form>
            )}

            <Divider />

            <Button
              label="Browse Top-Up Price List as Guest"
              variant="ghost"
              width="100%"
              icon={<ArrowLeft size={15} />}
              onClick={handleBrowseAsGuest}
            />
          </VStack>
        </Card>
      </div>
    </main>
  );
};
