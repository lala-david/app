import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { createDefaultProfile, updateChild, useChild } from '@/entities/child/model/childStore';
import { compareDateKeys } from '@/entities/course/calendar';
import { ChildForm, type ChildFormValue } from '@/features/child-profile/ui/ChildForm';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { notificationScheduler } from '@/shared/platform/notifications';
import { AppText } from '@/shared/ui/AppText';
import { BackBar, PrimaryButton } from '@/shared/ui/Form';
import { Screen } from '@/shared/ui/Screen';
import { colors } from '@/shared/theme/tokens';

function useChildForm() {
  const child = useChild();
  const today = clock.today();
  const [value, setValue] = useState<ChildFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!child) updateChild(createDefaultProfile());
    else if (!value) setValue({ nickname: child.nickname, ageBand: child.ageBand, avatar: child.avatar, startDate: compareDateKeys(child.startDate, today) < 0 && !child.onboardingDone ? today : child.startDate });
  }, [child, value, today]);

  const validate = (): ChildFormValue | null => {
    if (!value) return null;
    const nickname = value.nickname.trim();
    if (!nickname) {
      setError(strings.child.nicknameRequired);
      return null;
    }
    return { ...value, nickname };
  };

  return { child, today, value, error, validate, onChange: (next: ChildFormValue) => { setValue(next); setError(null); } };
}

/** 가입 직후 한 번: 아이를 소개하고 바로 시작한다 */
export function OnboardingScreen() {
  const router = useRouter();
  const form = useChildForm();
  if (!form.child || !form.value) return null;

  const start = async () => {
    const value = form.validate();
    if (!value) return;
    updateChild({ ...value, runStartDate: value.startDate, onboardingDone: true });
    // 알림은 기본으로 켜져 있다. 권한은 여기서 한 번 묻고, 거절해도 앱은 그대로 쓴다
    if (!notificationScheduler.requiresInstall()) void notificationScheduler.requestPermission();
    router.replace('/today');
  };

  return (
    <Screen footer={<PrimaryButton label={strings.child.start} onPress={start} />}>
      <AppText variant="eyebrow" color={colors.inkMuted}>
        {strings.child.onboardingEyebrow}
      </AppText>
      <AppText variant="screenTitle" style={{ marginTop: 5, marginBottom: 22 }}>
        {strings.child.onboardingTitle}
      </AppText>
      <ChildForm value={form.value} onChange={form.onChange} nicknameError={form.error} today={form.today} />
    </Screen>
  );
}

/** 설정 › 아이 정보 */
export function ManageChildScreen() {
  const router = useRouter();
  const form = useChildForm();
  if (!form.child || !form.value) return null;
  const started = compareDateKeys(form.child.startDate, form.today) <= 0;

  const save = () => {
    const value = form.validate();
    if (!value) return;
    updateChild(started ? { nickname: value.nickname, ageBand: value.ageBand, avatar: value.avatar } : { ...value, runStartDate: value.startDate });
    toast(strings.child.saved);
    router.back();
  };

  return (
    <Screen ground={colors.groundParent} footer={<PrimaryButton label={strings.common.save} onPress={save} />}>
      <BackBar title={strings.child.title} onBack={() => router.back()} />
      <View>
        <ChildForm value={form.value} onChange={form.onChange} nicknameError={form.error} today={form.today} lockStartDate={started} />
      </View>
    </Screen>
  );
}
