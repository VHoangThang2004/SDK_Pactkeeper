import React from 'react';
import styles from './ScrollHeader.module.css';

interface ScrollHeaderProps {
  title: string;
  subtitle?: string;
}

export const ScrollHeader: React.FC<ScrollHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className={styles.header}>
      <div className={styles.titleWrapper}>
        <div className={styles.diamondLeft} />
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.diamondRight} />
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};
