import { toDateKey, type DateKey } from '@/entities/course/calendar';

/** 시간 의존 코드를 한곳으로 모은다 (테스트·시연 시 교체 가능) */
let nowProvider: () => number = () => Date.now();

export const clock = {
  now: () => nowProvider(),
  today: (): DateKey => toDateKey(new Date(nowProvider())),
  date: () => new Date(nowProvider()),
  override(provider: () => number) {
    nowProvider = provider;
  },
};
