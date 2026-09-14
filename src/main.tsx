import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Automatically register service worker for offline Android PWA support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Versi baru aplikasi terdeteksi.');
  },
  onOfflineReady() {
    console.log('Aplikasi siap bekerja offline di Android.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
