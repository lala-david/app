import { useRouter } from 'expo-router';
import { useState } from 'react';

import { updateChild, useChild } from '@/entities/child/model/childStore';
import type { AgeBand } from '@/entities/content/types';
import { ChildProfileForm } from '@/features/child-profile/ui/ChildProfileForm';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { TopBar } from '@/shared/ui/TopBar';

export function ManageChildScreen() {
  const router = useRouter();
  const child = useChild();
  const [nickname, setNickname] = useState(child?.nickname ?? '');
  const [ageBand, setAgeBand] = useState<AgeBand | undefined>(child?.ageBand);
  const [error, setError] = useState<string | null>(null);

  if (!child || !ageBand) return null;

  const save = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return setError(strings.child.nicknameRequired);
    updateChild({ nickname: trimmed, ageBand });
    toast(strings.settings.saved);
    router.back();
  };

  return (
    <Screen
      mode="parent"
      scroll
      keyboard
      header={<TopBar title={strings.settings.child} onLeftPress={() => router.back()} />}
      footer={<BigButton label={strings.common.save} onPress={save} />}
    >
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
        onDecorate={() => router.push('/manage/avatar')}
        onPhoto={() => router.push('/manage/photo')}
      />
    </Screen>
  );
}
