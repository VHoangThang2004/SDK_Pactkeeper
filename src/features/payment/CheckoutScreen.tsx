import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  ShieldCheck,
  Lock,
  Gem,
  AlertCircle,
  Sword,
  Shield,
  Users,
} from 'lucide-react';
import { Avatar, AvatarStatusDot } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { LayoutWrapper } from '../../components/LayoutWrapper/LayoutWrapper';
import { GemArt } from '../../components/GameIcons/GemArt';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../core/network/apiClient';
import styles from './CheckoutScreen.module.css';

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
  const pack = location.state?.pack as Pack | undefined;

  const { username, playerId } = useAuthStore();
  const [selectedChannel, setSelectedChannel] = useState('vietqr');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (price: number) => `${price.toLocaleString('vi-VN')} VND`;

  if (!pack) {
    return (
      <LayoutWrapper>
        <div className={styles.emptyWrap}>
          <Card variant="default" padding={6} maxWidth={480} width="100%">
            <EmptyState
              icon={<AlertCircle size={40} />}
              title="No Package Selected"
              description="Please select a Gem tier or Bundle from the Treasury catalog."
              actions={
                <Button
                  label="Return to Treasury"
                  variant="primary"
                  onClick={() => navigate('/profile/topup')}
                />
              }
            />
          </Card>
        </div>
      </LayoutWrapper>
    );
  }

  const unitList = pack.unitNames || pack.resolvedUnitNames || [];
  const weaponList = pack.weaponNames || pack.resolvedWeaponNames || [];
  const trinketList = pack.trinketNames || pack.resolvedTrinketNames || [];
  const bonusCount = unitList.length + weaponList.length + trinketList.length;
  const hasInclusions = bonusCount > 0;

  const handlePay = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post<{ checkoutUrl?: string }>('/api/payment/create-order', {
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
      console.error('Checkout error:', error);
      const apiMsg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setErrorMessage(apiMsg || 'Error occurred while creating payment order.');
      setIsLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <VStack gap={4} width="100%">
        {/* Top Return & Security Row */}
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <Button
            label="Return to Treasury"
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          />
          <Badge variant="success" icon={<Lock size={12} />} label="Secure 256-Bit SSL Checkout" />
        </HStack>

        {/* Character Destination Card (Real Data) */}
        <Card variant="default" padding={4} width="100%">
          <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
            <HStack gap={3} vAlign="center">
              <Avatar
                size={40}
                name={username || 'Player'}
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'Player'}`}
                status={<AvatarStatusDot variant="success" label="Delivery destination confirmed" />}
              />
              <VStack gap={0.5}>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  <Heading level={4}>{username || 'Player'}</Heading>
                  <Badge variant="cyan" label="Pactkeeper Official Server" />
                </HStack>
                <Text type="code" size="xsm" color="secondary">
                  Target Player ID: {playerId || 'Current Account'}
                </Text>
              </VStack>
            </HStack>

            <Badge
              variant="success"
              icon={<ShieldCheck size={13} />}
              label="Delivery Destination Confirmed"
            />
          </HStack>
        </Card>

        {/* 2-Column Checkout Layout */}
        <div className={styles.checkoutGrid}>
          {/* Left Column */}
          <VStack gap={4}>
            {/* 1. Order Item Details */}
            <Card variant="default" padding={5} width="100%">
              <VStack gap={4}>
                <HStack gap={2} vAlign="center">
                  <Badge variant="yellow" label="1" />
                  <Heading level={3}>Order Item Details</Heading>
                </HStack>

                <Divider />

                <HStack gap={4} vAlign="center" wrap="wrap">
                  <div className={styles.itemArtWrap} aria-hidden="true">
                    <GemArt gemsAmount={pack.gemsAmount} size={80} />
                  </div>

                  <VStack gap={2} className={styles.itemDetailsCol}>
                    <Heading level={3}>{pack.name}</Heading>
                    <div>
                      <Badge
                        variant="cyan"
                        icon={<Gem size={13} />}
                        label={`${pack.gemsAmount.toLocaleString('en-US')} Gems`}
                      />
                    </div>

                    {hasInclusions && (
                      <VStack gap={1.5}>
                        <Text type="supporting" size="xsm" color="secondary">
                          Included In Package
                        </Text>
                        <div className={styles.inclusionsWrap}>
                          {unitList.map((n, i) => (
                            <Token
                              key={`u-${i}`}
                              label={`Hero: ${n}`}
                              size="sm"
                              color="blue"
                              icon={<Users size={12} />}
                            />
                          ))}
                          {weaponList.map((n, i) => (
                            <Token
                              key={`w-${i}`}
                              label={`Weapon: ${n}`}
                              size="sm"
                              color="cyan"
                              icon={<Sword size={12} />}
                            />
                          ))}
                          {trinketList.map((n, i) => (
                            <Token
                              key={`t-${i}`}
                              label={`Trinket: ${n}`}
                              size="sm"
                              color="yellow"
                              icon={<Shield size={12} />}
                            />
                          ))}
                        </div>
                      </VStack>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </Card>

            {/* 2. Payment Gateway Selection (Unified PayOS Gateway) */}
            <Card variant="default" padding={5} width="100%">
              <VStack gap={4}>
                <HStack gap={2} vAlign="center">
                  <Badge variant="yellow" label="2" />
                  <Heading level={3}>Payment Gateway (PayOS)</Heading>
                </HStack>

                <Banner
                  status="info"
                  title="Official Hosted PayOS Checkout"
                  description="All channels proceed through the official PayOS gateway page supporting VietQR, Napas 247, and domestic bank transfers with zero fee."
                />

                <RadioList
                  label="Select preferred PayOS payment channel"
                  isLabelHidden
                  value={selectedChannel}
                  onChange={setSelectedChannel}
                  width="100%"
                >
                  <RadioListItem
                    value="vietqr"
                    startContent={<QrCode size={18} />}
                    label={
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <span>VietQR / Napas 247 Banking Apps</span>
                        <Badge variant="success" label="RECOMMENDED · 0% FEE" />
                      </HStack>
                    }
                    aria-label="VietQR / Napas 247 Banking Apps Recommended 0% Fee"
                    description="Scan dynamic QR with any banking app on the PayOS checkout page for instant confirmation."
                  />
                  <RadioListItem
                    value="card"
                    startContent={<CreditCard size={18} />}
                    label="Domestic Napas Bank Transfer / Gateway Cards"
                    description="Complete payment via supported banking channels listed directly on PayOS."
                  />
                </RadioList>
              </VStack>
            </Card>
          </VStack>

          {/* Right Column: Payment Summary */}
          <div className={styles.rightCol}>
            <Card variant="default" elevation="med" padding={5} width="100%">
              <VStack gap={4}>
                <Heading level={3}>Payment Summary</Heading>
                <Divider />

                <MetadataList columns="single" label={{ position: 'start', width: 120 }}>
                  <MetadataListItem label="Package">
                    <Text weight="semibold">{pack.name}</Text>
                  </MetadataListItem>
                  <MetadataListItem label="Gems Granted">
                    <Text hasTabularNumbers weight="semibold" className={styles.cyanText}>
                      {pack.gemsAmount.toLocaleString('en-US')} Gems
                    </Text>
                  </MetadataListItem>
                  {hasInclusions && (
                    <MetadataListItem label="Bonus Items">
                      <Badge variant="green" label={`${bonusCount} Items Included`} />
                    </MetadataListItem>
                  )}
                  <MetadataListItem label="Gateway Fee">
                    <Badge variant="success" label="0 VND (Free)" />
                  </MetadataListItem>
                </MetadataList>

                <Divider />

                <HStack hAlign="between" vAlign="center" width="100%">
                  <Text type="label" color="secondary">
                    Total Price
                  </Text>
                  <Heading level={2} type="display-3" className={styles.totalValue}>
                    {formatPrice(pack.priceVnd)}
                  </Heading>
                </HStack>

                {errorMessage && (
                  <Banner status="error" title="Order Error" description={errorMessage} role="alert" />
                )}

                <Button
                  label={`Proceed to Pay (${formatPrice(pack.priceVnd)})`}
                  variant="primary"
                  size="lg"
                  width="100%"
                  isLoading={isLoading}
                  onClick={handlePay}
                />

                <Banner
                  status="success"
                  title="Instant Automatic Delivery"
                  description="In-game currency and items are credited automatically to your account upon PayOS webhook confirmation."
                  icon={<ShieldCheck size={16} />}
                />

                <Text type="supporting" size="xsm" color="secondary" justify="center" display="block">
                  By proceeding, you agree to the Pactkeeper Payment Terms & Conditions. All orders
                  deliver directly into your verified Player ID.
                </Text>
              </VStack>
            </Card>
          </div>
        </div>
      </VStack>
    </LayoutWrapper>
  );
};
