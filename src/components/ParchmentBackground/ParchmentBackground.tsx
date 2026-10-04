import React from 'react';
import styles from './ParchmentBackground.module.css';

interface ParchmentBackgroundProps {
  children: React.ReactNode;
  padding?: string;
}

export const ParchmentBackground: React.FC<ParchmentBackgroundProps> = ({ 
  children, 
  padding = '1rem' 
}) => {
  return (
    <div className={styles.background} style={{ padding }}>
      {children}
    </div>
  );
};
