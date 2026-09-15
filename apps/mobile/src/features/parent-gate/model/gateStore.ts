import { create } from 'zustand';

import { config } from '@/entities/content/content';
import { clock } from '@/shared/lib/clock';
import { motion } from '@/shared/theme/tokens';

interface GateState {
  open: boolean;
  unlockedUntil: number;
  pending: ((granted: boolean) => void) | null;
  request: () => Promise<boolean>;
  settle: (granted: boolean) => void;
}

export const useGateStore = create<GateState>((set, get) => ({
  open: false,
  unlockedUntil: 0,
  pending: null,

  request: () => {
    if (clock.now() < get().unlockedUntil) return Promise.resolve(true);
    return new Promise((resolve) => {
      get().pending?.(false);
      set({ open: true, pending: resolve });
    });
  },

  settle: (granted) => {
    const pending = get().pending;
    set({
      open: false,
      pending: null,
      unlockedUntil: granted ? clock.now() + config.parentGate.unlockMinutes * 60_000 : get().unlockedUntil,
    });
    // 게이트 시트가 닫힌 뒤에 알려야, 이어서 여는 팝업이 닫히는 시트 아래에 깔리지 않는다
    if (pending) setTimeout(() => pending(granted), motion.base);
  },
}));

/** 부모 전용 동작 전에 호출. 확인되면 true */
export const requireParent = () => useGateStore.getState().request();
