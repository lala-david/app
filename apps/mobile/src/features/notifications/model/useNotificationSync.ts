import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { useProgress } from '@/entities/progress/model/progressStore';
import { clock } from '@/shared/lib/clock';
import { notificationScheduler } from '@/shared/platform/notifications';

import { buildUpcoming } from './buildUpcoming';

const DEBOUNCE_MS = 600;

/** 프로필·기록이 바뀌거나 앱으로 돌아올 때 예약 알림을 다시 맞춘다 */
export function useNotificationSync() {
  const child = useChild();
  const { recordMap } = useProgress();
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundTick((t) => t + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!child?.onboardingDone) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      const permission = await notificationScheduler.getPermission();
      if (cancelled) return;
      const items =
        child.notificationsEnabled && permission === 'granted'
          ? buildUpcoming({ week: getWeek(), child, records: recordMap, now: clock.date() })
          : [];
      await notificationScheduler.replaceUpcoming(items);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [child, recordMap, foregroundTick]);
}
