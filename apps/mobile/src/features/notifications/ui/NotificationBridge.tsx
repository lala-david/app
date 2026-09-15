import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { track } from '@/shared/analytics/analytics';
import { notificationScheduler } from '@/shared/platform/notifications';

import { useNotificationSync } from '../model/useNotificationSync';

/** 알림 예약 동기화 + 알림을 눌렀을 때 해당 화면으로 이동 */
export function NotificationBridge() {
  const router = useRouter();
  useNotificationSync();

  useEffect(
    () =>
      notificationScheduler.onOpen((url) => {
        track('notification_open', { url });
        router.push(url as Href);
      }),
    [router],
  );

  return null;
}
