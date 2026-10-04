import React from 'react';
import styles from './LayoutWrapper.module.css';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.borderLeft} />
        <div className={styles.content}>
          {children}
        </div>
        <div className={styles.borderRight} />
      </div>
    </div>
  );
};
