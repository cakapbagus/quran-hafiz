import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import OfflineNotice from './components/OfflineNotice';
import PwaInstallBanner from './components/PwaInstallBanner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaInstallBanner />
    <OfflineNotice />
  </StrictMode>,
);
