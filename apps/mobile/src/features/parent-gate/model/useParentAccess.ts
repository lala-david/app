import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { clock } from '@/shared/lib/clock';

import { useGateStore } from './gateStore';

/** 부모 화면에 들어올 때마다 확인. 거절하면 홈으로 돌려보낸다 */
export function useParentAccess(): boolean {
  const router = useRouter();
  const [granted, setGranted] = useState(() => clock.now() < useGateStore.getState().unlockedUntil);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (clock.now() < useGateStore.getState().unlockedUntil) {
        setGranted(true);
        return;
      }
      setGranted(false);
      void useGateStore
        .getState()
        .request()
        .then((ok) => {
          if (!active) return;
          if (ok) setGranted(true);
          else router.navigate('/home');
        });
      return () => {
        active = false;
      };
    }, [router]),
  );

  return granted;
}
