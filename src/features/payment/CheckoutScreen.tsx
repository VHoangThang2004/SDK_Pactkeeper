import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Lock,
  Gem,
  AlertCircle,
  Swords,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { GemArt } from '../../components/GameIcons/GemArt';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import { useTranslation } from '../../core/i18n';

interface Pack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
  weaponDefinitionIds?: number[];
  trinketDefinitionIds?: number[];
  unitDefinitionIds?: number[];
  unitNames?: string[];
  weaponNames?: string[];
  trinketNames?: string[];
  resolvedUnitNames?: string[];
  resolvedWeaponNames?: string[];
  resolvedTrinketNames?: string[];
}

export const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pack = (location.state as { pack?: Pack } | null)?.pack;
  const { t, isVietnamese } = useTranslation();

  const { username, playerId } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!pack) {
    return (
      <LayoutWrapper>
        <Center minHeight="60vh">
          <EmptyState
            icon={<AlertCircle size={32} aria-hidden="true" />}
            title={t('checkout.noPackTitle')}
            description={t('checkout.noPackDesc')}
            actions={
              <Button
                variant="primary"
                label={t('common.backToTreasury')}
                onClick={() => navigate('/profile/topup')}
              />
            }
          />
        </Center>
      </LayoutWrapper>
    );
  }

  const formatPrice = (price: number) => `${price.toLocaleString('vi-VN')} VND`;

  const unitList = pack.unitNames || pack.resolvedUnitNames || [];
  const weaponList = pack.weaponNames || pack.resolvedWeaponNames || [];
  const trinketList = pack.trinketNames || pack.resolvedTrinketNames || [];
  const totalInclusions = unitList.length + weaponList.length + trinketList.length;
  const hasInclusions = totalInclusions > 0;

  const handlePay = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/api/payment/create-order', {
        packId: pack.id,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        ReturnUrl: `${window.location.origin}/payment/success`,
        CancelUrl: `${window.location.origin}/payment/cancel`,
      });

      if (response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setErrorMessage('Failed to obtain PayOS payment gateway link from server.');
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      console.error('Checkout error:', error);
      setErrorMessage(
        axiosErr?.response?.data?.message || 'Error occurred while creating payment order.'
      );
      setIsLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <VStack gap={5}>
        {/* Top bar */}
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            label={t('common.backToTreasury')}
            onClick={() => navigate(-1)}
          />
          <HStack gap={2} vAlign="center">
            <Lock size={14} aria-hidden="true" />
            <Text type="supporting" size="sm" color="secondary">
              {t('checkout.secureSsl')}
            </Text>
          </HStack>
        </HStack>

        {/* Character Destination Card */}
        <Card padding={4} elevation="low">
          <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
            <HStack gap={3} vAlign="center">
              <Avatar
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Player'}`}
                name={username || 'Player'}
                size="md"
              />
              <VStack gap={1}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Text weight="semibold">{username || 'Player'}</Text>
                  <Token label="Pactkeeper Official Server" size="sm" />
                </HStack>
                <Text type="supporting" size="sm" color="secondary">
                  {t('checkout.targetPlayerId')}: {playerId || 'Current Account'}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2} vAlign="center">
              <StatusDot variant="success" label="Delivery destination confirmed" />
              <Text size="sm" weight="medium">
                {t('checkout.deliveryDestinationConfirmed')}
              </Text>
            </HStack>
          </HStack>
        </Card>

        {/* Responsive 2-column checkout layout */}
        <Grid gap={5} className="checkoutGrid">
          {/* Left column: Item details + PayOS gateway info */}
          <VStack gap={5}>
            <Card padding={5} elevation="low">
              <VStack gap={4}>
                <HStack gap={2} vAlign="center">
                  <Token label={t('checkout.step1')} size="sm" />
                  <Heading level={3}>{t('checkout.orderItemDetails')}</Heading>
                </HStack>

                <Divider />

                <HStack gap={5} vAlign="center" wrap="wrap">
                  <Center width={96} height={96}>
                    <GemArt gemsAmount={pack.gemsAmount} size={80} />
                  </Center>

                  <VStack gap={2}>
                    <Heading level={4}>{pack.name}</Heading>

                    <HStack gap={2} vAlign="center">
                      <Gem size={18} aria-hidden="true" />
                      <Text weight="semibold" size="lg" hasTabularNumbers>
                        {pack.gemsAmount.toLocaleString('en-US')} Gem
                      </Text>
                    </HStack>

                    {hasInclusions && (
                      <VStack gap={2}>
                        <Text type="supporting" size="sm" color="secondary">
                          {t('topup.includedPactItems')}
                        </Text>
                        <HStack gap={1.5} wrap="wrap">
                          {unitList.map((n, i) => (
                            <Token
                              key={`u-${i}`}
                              icon={<Swords size={12} aria-hidden="true" />}
                              label={`${isVietnamese ? 'Tướng' : 'Hero'}: ${n}`}
                              size="sm"
                            />
                          ))}
                          {weaponList.map((n, i) => (
                            <Token
                              key={`w-${i}`}
                              icon={<Shield size={12} aria-hidden="true" />}
                              label={`${isVietnamese ? 'Vũ khí' : 'Weapon'}: ${n}`}
                              size="sm"
                            />
                          ))}
                          {trinketList.map((n, i) => (
                            <Token
                              key={`t-${i}`}
                              icon={<Sparkles size={12} aria-hidden="true" />}
                              label={`${isVietnamese ? 'Trang sức' : 'Trinket'}: ${n}`}
                              size="sm"
                            />
                          ))}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </Card>

            <Card padding={5} elevation="low">
              <VStack gap={4}>
                <HStack gap={2} vAlign="center">
                  <Token label={t('checkout.step2')} size="sm" />
                  <Heading level={3}>{t('checkout.paymentGateway')}</Heading>
                </HStack>

                <Divider />

                <Banner
                  status="info"
                  title={t('checkout.payosBannerTitle')}
                  description={t('checkout.payosBannerDesc')}
                />

                <MetadataList>
                  <MetadataListItem label={t('checkout.provider')} icon={<QrCode size={14} aria-hidden="true" />}>
                    PayOS Official Gateway
                  </MetadataListItem>
                  <MetadataListItem label={t('checkout.supportedChannels')}>
                    <HStack gap={1.5} wrap="wrap">
                      <Token label="VietQR" size="sm" />
                      <Token label="Napas 247" size="sm" />
                      <Token label={isVietnamese ? 'App Ngân hàng' : 'Banking Apps'} size="sm" />
                    </HStack>
                  </MetadataListItem>
                  <MetadataListItem label={t('checkout.gatewayFee')}>{t('checkout.free')}</MetadataListItem>
                </MetadataList>
              </VStack>
            </Card>
          </VStack>

          {/* Right column: Summary & Pay CTA */}
          <Card padding={5} elevation="med" className="summaryCard">
            <VStack gap={4}>
              <Heading level={3}>{t('checkout.paymentSummary')}</Heading>

              <Divider />

              <MetadataList>
                <MetadataListItem label={isVietnamese ? 'Gói nạp' : 'Package'}>{pack.name}</MetadataListItem>
                <MetadataListItem label={t('checkout.gemsGranted')}>
                  <Text hasTabularNumbers>
                    {pack.gemsAmount.toLocaleString('en-US')} Gem
                  </Text>
                </MetadataListItem>
                {hasInclusions && (
                  <MetadataListItem label={t('checkout.bonusItems')}>
                    {t('checkout.itemsIncluded', { count: totalInclusions })}
                  </MetadataListItem>
                )}
                <MetadataListItem label={t('checkout.gatewayFee')}>{t('checkout.free')}</MetadataListItem>
              </MetadataList>

              <Divider />

              <HStack hAlign="between" vAlign="center">
                <Text weight="medium" color="secondary">
                  {isVietnamese ? 'Tổng Thanh Toán' : 'Total Price'}
                </Text>
                <Heading level={3}>{formatPrice(pack.priceVnd)}</Heading>
              </HStack>

              {errorMessage && (
                <Banner status="error" title={isVietnamese ? 'Lỗi Thanh Toán' : 'Checkout Error'} description={errorMessage} />
              )}

              <Button
                variant="primary"
                size="lg"
                width="fill"
                label={t('checkout.proceedToPay', { price: formatPrice(pack.priceVnd) })}
                onClick={handlePay}
                isLoading={isLoading}
                isDisabled={isLoading}
              />

              <HStack gap={2} vAlign="start">
                <ShieldCheck size={16} aria-hidden="true" className="guaranteeIcon" />
                <Text type="supporting" size="sm" color="secondary">
                  {t('checkout.deliveryGuarantee')}
                </Text>
              </HStack>

              <Text type="supporting" size="2xs" color="secondary">
                {t('checkout.termsNotice')}
              </Text>
            </VStack>
          </Card>
        </Grid>
      </VStack>
    </LayoutWrapper>
  );
};
