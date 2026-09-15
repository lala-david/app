import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { useProgress } from '@/entities/progress/model/progressStore';
import { clock } from '@/shared/lib/clock';

import { computeCourseState, type CourseState } from './courseState';

const MINUTE_MS = 60_000;

/** 1분마다·앱 복귀 시 다시 계산해 날짜가 바뀌어도 맞춘다 */
export function useCourseState(): CourseState | null {
  const child = useChild();
  const { recordMap } = useProgress();
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
    () => (child ? computeCourseState(getWeek(), child, recordMap, clock.date()) : null),
    // tick은 시간 경과를 반영하기 위한 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [child, recordMap, tick],
  );
}
