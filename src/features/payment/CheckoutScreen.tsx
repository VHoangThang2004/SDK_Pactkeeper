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

  const { username, playerId } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!pack) {
    return (
      <LayoutWrapper>
        <Center minHeight="60vh">
          <EmptyState
            icon={<AlertCircle size={32} aria-hidden="true" />}
            title="No Package Selected"
            description="Please select a Gem tier or Bundle from the Treasury catalog before proceeding to checkout."
            actions={
              <Button
                variant="primary"
                label="Return to Treasury"
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
            label="Return to Treasury"
            onClick={() => navigate(-1)}
          />
          <HStack gap={2} vAlign="center">
            <Lock size={14} aria-hidden="true" />
            <Text type="supporting" size="sm" color="secondary">
              Secure 256-Bit SSL Checkout
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
                  Target Player ID: {playerId || 'Current Account'}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2} vAlign="center">
              <StatusDot variant="success" label="Delivery destination confirmed" />
              <Text size="sm" weight="medium">
                Delivery Destination Confirmed
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
                  <Token label="Step 1" size="sm" />
                  <Heading level={3}>Order Item Details</Heading>
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
                        {pack.gemsAmount.toLocaleString('en-US')} Gems
                      </Text>
                    </HStack>

                    {hasInclusions && (
                      <VStack gap={2}>
                        <Text type="supporting" size="sm" color="secondary">
                          Included in package:
                        </Text>
                        <HStack gap={1.5} wrap="wrap">
                          {unitList.map((n, i) => (
                            <Token
                              key={`u-${i}`}
                              icon={<Swords size={12} aria-hidden="true" />}
                              label={`Hero: ${n}`}
                              size="sm"
                            />
                          ))}
                          {weaponList.map((n, i) => (
                            <Token
                              key={`w-${i}`}
                              icon={<Shield size={12} aria-hidden="true" />}
                              label={`Weapon: ${n}`}
                              size="sm"
                            />
                          ))}
                          {trinketList.map((n, i) => (
                            <Token
                              key={`t-${i}`}
                              icon={<Sparkles size={12} aria-hidden="true" />}
                              label={`Trinket: ${n}`}
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
                  <Token label="Step 2" size="sm" />
                  <Heading level={3}>Payment Gateway</Heading>
                </HStack>

                <Divider />

                <Banner
                  status="info"
                  title="PayOS Hosted Checkout (VietQR / Napas 247)"
                  description="Proceeding creates a live PayOS order with a 15-minute VietQR code. Scan with any Vietnamese banking app for 0 VND fee and instant in-game credit."
                />

                <MetadataList>
                  <MetadataListItem label="Provider" icon={<QrCode size={14} aria-hidden="true" />}>
                    PayOS Official Gateway
                  </MetadataListItem>
                  <MetadataListItem label="Supported Channels">
                    <HStack gap={1.5} wrap="wrap">
                      <Token label="VietQR" size="sm" />
                      <Token label="Napas 247" size="sm" />
                      <Token label="Banking Apps" size="sm" />
                    </HStack>
                  </MetadataListItem>
                  <MetadataListItem label="Gateway Fee">0 VND (Free)</MetadataListItem>
                </MetadataList>
              </VStack>
            </Card>
          </VStack>

          {/* Right column: Summary & Pay CTA */}
          <Card padding={5} elevation="med" className="summaryCard">
            <VStack gap={4}>
              <Heading level={3}>Payment Summary</Heading>

              <Divider />

              <MetadataList>
                <MetadataListItem label="Package">{pack.name}</MetadataListItem>
                <MetadataListItem label="Gems Granted">
                  <Text hasTabularNumbers>
                    {pack.gemsAmount.toLocaleString('en-US')} Gems
                  </Text>
                </MetadataListItem>
                {hasInclusions && (
                  <MetadataListItem label="Bonus Items">
                    {totalInclusions} {totalInclusions === 1 ? 'Item' : 'Items'} Included
                  </MetadataListItem>
                )}
                <MetadataListItem label="Gateway Fee">0 VND (Free)</MetadataListItem>
              </MetadataList>

              <Divider />

              <HStack hAlign="between" vAlign="center">
                <Text weight="medium" color="secondary">
                  Total Price
                </Text>
                <Heading level={3}>{formatPrice(pack.priceVnd)}</Heading>
              </HStack>

              {errorMessage && (
                <Banner status="error" title="Checkout Error" description={errorMessage} />
              )}

              <Button
                variant="primary"
                size="lg"
                width="fill"
                label={`Proceed to Pay (${formatPrice(pack.priceVnd)})`}
                onClick={handlePay}
                isLoading={isLoading}
                isDisabled={isLoading}
              />

              <HStack gap={2} vAlign="start">
                <ShieldCheck size={16} aria-hidden="true" className="guaranteeIcon" />
                <Text type="supporting" size="sm" color="secondary">
                  100% Instant Delivery via PayOS. In-game currency and items are automatically
                  credited to your player account upon transaction confirmation.
                </Text>
              </HStack>

              <Text type="supporting" size="2xs" color="secondary">
                By clicking &ldquo;Proceed to Pay&rdquo;, you agree to the Pactkeeper Payment
                Terms &amp; Conditions. All sales are processed directly into the designated player
                account.
              </Text>
            </VStack>
          </Card>
        </Grid>
      </VStack>
    </LayoutWrapper>
  );
};
