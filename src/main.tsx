import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import { AstryxRoot } from './components/AstryxRoot.tsx';
import App from './App.tsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AstryxRoot>
        <App />
      </AstryxRoot>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
