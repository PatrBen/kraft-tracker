import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './index.css';

// Neue Version sofort übernehmen: Sobald der neue Service Worker aktiv ist, lädt die Seite neu.
// Die Daten liegen in IndexedDB, ein laufender Pausentimer in localStorage – dabei geht nichts verloren.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    // Beim Zurückkehren in die App nach Updates schauen (installierte Apps laufen oft tagelang).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration?.update();
    });
  },
});

// Falls eine noch offene alte Version eine Datei nachlädt, die es nach einem Update nicht mehr
// gibt (z. B. die Statistik-Seite), einfach neu laden statt einen Fehler zu zeigen.
window.addEventListener('vite:preloadError', () => window.location.reload());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
