import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandler } from "@/services/errorLoggingService";

// Set up global error handler for uncaught errors
setupGlobalErrorHandler();

// Register service worker for caching and offline support
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - activate it
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    } catch {
      // Service worker registration failed silently
    }
  }
};

// Register SW after app loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', registerServiceWorker);
}

createRoot(document.getElementById("root")!).render(<App />);