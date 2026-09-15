import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { clock } from '@/shared/lib/clock';

const TICK_MS = 1000;

/** 시연용 시간 배속. 기본 1 (EXPO_PUBLIC_LISTEN_TIME_SCALE=60 이면 1분이 1초) */
const TIME_SCALE = Math.max(1, Number(process.env.EXPO_PUBLIC_LISTEN_TIME_SCALE ?? 1) || 1);

export interface ListenTimer {
  started: boolean;
  elapsedSec: number;
  remainingSec: number;
  progress: number;
  reached: boolean;
  /** 실제 벽시계 기준으로 목표까지 남은 초 (알림 예약용) */
  realRemainingSec: number;
}

export function useListenTimer(startedAt: number | null, targetMinutes: number): ListenTimer {
  const [now, setNow] = useState(clock.now());

  useEffect(() => {
    if (startedAt == null) return;
    setNow(clock.now());
    const timer = setInterval(() => setNow(clock.now()), TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && setNow(clock.now()));
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [startedAt]);

  const targetSec = targetMinutes * 60;
  const realElapsed = startedAt == null ? 0 : Math.max(0, (now - startedAt) / 1000);
  const elapsedSec = realElapsed * TIME_SCALE;
  const remainingSec = Math.max(0, targetSec - elapsedSec);

  return {
    started: startedAt != null,
    elapsedSec,
    remainingSec,
    progress: Math.min(1, elapsedSec / targetSec),
    reached: startedAt != null && elapsedSec >= targetSec,
    realRemainingSec: Math.ceil(remainingSec / TIME_SCALE),
  };
}

/** false → true 로 바뀌는 순간 한 번 실행 */
export function useOnBecomeTrue(value: boolean, effect: () => void) {
  const previous = useRef(value);
  useEffect(() => {
    if (value && !previous.current) effect();
    previous.current = value;
  }, [value, effect]);
}
