import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { updateChild, useChild } from '@/entities/child/model/childStore';
import { config, getWeek } from '@/entities/content/content';
import { dayIndexOf } from '@/entities/course/course';
import { useGuideStore } from '@/entities/guide/model/guideStore';
import { useAccountStore } from '@/entities/account/model/accountStore';
import { useSession } from '@/entities/session/model/sessionStore';
import { deleteAccount, logOut } from '@/features/auth/model/authActions';
import { ChildAvatar } from '@/features/avatar/ui/ChildAvatar';
import { CardsGuide } from '@/features/guides/ui/CardsGuide';
import { sendTestNotification } from '@/features/notifications/model/sendTestNotification';
import { useNotificationPermission } from '@/features/notifications/model/useNotificationPermission';
import { useParentAccess } from '@/features/parent-gate/model/useParentAccess';
import { confirmDialog, toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt } from '@/shared/lib/format';
import { mailto, openExternal } from '@/shared/platform/links';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { ListDivider, ListRow, SwitchRow } from '@/shared/ui/ListRow';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius, spacing } from '@/shared/theme/tokens';

import { LockedPlaceholder } from '../parent/LockedPlaceholder';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color="textSoft" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const granted = useParentAccess();
  const child = useChild();
  const userId = useSession((s) => s.userId);
  const email = useAccountStore((s) => Object.values(s.accounts).find((a) => a.id === userId)?.email);
  const resetGuides = useGuideStore((s) => s.reset);
  const { permission, request } = useNotificationPermission();

  if (!granted) return <LockedPlaceholder />;
  if (!child) return null;

  const dayIndex = Math.max(1, dayIndexOf(child.runStartDate, clock.today()));
  const permissionOff = permission === 'denied' || permission === 'undetermined';

  const enableNotifications = async () => {
    const result = permission === 'denied' ? 'denied' : await request();
    if (result === 'granted') return;
    if (Platform.OS !== 'web') void Linking.openSettings();
    else toast(result === 'unsupported' ? strings.notifyPermission.unsupported : strings.notifyPermission.denied);
  };

  const toggleFaith = async (enabled: boolean) => {
    if (enabled) {
      const ok = await confirmDialog({
        title: strings.settings.faithDialog.title,
        body: strings.settings.faithDialog.body,
        confirmLabel: strings.settings.faithDialog.confirm,
        cancelLabel: strings.common.cancel,
        image: 'stickers/sticker-note',
      });
      if (!ok) return;
    }
    updateChild({ faithEnabled: enabled });
  };

  const confirmLogout = async () => {
    const ok = await confirmDialog({ title: strings.settings.logoutDialog.title, confirmLabel: strings.settings.logoutDialog.confirm, cancelLabel: strings.common.cancel });
    if (ok) await logOut();
  };

  const confirmDelete = async () => {
    const keyword = strings.settings.deleteDialog.keyword;
    const ok = await confirmDialog({
      title: strings.settings.deleteDialog.title,
      body: fmt(strings.settings.deleteDialog.body, { keyword }),
      confirmLabel: strings.settings.deleteDialog.confirm,
      cancelLabel: strings.common.cancel,
      tone: 'danger',
      typeToConfirm: keyword,
    });
    if (ok) await deleteAccount();
  };

  return (
    <Screen mode="parent" scroll edges={['top']}>
      <CardsGuide id="settings" />
      <AppText variant="title" style={styles.title}>
        {strings.settings.title}
      </AppText>

      <Section title={strings.settings.child}>
        <ListRow
          title={child.nickname}
          subtitle={`${fmt(strings.child.ageOption, { age: child.ageBand })} · ${fmt(strings.settings.dayProgress, { n: dayIndex })}`}
          leading={<ChildAvatar avatar={child.avatar} size={52} />}
          onPress={() => router.push('/manage/child')}
        />
      </Section>

      <Section title={strings.settings.notifications}>
        {permissionOff ? (
          <View style={styles.permission}>
            <AppText variant="body" color="danger">
              {strings.settings.permissionOff}
            </AppText>
            <BigButton label={strings.settings.enableNotifications} size="compact" onPress={enableNotifications} />
          </View>
        ) : null}
        <SwitchRow title={strings.settings.notificationsAll} icon="bell" value={child.notificationsEnabled} onChange={(v) => updateChild({ notificationsEnabled: v })} />
        <ListDivider />
        <ListRow title={strings.settings.routineTimes} icon="clock" onPress={() => router.push('/manage/notifications')} />
        <ListDivider />
        <SwitchRow title={strings.settings.eveningReminder} subtitle={strings.settings.eveningReminderDesc} icon="bell" value={child.eveningReminder} onChange={(v) => updateChild({ eveningReminder: v })} />
        <ListDivider />
        <ListRow
          title={strings.settings.test}
          icon="sparkle"
          chevron={false}
          onPress={async () => {
            await sendTestNotification();
            toast(strings.settings.testSent);
          }}
        />
      </Section>

      <Section title={strings.settings.weekend}>
        <SwitchRow title={strings.settings.faith} subtitle={strings.settings.faithDesc} icon="heart" value={child.faithEnabled} onChange={toggleFaith} />
      </Section>

      <Section title={strings.settings.help}>
        <ListRow title={strings.settings.guidebook} icon="book" onPress={() => router.push({ pathname: '/manage/help', params: { tab: 'guide' } })} />
        <ListDivider />
        <ListRow title={strings.settings.faq} icon="book" onPress={() => router.push({ pathname: '/manage/help', params: { tab: 'faq' } })} />
        <ListDivider />
        <ListRow title={strings.settings.replayIntro} icon="image" onPress={() => router.push('/manage/intro')} />
        <ListDivider />
        <ListRow
          title={strings.settings.resetGuides}
          icon="sparkle"
          chevron={false}
          onPress={() => {
            resetGuides();
            toast(strings.settings.resetGuidesDone);
          }}
        />
        <ListDivider />
        <ListRow title={strings.settings.contact} icon="mail" onPress={() => void openExternal(mailto(config.links.contactEmail, strings.appName))} />
      </Section>

      <Section title={strings.settings.account}>
        {email ? <ListRow title={email} icon="mail" chevron={false} /> : null}
        <ListDivider />
        <ListRow title={strings.settings.logout} icon="logout" onPress={confirmLogout} chevron={false} />
        <ListDivider />
        <ListRow title={strings.settings.deleteAccount} icon="trash" danger onPress={confirmDelete} chevron={false} />
      </Section>

      <View style={styles.footer}>
        <AppText variant="caption" color="textMuted" align="center">
          {fmt(strings.settings.version, { v: Constants.expoConfig?.version ?? '' })} · Week {getWeek().week}
        </AppText>
        <AppText variant="caption" color="textMuted" align="center" onPress={() => void openExternal(config.links.privacyPolicy)} style={styles.link}>
          {strings.settings.privacy}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingVertical: spacing.sm },
  section: { gap: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { paddingHorizontal: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  permission: { gap: spacing.xs, paddingVertical: spacing.sm },
  footer: { gap: 4, paddingBottom: spacing.xl },
  link: { textDecorationLine: 'underline' },
});
