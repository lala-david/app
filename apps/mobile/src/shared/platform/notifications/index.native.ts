import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';

import type { NotificationPermission, NotificationScheduler, UpcomingNotification } from './types';

export * from './types';

const CHANNEL_ID = 'routines';
const ROUTINE_KIND = 'routine';
const CATEGORY_ID = 'routine';
const DEFAULT_COLOR = '#35AD86';
/** 빌드에 들어 있는 drawable 이름 (plugins/withNotificationArt) */
const artResource = (art?: string) => (art ? `notif_${art}` : undefined);

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
    vibrationPattern: [0, 180, 120, 180],
    lightColor: DEFAULT_COLOR,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    showBadge: false,
  });
  // 알림에 ‘지금 시작’ 버튼을 단다. 누르면 앱이 열리며 그 루틴 시트로 간다
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [{ identifier: 'start', buttonTitle: strings.notifications.actionStart, options: { opensAppToForeground: true } }]);
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
            content: { title: item.title, body: item.body, color: item.color ?? DEFAULT_COLOR, categoryIdentifier: CATEGORY_ID, sound: true, data: { url: item.url, kind: ROUTINE_KIND, largeIcon: artResource(item.art) } },
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
      content: { title: content.title, body: content.body, color: content.color ?? DEFAULT_COLOR, sound: true, data: { url: content.url, kind: 'oneoff', largeIcon: artResource(content.art) } },
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
