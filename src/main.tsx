import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

import PwaInstallBanner from './components/PwaInstallBanner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaInstallBanner />

  </StrictMode>,
);
