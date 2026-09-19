import type { AgeBand, CharacterKey } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import type { RoutineSchedule } from '@/entities/schedule/schedule';

/** 아이 프로필 그림: 캐릭터 4명 중 하나, 또는 기기에만 저장되는 사진 */
export type Avatar = { kind: 'character'; character: CharacterKey } | { kind: 'photo'; dataUri: string };

export interface ChildProfile {
  nickname: string;
  ageBand: AgeBand;
  avatar: Avatar;
  schedules: RoutineSchedule[];
  /** 학습 시작일 = Day 1 */
  startDate: DateKey;
  run: number;
  runStartDate: DateKey;
  faithEnabled: boolean;
  notificationsEnabled: boolean;
  eveningReminder: boolean;
  onboardingDone: boolean;
}
