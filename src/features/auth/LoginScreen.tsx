import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  KeyRound,
  CheckCircle2,
  LogIn,
  ArrowLeft,
  Moon,
  Sun,
  Languages,
} from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../core/i18n';
import { loginUseCase, loginWithGoogleUseCase } from './di';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const { login, setPendingRedirect } = useAuthStore();
  const { mode, toggleMode } = useThemeMode();
  const { t, isVietnamese, toggleLanguage } = useTranslation();
  const navigate = useNavigate();

  const gameScenes = useMemo(
    () => [
      {
        id: 'awaken',
        num: '01',
        src: '/game-assets/hero-awaken.png',
        title: t('topup.scene1Label'),
      },
      {
        id: 'briefing',
        num: '02',
        src: '/game-assets/hero-briefing.png',
        title: t('topup.scene2Label'),
      },
      {
        id: 'eye',
        num: '03',
        src: '/game-assets/hero-eye.png',
        title: t('topup.scene3Label'),
      },
    ],
    [t]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

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
          : t('auth.loginErrorFallback')
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
      setError(err instanceof Error ? err.message : t('auth.googleErrorFallback'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center padding={4} minHeight="100dvh" width="100%" className="loginStage">
      <VStack className="loginBgLayer">
        {gameScenes.map((scene, idx) => (
          <img
            key={scene.id}
            src={scene.src}
            alt=""
            aria-hidden="true"
            className={
              idx === activeSceneIndex
                ? 'loginBgImage loginBgImageActive'
                : 'loginBgImage'
            }
          />
        ))}
      </VStack>
      <VStack className="loginBgScrim" />

      <VStack gap={3} width="100%" maxWidth={520} hAlign="center" className="loginForeground pageMotionWrap">
        <Card variant="default" elevation="med" padding={5} width="100%" className="loginCard">
          <VStack gap={4} width="100%">
            {/* Top Utility Controls inside card for guaranteed contrast */}
            <HStack hAlign="end" vAlign="center" gap={2} width="100%">
              <IconButton
                variant="secondary"
                size="md"
                label={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                tooltip={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                icon={<Icon icon={Languages} size="sm" />}
                onClick={toggleLanguage}
              />
              <IconButton
                variant="secondary"
                size="md"
                label={mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
                tooltip={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}
                icon={<Icon icon={mode === 'dark' ? Sun : Moon} size="sm" />}
                onClick={toggleMode}
              />
            </HStack>

            {/* Brand Header inside card for crisp Light/Dark contrast */}
            <VStack gap={2} hAlign="center">
              <img src="/logo.png" alt="Pactkeeper Logo" className="brandLogoLogin" />
              <Heading level={1} justify="center" weight="bold">
                PACTKEEPER
              </Heading>
              <Text type="body" size="base" weight="medium" color="secondary" justify="center" display="block">
                {t('common.tagline')}
              </Text>
            </VStack>

            <Divider />

            <VStack gap={4} width="100%">
              <Text type="body" size="lg" color="secondary" justify="center" display="block">
                {t('auth.signInSubtitle')}
              </Text>

              {!usePasswordLogin ? (
                <VStack gap={4} width="100%">
                  <Center width="100%">
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                      <GoogleLogin
                        onSuccess={(credentialResponse) =>
                          loginWithGoogleMutation(credentialResponse.credential)
                        }
                        onError={() => setError(t('auth.googleCancelledError'))}
                        useOneTap
                        size="large"
                        theme={mode === 'dark' ? 'filled_black' : 'outline'}
                        text="signin_with"
                        shape="pill"
                      />
                    </GoogleOAuthProvider>
                  </Center>

                  <HStack gap={3} vAlign="center" width="100%">
                    <Divider />
                    <Text type="supporting" size="sm" weight="semibold" color="secondary">
                      {t('auth.orDivider')}
                    </Text>
                    <Divider />
                  </HStack>

                  <Button
                    label={t('auth.useGameAccount')}
                    variant="secondary"
                    size="lg"
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
                      label={t('auth.usernameLabel')}
                      placeholder={t('auth.usernamePlaceholder')}
                      value={username}
                      onChange={setUsername}
                      startIcon={User}
                      autoComplete="username"
                      width="100%"
                      isRequired
                    />

                    <TextInput
                      label={t('auth.passwordLabel')}
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={setPassword}
                      startIcon={KeyRound}
                      autoComplete="current-password"
                      width="100%"
                      isRequired
                    />

                    <Button
                      type="submit"
                      label={t('auth.submitGameAccount')}
                      variant="primary"
                      size="lg"
                      width="100%"
                      isLoading={isLoading}
                    />

                    <Button
                      label={t('auth.useGoogleInstead')}
                      variant="ghost"
                      size="md"
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
                <Banner status="error" title={t('auth.signInFailedTitle')} description={error} role="alert" />
              )}

              <Divider />

              <VStack gap={2} width="100%">
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="sm" color="accent" />
                  <Text type="body" size="base" color="secondary">
                    {t('trust.instantDelivery')}
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="sm" color="accent" />
                  <Text type="body" size="base" color="secondary">
                    {t('trust.securePayment')}
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <Divider />

            <Button
              label={t('auth.browseAsGuest')}
              variant="ghost"
              size="lg"
              width="100%"
              icon={<Icon icon={ArrowLeft} size="sm" />}
              onClick={handleBrowseAsGuest}
            />
          </VStack>
        </Card>

        {/* Interactive Scene Switcher Pills */}
        <HStack gap={2} wrap="wrap" hAlign="center">
          {gameScenes.map((scene, idx) => {
            const isActive = idx === activeSceneIndex;
            return (
              <Button
                key={scene.id}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                label={`${scene.num} · ${scene.title}`}
                className="scenePillBtn"
                onClick={() => setActiveSceneIndex(idx)}
              />
            );
          })}
        </HStack>
      </VStack>
    </Center>
  );
};
