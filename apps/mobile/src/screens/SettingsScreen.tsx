import { useRouter } from 'expo-router';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { useAccountStore } from '@/entities/account/model/accountStore';
import { updateChild, useChild } from '@/entities/child/model/childStore';
import { config, getWeek } from '@/entities/content/content';
import { useSession } from '@/entities/session/model/sessionStore';
import { deleteAccount, logOut } from '@/features/auth/model/authActions';
import { useHelpStore } from '@/features/help/ui/HelpCards';
import { SettingsGroup, SettingsRow } from '@/features/settings/ui/SettingsParts';
import { useSplash } from '@/features/splash/model/splashStore';
import { confirmDialog, toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { mailto, openExternal } from '@/shared/platform/links';
import { notificationScheduler } from '@/shared/platform/notifications';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { colors, sizes } from '@/shared/theme/tokens';

/** 알림을 켤 때 기기 권한을 확인한다. 거절돼 있으면 방법을 안내한다 */
async function ensureNotificationPermission(): Promise<boolean> {
  if (notificationScheduler.requiresInstall()) {
    toast(strings.settings.iosInstall);
    return false;
  }
  const current = await notificationScheduler.getPermission();
  const result = current === 'undetermined' ? await notificationScheduler.requestPermission() : current;
  if (result === 'granted') return true;
  toast(result === 'unsupported' ? strings.settings.unsupported : strings.settings.permissionDenied);
  if (result === 'denied' && Platform.OS !== 'web') void Linking.openSettings();
  return false;
}

/** 시안 04 · 설정 */
export function SettingsScreen() {
  const router = useRouter();
  const child = useChild();
  const userId = useSession((s) => s.userId);
  const email = useAccountStore((s) => Object.values(s.accounts).find((a) => a.id === userId)?.email);
  const replaySplash = useSplash((s) => s.replay);
  const resetHelp = useHelpStore((s) => s.reset);

  if (!child) return null;

  const toggleNotifications = async () => {
    if (child.notificationsEnabled) return updateChild({ notificationsEnabled: false });
    if (await ensureNotificationPermission()) updateChild({ notificationsEnabled: true });
  };

  const toggleFaith = async () => {
    if (child.faithEnabled) return updateChild({ faithEnabled: false });
    const { faithDialog } = strings.settings;
    if (await confirmDialog({ title: faithDialog.title, body: faithDialog.body, confirmLabel: faithDialog.confirm, cancelLabel: strings.common.cancel })) updateChild({ faithEnabled: true });
  };

  const confirmLogout = async () => {
    if (await confirmDialog({ title: strings.settings.logoutDialog.title, confirmLabel: strings.settings.logoutDialog.confirm, cancelLabel: strings.common.cancel })) await logOut();
  };

  const confirmDelete = async () => {
    const { deleteDialog } = strings.settings;
    const ok = await confirmDialog({ title: deleteDialog.title, body: fmt(deleteDialog.body, { keyword: deleteDialog.keyword }), confirmLabel: deleteDialog.confirm, cancelLabel: strings.common.cancel, tone: 'danger', typeToConfirm: deleteDialog.keyword });
    if (ok) await deleteAccount();
  };

  return (
    <Screen withNav ground={colors.groundSettings} paddingX={sizes.parentPaddingX}>
      <AppText variant="micro" color={colors.settingsSoft} style={styles.eyebrow}>
        {strings.settings.eyebrow}
      </AppText>
      <AppText variant="pageTitle" color={colors.settingsInk} style={styles.title}>
        {strings.settings.title}
      </AppText>

      <SettingsGroup title={strings.settings.learning} kind="detail">
        <SettingsRow icon="bell" title={strings.settings.notifications} desc={strings.settings.notificationsDesc} toggle={child.notificationsEnabled} onPress={toggleNotifications} />
        <SettingsRow icon="clock" title={strings.settings.notificationTimes} desc={strings.settings.notificationTimesDesc} onPress={() => router.push('/manage/notifications')} />
        <SettingsRow icon="moon" title={strings.settings.eveningReminder} desc={strings.settings.eveningReminderDesc} toggle={child.eveningReminder} onPress={() => updateChild({ eveningReminder: !child.eveningReminder })} />
        <SettingsRow icon="user" title={strings.settings.child} desc={strings.settings.childDesc} onPress={() => router.push('/manage/child')} />
        <SettingsRow icon="heart" title={strings.settings.faith} desc={strings.settings.faithDesc} toggle={child.faithEnabled} onPress={toggleFaith} />
      </SettingsGroup>

      <SettingsGroup title={strings.settings.guideSection} kind="plain">
        <SettingsRow icon="book" title={strings.settings.guidebook} onPress={() => router.push({ pathname: '/manage/guide', params: { tab: 'guide' } })} />
        <SettingsRow icon="help" title={strings.settings.faq} onPress={() => router.push({ pathname: '/manage/guide', params: { tab: 'faq' } })} />
        <SettingsRow icon="image" title={strings.settings.replayIntro} onPress={replaySplash} />
        <SettingsRow
          icon="sparkle"
          title={strings.settings.replayHelp}
          onPress={() => {
            resetHelp();
            router.navigate('/today');
          }}
        />
        <SettingsRow icon="mail" title={strings.settings.contact} onPress={() => void openExternal(mailto(config.links.contactEmail, strings.appName))} />
      </SettingsGroup>

      <SettingsGroup title={strings.settings.accountSection} kind="account">
        <SettingsRow icon="mail" title={email ?? ''} />
        <SettingsRow icon="logout" title={strings.settings.logout} onPress={confirmLogout} />
        <SettingsRow icon="trash" title={strings.settings.deleteAccount} danger onPress={confirmDelete} />
      </SettingsGroup>

      <View style={styles.footer}>
        <AppText variant="microSoft" color={colors.settingsSoft} align="center">
          {fmt(strings.settings.footer, { v: config.appVersion, w: getWeek().week })}
        </AppText>
        <AppText variant="microSoft" color={colors.settingsSoft} align="center" style={styles.link} onPress={() => void openExternal(config.links.privacyPolicy)}>
          {strings.settings.privacy}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { marginTop: 4, marginLeft: 6, letterSpacing: 0.3 },
  title: { marginTop: 5, marginLeft: 7, marginBottom: -13 },
  footer: { paddingTop: 18, paddingBottom: 8, gap: 2 },
  link: { textDecorationLine: 'underline' },
});
