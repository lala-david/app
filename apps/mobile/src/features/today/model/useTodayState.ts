import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { useProgress } from '@/entities/progress/model/progressStore';
import { clock } from '@/shared/lib/clock';

import { computeTodayState, type TodayState } from './todayState';

const MINUTE_MS = 60_000;

/** 1분마다·앱으로 돌아올 때 다시 계산해 날짜가 바뀌어도 맞춘다 */
export function useTodayState(): TodayState | null {
  const child = useChild();
  const { routineMap } = useProgress();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), MINUTE_MS);
    const subscription = AppState.addEventListener('change', (s) => s === 'active' && setTick((t) => t + 1));
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return useMemo(
    () => (child ? computeTodayState(getWeek(), child, routineMap, clock.date()) : null),
    // tick 은 시간 경과를 반영하기 위한 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [child, routineMap, tick],
  );
}
