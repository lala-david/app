import { strings } from '@/shared/i18n/strings.ko';
import { notificationScheduler } from '@/shared/platform/notifications';

const TEST_DELAY_SECONDS = 10;

export async function sendTestNotification(): Promise<void> {
  await notificationScheduler.scheduleIn('test', TEST_DELAY_SECONDS, {
    title: strings.notifications.testTitle,
    body: strings.notifications.testBody,
    url: '/settings/notifications',
  });
}
