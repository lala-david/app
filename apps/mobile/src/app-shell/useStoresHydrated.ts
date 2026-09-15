import { useEffect, useState } from 'react';

import { useAccountStore } from '@/entities/account/model/accountStore';
import { useChildStore } from '@/entities/child/model/childStore';
import { useGuideStore } from '@/entities/guide/model/guideStore';
import { useProgressStore } from '@/entities/progress/model/progressStore';
import { useSession } from '@/entities/session/model/sessionStore';
import { useAnalytics } from '@/shared/analytics/analytics';

const persistedStores = [useSession, useAccountStore, useChildStore, useProgressStore, useGuideStore, useAnalytics];

const allHydrated = () => persistedStores.every((store) => store.persist.hasHydrated());

/** 기기에 저장된 데이터를 모두 불러온 뒤에 화면을 그린다 */
export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    const unsubscribes = persistedStores.map((store) => store.persist.onFinishHydration(() => setHydrated(allHydrated())));
    setHydrated(allHydrated());
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  return hydrated;
}
