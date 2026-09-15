import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { updateChild } from '@/entities/child/model/childStore';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { useNotificationPermission } from '@/features/notifications/model/useNotificationPermission';
import { toast, useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Float } from '@/shared/ui/Motion';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius, shadows, spacing } from '@/shared/theme/tokens';

import { OnboardingHeader } from './OnboardingHeader';

export function OnboardingNotificationsScreen() {
  const router = useRouter();
  const { request, requiresInstall } = useNotificationPermission();
  const [loading, setLoading] = useState(false);

  const finish = () => {
    updateChild({ onboardingDone: true });
    router.replace('/home');
  };

  const enable = async () => {
    if (requiresInstall) {
      const choice = await useFeedbackStore.getState().openDialog({
        title: strings.notifyPermission.iosTitle,
        body: [strings.notifyPermission.iosBody, ...strings.notifyPermission.iosSteps.map((step, i) => `${i + 1}. ${step}`)].join('\n'),
        image: 'guides/add-to-home',
        actions: [
          { label: strings.notifyPermission.iosDone, value: 'done', tone: 'primary' },
          { label: strings.notifyPermission.later, value: 'later', tone: 'ghost' },
        ],
      });
      if (choice !== 'done') return finish();
    }
    setLoading(true);
    const result = await request();
    setLoading(false);
    if (result !== 'granted') toast(result === 'unsupported' ? strings.notifyPermission.unsupported : strings.notifyPermission.denied);
    finish();
  };

  return (
    <Screen
      mode="parent"
      header={<OnboardingHeader step={3} onBack={() => router.back()} />}
      footer={
        <>
          <BigButton label={strings.notifyPermission.enable} onPress={enable} loading={loading} />
          <BigButton label={strings.notifyPermission.later} variant="ghost" onPress={finish} />
        </>
      }
    >
      <View style={styles.body}>
        <Float distance={6}>
          <AssetImage name="guides/notify" size={210} />
        </Float>
        <AppText variant="title" align="center">
          {strings.notifyPermission.title}
        </AppText>
        <AppText variant="body" color="textSoft" align="center">
          {strings.notifyPermission.body}
        </AppText>

        <View style={styles.sample} accessibilityElementsHidden>
          <AssetImage name="routines/routine-morning" size={40} />
          <View style={styles.sampleText}>
            <AppText variant="bodyStrong">{strings.notifyPermission.sampleTitle}</AppText>
            <AppText variant="caption" color="textSoft">
              {strings.notifyPermission.sampleBody}
            </AppText>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    boxShadow: shadows.raised,
    marginTop: spacing.sm,
  },
  sampleText: { flex: 1 },
});
