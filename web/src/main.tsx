import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './router';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '%c⚠ Google Sign-In: VITE_GOOGLE_CLIENT_ID chưa được cấu hình trong web/.env\n' +
    '%c   Thêm dòng: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com',
    'color: orange; font-weight: bold;',
    'color: #888;'
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppRouter />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
