import { publicPath } from '@/shared/platform/publicPath';

import type { NotificationContent, NotificationPermission, NotificationScheduler, UpcomingNotification } from './types';

export * from './types';

/**
 * 웹 알림: 브라우저 Notification + 서비스워커.
 * 서버 푸시 없이 동작하므로, 앱(탭)이 열려 있거나 백그라운드에 살아 있는 동안 예약 알림이 온다.
 * 앱을 완전히 닫아도 오게 하려면 apps/api 의 Web Push 스케줄러를 연결한다.
 */

const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let registration: Promise<ServiceWorkerRegistration | undefined> | null = null;

const supported = () => typeof window !== 'undefined' && 'Notification' in window;

function getRegistration() {
  if (!registration) {
    registration =
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? navigator.serviceWorker.register(publicPath('sw.js'), { scope: publicPath('') }).catch(() => undefined)
        : Promise.resolve(undefined);
  }
  return registration;
}

async function show(content: NotificationContent) {
  if (!supported() || Notification.permission !== 'granted') return;
  const reg = await getRegistration();
  const options = { body: content.body, icon: publicPath('icons/pwa-192.png'), data: { url: content.url } };
  if (reg) await reg.showNotification(content.title, options);
  else new Notification(content.title, options);
}

function setTimer(id: string, delayMs: number, content: NotificationContent) {
  clearTimer(id);
  if (delayMs < 0 || delayMs > MAX_TIMEOUT_MS) return;
  timers.set(id, setTimeout(() => {
    timers.delete(id);
    void show(content);
  }, delayMs));
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

function mapPermission(): NotificationPermission {
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'default') return 'undetermined';
  return Notification.permission;
}

function isIosBrowserTab(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  return ios && !standalone;
}

export const notificationScheduler: NotificationScheduler = {
  getPermission: async () => mapPermission(),

  async requestPermission() {
    if (!supported()) return 'unsupported';
    await getRegistration();
    await Notification.requestPermission();
    return mapPermission();
  },

  async replaceUpcoming(items: UpcomingNotification[]) {
    [...timers.keys()].filter((id) => id.startsWith('routine:')).forEach(clearTimer);
    const now = Date.now();
    items.forEach((item) => setTimer(item.id, item.at.getTime() - now, item));
  },

  async scheduleIn(id, seconds, content) {
    await getRegistration();
    setTimer(id, seconds * 1000, content);
  },

  async cancel(id) {
    clearTimer(id);
  },

  onOpen(listener) {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => undefined;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'notification-open' && typeof event.data.url === 'string') listener(event.data.url);
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  },

  requiresInstall: () => isIosBrowserTab(),
};
