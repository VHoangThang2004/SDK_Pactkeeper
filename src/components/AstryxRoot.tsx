import React from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { ToastViewport } from '@astryxdesign/core/Toast';
import { defaultThemeSlug, themes } from '../astryx-themes';
import { ThemeModeProvider } from '../context/ThemeModeProvider';
import { useThemeMode } from '../hooks/useThemeMode';

const AstryxThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = useThemeMode();

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={mode}>
      <ToastViewport position="bottomEnd" maxVisible={3}>
        {children}
      </ToastViewport>
    </Theme>
  );
};

export const AstryxRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeModeProvider>
      <AstryxThemeBridge>{children}</AstryxThemeBridge>
    </ThemeModeProvider>
  );
};
