import React from 'react';
import styles from './ScrollHeader.module.css';

interface ScrollHeaderProps {
  title: string;
}

export const ScrollHeader: React.FC<ScrollHeaderProps> = ({ title }) => {
  return (
    <div className={styles.header}>
      <div className={styles.scrollEndLeft} />
      <div className={styles.scrollBody}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.scrollEndRight} />
    </div>
  );
};
