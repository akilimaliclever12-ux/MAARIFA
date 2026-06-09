'use client';

import { useEffect } from 'react';

// Registers the service worker so the browser offers "Install" / "Add to Home
// screen". Renders nothing.
export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration failure is non-fatal */
      });
    }
  }, []);
  return null;
}
