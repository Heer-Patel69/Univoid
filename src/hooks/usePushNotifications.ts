import { useCallback, useEffect, useState } from 'react';

const PUSH_ENABLED_KEY = 'push_notifications_enabled';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  link?: string;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
  });
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check support and register service worker
  useEffect(() => {
    const init = async () => {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[Push] Service worker registered:', registration.scope);
          setSwRegistration(registration);
        } catch (error) {
          console.error('[Push] Service worker registration failed:', error);
        }
      }
    };

    init();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(PUSH_ENABLED_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return false;
    }
  }, [isSupported]);

  // Show notification via service worker (works in background)
  const showNotification = useCallback(async (payload: PushNotificationPayload) => {
    if (!isEnabled || permission !== 'granted') return;

    // Check if page is visible - if so, don't show browser notification
    if (document.visibilityState === 'visible') {
      return; // In-app notification will handle it
    }

    try {
      if (swRegistration) {
        // Send to service worker for background notification
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      } else {
        // Fallback to direct notification API
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.jpg',
          tag: 'univoid-notification-' + Date.now()
        });
      }
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  }, [isEnabled, permission, swRegistration]);

  // Toggle push notifications
  const togglePushNotifications = useCallback(async () => {
    if (isEnabled) {
      setIsEnabled(false);
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
    } else {
      const granted = await requestPermission();
      if (granted) {
        setIsEnabled(true);
        localStorage.setItem(PUSH_ENABLED_KEY, 'true');
      }
    }
  }, [isEnabled, requestPermission]);

  return {
    isSupported,
    isEnabled,
    permission,
    requestPermission,
    showNotification,
    togglePushNotifications
  };
};
