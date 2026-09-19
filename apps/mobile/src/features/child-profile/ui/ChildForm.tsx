import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Avatar } from '@/entities/child/model/types';
import { ageBands, characters, config } from '@/entities/content/content';
import type { AgeBand } from '@/entities/content/types';
import { addDays, type DateKey } from '@/entities/course/calendar';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt, shortDate } from '@/shared/lib/format';
import { pickSquarePhoto } from '@/shared/platform/photo';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Chip, TextField } from '@/shared/ui/Form';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, tones } from '@/shared/theme/tokens';

export interface ChildFormValue {
  nickname: string;
  ageBand: AgeBand;
  avatar: Avatar;
  startDate: DateKey;
}

interface Props {
  value: ChildFormValue;
  onChange: (value: ChildFormValue) => void;
  nicknameError: string | null;
  today: DateKey;
  /** 이미 시작한 뒤에는 시작일을 바꾸지 않는다 */
  lockStartDate?: boolean;
}

const AVATAR = 68;
const CHARACTER_TONES = [tones.morning, tones.theme, tones.dinner, tones.bedtime];

export function AvatarView({ avatar, size }: { avatar: Avatar; size: number }) {
  if (avatar.kind === 'photo') return <Image source={{ uri: avatar.dataUri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return <Character name={avatar.character} size={size} />;
}

/** 아이 정보: 이름, 연령, 함께할 친구(캐릭터 4명 또는 사진), 학습 시작일 */
export function ChildForm({ value, onChange, nicknameError, today, lockStartDate }: Props) {
  const [picking, setPicking] = useState(false);
  const dates = Array.from({ length: config.startDateMaxOffsetDays + 1 }, (_, i) => addDays(today, i));

  const pickPhoto = async () => {
    setPicking(true);
    const result = await pickSquarePhoto(config.photo.size, config.photo.quality);
    setPicking(false);
    if (result.ok) onChange({ ...value, avatar: { kind: 'photo', dataUri: result.dataUri } });
    else if (result.reason === 'denied') toast(strings.child.photoDenied);
  };

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <AppText variant="label" color={colors.inkSoft}>
          {strings.child.avatar}
        </AppText>
        <View style={styles.avatars} accessibilityRole="radiogroup">
          {characters.map((character, i) => {
            const on = value.avatar.kind === 'character' && value.avatar.character === character;
            const tone = CHARACTER_TONES[i % CHARACTER_TONES.length];
            return (
              <Pressy key={character} onPress={() => onChange({ ...value, avatar: { kind: 'character', character } })} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={strings.child.characters[character]} style={[styles.avatar, { backgroundColor: tone.p, borderColor: on ? tone.c : 'transparent' }]}>
                <Character name={character} size={AVATAR - 14} />
              </Pressy>
            );
          })}
          <Pressy onPress={pickPhoto} disabled={picking} accessibilityRole="radio" accessibilityState={{ selected: value.avatar.kind === 'photo' }} accessibilityLabel={strings.child.photo} style={[styles.avatar, styles.photo, value.avatar.kind === 'photo' && { borderColor: colors.brand, borderStyle: 'solid' }]}>
            {value.avatar.kind === 'photo' ? <AvatarView avatar={value.avatar} size={AVATAR - 8} /> : <Icon name="camera" size={26} color={colors.inkMuted} />}
          </Pressy>
        </View>
        {value.avatar.kind === 'photo' ? (
          <AppText variant="caption" color={colors.inkMuted}>
            {strings.child.photoNote}
          </AppText>
        ) : null}
      </View>

      <TextField nativeID="child-nickname" label={strings.child.nickname} placeholder={strings.child.nicknamePlaceholder} value={value.nickname} maxLength={config.nicknameMaxLength} onChangeText={(nickname) => onChange({ ...value, nickname })} error={nicknameError} returnKeyType="done" />

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkSoft}>
          {strings.child.age}
        </AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {ageBands.map((band) => (
            <Chip key={band} label={fmt(strings.child.ageOption, { age: band })} selected={value.ageBand === band} onPress={() => onChange({ ...value, ageBand: band })} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.inkSoft}>
          {strings.child.startDate}
        </AppText>
        {lockStartDate ? (
          <AppText variant="bodyStrong">{shortDate(value.startDate)}</AppText>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>
            {dates.map((date, i) => (
              <Chip key={date} label={i === 0 ? strings.child.today : i === 1 ? strings.child.tomorrow : shortDate(date)} selected={value.startDate === date} onPress={() => onChange({ ...value, startDate: date })} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 22 },
  section: { gap: 10 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: radius.xl, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  photo: { backgroundColor: colors.surface, borderColor: colors.dashed, borderStyle: 'dashed', borderWidth: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dates: { gap: 8, paddingVertical: 2 },
});
