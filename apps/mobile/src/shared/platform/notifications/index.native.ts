import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';

import type { NotificationPermission, NotificationScheduler, UpcomingNotification } from './types';

export * from './types';

const CHANNEL_ID = 'routines';
const ROUTINE_KIND = 'routine';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: strings.notifications.channelName,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function mapStatus(status: Notifications.PermissionStatus): NotificationPermission {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export const notificationScheduler: NotificationScheduler = {
  async getPermission() {
    return mapStatus((await Notifications.getPermissionsAsync()).status);
  },

  async requestPermission() {
    await ensureChannel();
    const result = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return mapStatus(result.status);
  },

  async replaceUpcoming(items: UpcomingNotification[]) {
    await ensureChannel();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === ROUTINE_KIND)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    const now = Date.now();
    await Promise.all(
      items
        .filter((item) => item.at.getTime() > now)
        .map((item) =>
          Notifications.scheduleNotificationAsync({
            identifier: item.id,
            content: { title: item.title, body: item.body, data: { url: item.url, kind: ROUTINE_KIND } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.at, channelId: CHANNEL_ID },
          }),
        ),
    );
  },

  async scheduleIn(id, seconds, content) {
    await ensureChannel();
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title: content.title, body: content.body, data: { url: content.url, kind: 'oneoff' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, seconds), channelId: CHANNEL_ID },
    });
  },

  async cancel(id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  },

  onOpen(listener) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') listener(url);
    });
    return () => subscription.remove();
  },

  requiresInstall: () => false,
};
