import React, { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = `${styles.btn} ${styles[variant]} ${className}`;

  return (
    <button
      className={baseClass}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className={styles.loader}></span> : children}
    </button>
  );
};
