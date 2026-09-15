import { useRouter } from 'expo-router';
import { useState } from 'react';

import { updateAvatar, useChild } from '@/entities/child/model/childStore';
import { playMascot } from '@/entities/content/voice';
import { randomSelection } from '@/features/avatar/lib/avatarOptions';
import { AvatarBuilder } from '@/features/avatar/ui/AvatarBuilder';
import { track } from '@/shared/analytics/analytics';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { TopBar } from '@/shared/ui/TopBar';

export function AvatarEditScreen() {
  const router = useRouter();
  const avatar = useChild()?.avatar;
  const [seed] = useState(() => (avatar?.kind === 'builder' ? avatar.seed : String(clock.now())));
  const [selection, setSelection] = useState(() => (avatar?.kind === 'builder' && Object.keys(avatar.options).length ? avatar.options : randomSelection(clock.now())));

  const save = () => {
    updateAvatar({ kind: 'builder', seed, options: selection });
    playMascot('avatar-saved');
    track('avatar_saved', { kind: 'builder' });
    router.back();
  };

  return (
    <Screen
      padded={false}
      header={<TopBar title={strings.avatar.title} onLeftPress={() => router.back()} leftIcon="close" />}
      footer={<BigButton label={strings.common.save} size="child" onPress={save} />}
    >
      <AvatarBuilder seed={seed} selection={selection} onChange={setSelection} />
    </Screen>
  );
}
