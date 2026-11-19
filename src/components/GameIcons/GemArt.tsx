import React from 'react';
import { Crown, Gem, Sparkles } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Icon } from '@astryxdesign/core/Icon';

interface GemArtProps {
  gemsAmount: number;
  size?: number;
}

export const GemArt: React.FC<GemArtProps> = ({ gemsAmount, size = 72 }) => {
  const isHighTier = gemsAmount >= 1000;
  const isMidTier = gemsAmount >= 500 && gemsAmount < 1000;

  const glyph = isHighTier ? Crown : isMidTier ? Sparkles : Gem;
  const glyphColor = isHighTier ? 'yellow' : isMidTier ? 'cyan' : 'accent';

  return (
    <Card variant="muted" padding={3}>
      <Center width={size} height={size}>
        <Icon icon={glyph} size="lg" color={glyphColor} />
      </Center>
    </Card>
  );
};
