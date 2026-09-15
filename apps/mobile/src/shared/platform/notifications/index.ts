import type { NotificationScheduler } from './types';

export * from './types';

/** 기본(미지원) 구현. index.native.ts / index.web.ts 가 대신한다 */
export const notificationScheduler: NotificationScheduler = {
  getPermission: async () => 'unsupported',
  requestPermission: async () => 'unsupported',
  replaceUpcoming: async () => undefined,
  scheduleIn: async () => undefined,
  cancel: async () => undefined,
  onOpen: () => () => undefined,
  requiresInstall: () => false,
};
