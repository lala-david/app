import { useRouter } from 'expo-router';
import { useState } from 'react';

import { updateAvatar, useChild } from '@/entities/child/model/childStore';
import { playMascot } from '@/entities/content/voice';
import { PhotoEditor, type PhotoValue } from '@/features/avatar/ui/PhotoEditor';
import { track } from '@/shared/analytics/analytics';
import { strings } from '@/shared/i18n/strings.ko';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { TopBar } from '@/shared/ui/TopBar';

export function PhotoEditScreen() {
  const router = useRouter();
  const avatar = useChild()?.avatar;
  const [value, setValue] = useState<PhotoValue | null>(avatar?.kind === 'photo' ? { dataUri: avatar.dataUri, frame: avatar.frame, backdrop: avatar.backdrop } : null);

  const save = () => {
    if (!value) return;
    updateAvatar({ kind: 'photo', ...value });
    playMascot('avatar-saved');
    track('avatar_saved', { kind: 'photo' });
    router.back();
  };

  return (
    <Screen
      mode="parent"
      padded={false}
      header={<TopBar title={strings.photo.title} onLeftPress={() => router.back()} leftIcon="close" />}
      footer={value ? <BigButton label={strings.common.save} onPress={save} /> : undefined}
    >
      <PhotoEditor value={value} onChange={setValue} />
    </Screen>
  );
}
