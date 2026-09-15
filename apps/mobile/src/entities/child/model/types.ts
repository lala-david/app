import type { AgeBand } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import type { RoutineSchedule } from '@/entities/schedule/schedule';

export type PhotoFrame = 'none' | 'cloud' | 'star' | 'flower';

export type AvatarConfig =
  | { kind: 'builder'; seed: string; options: Record<string, string> }
  | { kind: 'photo'; dataUri: string; frame: PhotoFrame; backdrop: string };

export interface ChildProfile {
  nickname: string;
  ageBand: AgeBand;
  avatar: AvatarConfig;
  schedules: RoutineSchedule[];
  startDate: DateKey;
  run: number;
  runStartDate: DateKey;
  faithEnabled: boolean;
  notificationsEnabled: boolean;
  eveningReminder: boolean;
  onboardingDone: boolean;
}
