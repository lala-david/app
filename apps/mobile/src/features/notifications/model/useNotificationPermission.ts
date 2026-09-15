import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { notificationScheduler, type NotificationPermission } from '@/shared/platform/notifications';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'loading'>('loading');

  const refresh = useCallback(async () => {
    setPermission(await notificationScheduler.getPermission());
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && void refresh());
    return () => subscription.remove();
  }, [refresh]);

  const request = useCallback(async () => {
    const next = await notificationScheduler.requestPermission();
    setPermission(next);
    return next;
  }, []);

  return { permission, refresh, request, requiresInstall: notificationScheduler.requiresInstall() };
}
