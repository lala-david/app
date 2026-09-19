import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { useProgress } from '@/entities/progress/model/progressStore';
import { track } from '@/shared/analytics/analytics';
import { clock } from '@/shared/lib/clock';
import { notificationScheduler } from '@/shared/platform/notifications';

import { buildUpcoming } from '../model/buildUpcoming';

const DEBOUNCE_MS = 600;

/** 프로필·기록이 바뀌거나 앱으로 돌아올 때 예약 알림을 다시 맞추고, 알림을 누르면 해당 화면을 연다 */
export function NotificationBridge() {
  const router = useRouter();
  const child = useChild();
  const { routineMap } = useProgress();
  const [foreground, setForeground] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (s) => s === 'active' && setForeground((t) => t + 1));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!child?.onboardingDone) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const permission = await notificationScheduler.getPermission();
      if (cancelled) return;
      const items = child.notificationsEnabled && permission === 'granted' ? buildUpcoming({ week: getWeek(), child, routineMap, now: clock.date() }) : [];
      await notificationScheduler.replaceUpcoming(items);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [child, routineMap, foreground]);

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
