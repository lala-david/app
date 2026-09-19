import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { elapsedSec } from '@/entities/progress/lib/progress';
import type { RoutineRecord } from '@/entities/progress/model/types';
import { clock } from '@/shared/lib/clock';

/** 시연용 시간 배속. 기본 1 (EXPO_PUBLIC_LISTEN_TIME_SCALE=60 이면 1분이 1초) */
export const TIME_SCALE = Math.max(1, Number(process.env.EXPO_PUBLIC_LISTEN_TIME_SCALE ?? 1) || 1);

export interface RoutineTimer {
  running: boolean;
  started: boolean;
  elapsed: number;
  target: number;
  progress: number;
  reached: boolean;
}

/** 기록의 시작 시각으로 계산하므로 유튜브로 나갔다 와도 시간이 이어진다 */
export function useRoutineTimer(record: RoutineRecord | undefined, targetMinutes: number): RoutineTimer {
  const [now, setNow] = useState(clock.now());
  const running = record?.runningSince != null;

  useEffect(() => {
    setNow(clock.now());
    if (!running) return;
    const timer = setInterval(() => setNow(clock.now()), 1000);
    const subscription = AppState.addEventListener('change', (s) => s === 'active' && setNow(clock.now()));
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [running]);

  const target = targetMinutes * 60;
  const elapsed = Math.min(target, elapsedSec(record, now) * TIME_SCALE);

  return { running, started: running || (record?.accumulatedSec ?? 0) > 0, elapsed, target, progress: elapsed / target, reached: elapsed >= target };
}
