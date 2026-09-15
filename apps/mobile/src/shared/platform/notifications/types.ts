export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface NotificationContent {
  title: string;
  body: string;
  /** 알림을 눌렀을 때 열 앱 경로 (예: /home?lesson=r1-d1-morning) */
  url: string;
}

export interface UpcomingNotification extends NotificationContent {
  id: string;
  at: Date;
}

export interface NotificationScheduler {
  getPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  /** 예약된 루틴 알림을 모두 지우고 새 목록으로 바꾼다 */
  replaceUpcoming(items: UpcomingNotification[]): Promise<void>;
  scheduleIn(id: string, seconds: number, content: NotificationContent): Promise<void>;
  cancel(id: string): Promise<void>;
  onOpen(listener: (url: string) => void): () => void;
  /** iOS 웹처럼 홈 화면 추가가 먼저 필요한 환경인지 */
  requiresInstall(): boolean;
}
