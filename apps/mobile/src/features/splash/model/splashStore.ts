import { create } from 'zustand';

interface SplashState {
  visible: boolean;
  dismiss: () => void;
  replay: () => void;
}

/** 스플래시는 앱을 켤 때마다 보이고, 설정의 ‘앱 소개 다시 보기’로 다시 볼 수 있다 */
export const useSplash = create<SplashState>((set) => ({
  visible: true,
  dismiss: () => set({ visible: false }),
  replay: () => set({ visible: true }),
}));
