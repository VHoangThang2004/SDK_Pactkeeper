import React from 'react';
import { CounselThreadView } from './components/CounselThreadView';

export const SupportChat: React.FC = () => {
  return (
    <CounselThreadView
      mode="player"
      headerTitle="Keeper of Records"
      headerBadge="Official GM"
    />
  );
};
