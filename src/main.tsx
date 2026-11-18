import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Theme } from '@astryxdesign/core/theme';
import { ToastViewport } from '@astryxdesign/core/Toast';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './styles/global.css';
import { themes, defaultThemeSlug } from './astryx-themes';
import App from './App.tsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Theme theme={themes[defaultThemeSlug]} mode="dark">
        <ToastViewport position="bottomEnd" maxVisible={3}>
          <App />
        </ToastViewport>
      </Theme>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
