import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { CounselThreadView } from '../support/components/CounselThreadView';

export const AdminChatScreen: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  if (!playerId) {
    return (
      <Card variant="default" padding={6} width="100%">
        <EmptyState
          icon={<Inbox size={36} />}
          title="No Player Thread Selected"
          description="Select an active support thread from Keeper's Archives."
          actions={
            <Button
              label="Back to Archives"
              variant="primary"
              onClick={() => navigate('/profile/admin-dashboard')}
            />
          }
        />
      </Card>
    );
  }

  return (
    <CounselThreadView
      mode="staff"
      targetPlayerId={playerId}
      headerTitle={`Counsel: ${playerId.slice(-8).toUpperCase()}`}
      headerBadge="Staff Reply"
      headerSubtitle={`Full Player ID: ${playerId}`}
      headerStart={
        <Button
          label="Back to Archives"
          variant="ghost"
          size="sm"
          isIconOnly
          icon={<ArrowLeft size={18} />}
          tooltip="Back to Keeper's Archives"
          onClick={() => navigate('/profile/admin-dashboard')}
        />
      }
    />
  );
};
