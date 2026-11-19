import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Gem,
  KeyRound,
  LogIn,
  Moon,
  Palette,
  Sun,
  User,
} from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { DropdownMenu, DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ASTRYX_THEME_OPTIONS } from '../../context/themeModeContext';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/authStore';
import { loginUseCase, loginWithGoogleUseCase } from './di';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);

  const { login, setPendingRedirect } = useAuthStore();
  const { mode, toggleMode, themeSlug, setThemeSlug } = useThemeMode();
  const navigate = useNavigate();

  const currentThemeOption =
    ASTRYX_THEME_OPTIONS.find((opt) => opt.slug === themeSlug) ?? ASTRYX_THEME_OPTIONS[0];

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
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please verify credentials against Backend.'
      );
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
      setError(err instanceof Error ? err.message : 'Google login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center padding={6} minHeight="100dvh" width="100%">
      <VStack gap={5} width="100%" maxWidth={460} hAlign="center">
        <HStack hAlign="end" gap={2} width="100%">
          <DropdownMenu
            alignment="end"
            button={{
              label: currentThemeOption.label,
              variant: 'secondary',
              size: 'sm',
              icon: <Icon icon={Palette} size="sm" />,
            }}
          >
            {ASTRYX_THEME_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.slug}
                label={opt.label}
                description={opt.subtitle}
                endContent={
                  themeSlug === opt.slug ? <Icon icon={Check} size="sm" color="accent" /> : undefined
                }
                onClick={() => setThemeSlug(opt.slug)}
              />
            ))}
          </DropdownMenu>

          <IconButton
            variant="ghost"
            size="sm"
            label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            tooltip={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
            onClick={toggleMode}
          />
        </HStack>

        <VStack gap={2} hAlign="center">
          <Card variant="default" padding={3} elevation="med">
            <Icon icon={Gem} size="lg" color="accent" />
          </Card>
          <Heading level={1} justify="center">
            PACTKEEPER
          </Heading>
          <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
            Official Web Top-Up Center &amp; Account Portal
          </Text>
        </VStack>

        <Card variant="default" elevation="med" padding={6} width="100%">
          <VStack gap={5} width="100%">
            <VStack gap={4} width="100%">
              <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
                Sign in to your Pactkeeper player account to access the Treasury and recharge Gems.
              </Text>

              {!usePasswordLogin ? (
                <VStack gap={4} width="100%">
                  <Center width="100%">
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                      <GoogleLogin
                        onSuccess={(credentialResponse) =>
                          loginWithGoogleMutation(credentialResponse.credential)
                        }
                        onError={() => setError('Google login was cancelled or failed')}
                        useOneTap
                        theme={mode === 'dark' ? 'filled_black' : 'outline'}
                        text="signin_with"
                        shape="pill"
                      />
                    </GoogleOAuthProvider>
                  </Center>

                  <HStack gap={3} vAlign="center" width="100%">
                    <Divider />
                    <Text type="supporting" size="xsm" color="disabled">
                      OR
                    </Text>
                    <Divider />
                  </HStack>

                  <Button
                    label="Sign in with Game Account"
                    variant="secondary"
                    width="100%"
                    icon={<Icon icon={LogIn} size="sm" />}
                    onClick={() => {
                      setUsePasswordLogin(true);
                      setError(null);
                    }}
                  />
                </VStack>
              ) : (
                <form onSubmit={handleNormalLogin}>
                  <VStack gap={4} width="100%">
                    <TextInput
                      label="Player Account / Username"
                      placeholder="e.g. player1"
                      value={username}
                      onChange={setUsername}
                      startIcon={User}
                      autoComplete="username"
                      width="100%"
                      isRequired
                    />

                    <TextInput
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={setPassword}
                      startIcon={KeyRound}
                      autoComplete="current-password"
                      width="100%"
                      isRequired
                    />

                    <Button
                      type="submit"
                      label="Sign In to Player Account"
                      variant="primary"
                      size="lg"
                      width="100%"
                      isLoading={isLoading}
                    />

                    <Button
                      label="Use Google Sign-In Instead"
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

              <Divider />

              <VStack gap={1.5} width="100%">
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="xsm" color="accent" />
                  <Text type="supporting" size="xsm" color="secondary">
                    Instant automatic in-game delivery
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="xsm" color="accent" />
                  <Text type="supporting" size="xsm" color="secondary">
                    Official PayOS gateway integration
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <Divider />

            <Button
              label="Browse Top-Up Price List as Guest"
              variant="ghost"
              width="100%"
              icon={<Icon icon={ArrowLeft} size="sm" />}
              onClick={handleBrowseAsGuest}
            />
          </VStack>
        </Card>
      </VStack>
    </Center>
  );
};
