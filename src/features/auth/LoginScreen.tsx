import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gem,
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

  const { login, setPendingRedirect } = useAuthStore();
  const { mode, toggleMode } = useThemeMode();
  const { t, isVietnamese, toggleLanguage } = useTranslation();
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
        <HStack hAlign="end" vAlign="center" gap={2} width="100%">
          <IconButton
            variant="ghost"
            size="sm"
            label={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            tooltip={isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            icon={<Icon icon={Languages} size="sm" />}
            onClick={toggleLanguage}
          />
          <IconButton
            variant="ghost"
            size="sm"
            label={mode === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
            tooltip={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}
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
            {t('common.tagline')}
          </Text>
        </VStack>

        <Card variant="default" elevation="med" padding={6} width="100%">
          <VStack gap={5} width="100%">
            <VStack gap={4} width="100%">
              <Text type="supporting" size="sm" color="secondary" justify="center" display="block">
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
                        onError={() => setError(isVietnamese ? 'Đăng nhập Google thất bại hoặc đã bị hủy' : 'Google login was cancelled or failed')}
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
                      {isVietnamese ? 'HOẶC' : 'OR'}
                    </Text>
                    <Divider />
                  </HStack>

                  <Button
                    label={isVietnamese ? 'Đăng nhập bằng tài khoản Game' : 'Sign in with Game Account'}
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
                      label={isVietnamese ? 'Tài khoản Game / Tên đăng nhập' : 'Player Account / Username'}
                      placeholder="e.g. player1"
                      value={username}
                      onChange={setUsername}
                      startIcon={User}
                      autoComplete="username"
                      width="100%"
                      isRequired
                    />

                    <TextInput
                      label={isVietnamese ? 'Mật khẩu' : 'Password'}
                      type="password"
                      placeholder={isVietnamese ? 'Nhập mật khẩu' : 'Enter password'}
                      value={password}
                      onChange={setPassword}
                      startIcon={KeyRound}
                      autoComplete="current-password"
                      width="100%"
                      isRequired
                    />

                    <Button
                      type="submit"
                      label={isVietnamese ? 'Đăng nhập vào tài khoản Game' : 'Sign In to Player Account'}
                      variant="primary"
                      size="lg"
                      width="100%"
                      isLoading={isLoading}
                    />

                    <Button
                      label={isVietnamese ? 'Quay lại Đăng nhập Google' : 'Use Google Sign-In Instead'}
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
                <Banner status="error" title={isVietnamese ? 'Đăng Nhập Thất Bại' : 'Sign In Failed'} description={error} role="alert" />
              )}

              <Divider />

              <VStack gap={1.5} width="100%">
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="xsm" color="accent" />
                  <Text type="supporting" size="xsm" color="secondary">
                    {t('trust.instantDelivery')}
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="center">
                  <Icon icon={CheckCircle2} size="xsm" color="accent" />
                  <Text type="supporting" size="xsm" color="secondary">
                    {t('trust.securePayment')}
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <Divider />

            <Button
              label={isVietnamese ? 'Xem bảng giá nạp với tư cách Khách' : 'Browse Top-Up Price List as Guest'}
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
