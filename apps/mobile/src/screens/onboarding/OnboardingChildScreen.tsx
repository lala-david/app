import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { createDefaultProfile, updateChild, useChild } from '@/entities/child/model/childStore';
import type { AgeBand } from '@/entities/content/types';
import { ChildProfileForm } from '@/features/child-profile/ui/ChildProfileForm';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { spacing } from '@/shared/theme/tokens';

import { OnboardingHeader } from './OnboardingHeader';

export function OnboardingChildScreen() {
  const router = useRouter();
  const child = useChild();
  const [nickname, setNickname] = useState(child?.nickname ?? '');
  const [ageBand, setAgeBand] = useState<AgeBand>(child?.ageBand ?? createDefaultProfile().ageBand);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!child) updateChild(createDefaultProfile());
  }, [child]);

  if (!child) return null;

  const next = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return setError(strings.child.nicknameRequired);
    updateChild({ nickname: trimmed, ageBand });
    router.push('/onboarding/schedule');
  };

  return (
    <Screen
      mode="parent"
      scroll
      keyboard
      header={<OnboardingHeader step={1} />}
      footer={<BigButton label={strings.common.next} onPress={next} />}
    >
      <View style={styles.head}>
        <AppText variant="title">{strings.child.title}</AppText>
        <AppText variant="body" color="textSoft">
          {strings.child.subtitle}
        </AppText>
      </View>
      <ChildProfileForm
        avatar={child.avatar}
        nickname={nickname}
        ageBand={ageBand}
        nicknameError={error}
        onNicknameChange={(value) => {
          setNickname(value);
          setError(null);
        }}
        onAgeChange={setAgeBand}
        onDecorate={() => router.push('/onboarding/avatar')}
        onPhoto={() => router.push('/onboarding/photo')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xxs, marginBottom: spacing.lg, marginTop: spacing.xs },
});
