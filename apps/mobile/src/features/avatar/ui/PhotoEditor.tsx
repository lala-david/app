import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import avatarConfig from '@/content/avatar.json';
import type { PhotoFrame } from '@/entities/child/model/types';
import { config } from '@/entities/content/content';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { pickSquarePhoto } from '@/shared/platform/photo';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Chip } from '@/shared/ui/Choice';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, spacing } from '@/shared/theme/tokens';

import { ChildAvatar } from './ChildAvatar';

export interface PhotoValue {
  dataUri: string;
  frame: PhotoFrame;
  backdrop: string;
}

interface Props {
  value: PhotoValue | null;
  onChange: (value: PhotoValue) => void;
}

const PREVIEW = 168;

export function PhotoEditor({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    setLoading(true);
    const result = await pickSquarePhoto(config.photo.size, config.photo.quality);
    setLoading(false);
    if (result.ok) {
      onChange({ dataUri: result.dataUri, frame: value?.frame ?? 'none', backdrop: value?.backdrop ?? avatarConfig.photoBackdrops[0] });
    } else if (result.reason === 'denied') {
      toast(strings.photo.permissionDenied);
    }
  };

  if (!value) {
    return (
      <View style={styles.empty}>
        <PressableScale onPress={pick} style={styles.placeholder} accessibilityLabel={strings.photo.pick}>
          <Icon name="image" size={48} color={colors.textMuted} />
        </PressableScale>
        <AppText variant="body" color="textSoft" align="center">
          {strings.photo.empty}
        </AppText>
        <BigButton label={strings.photo.pick} onPress={pick} loading={loading} />
        <AppText variant="caption" color="textMuted" align="center">
          {strings.child.photoNote}
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.editor}>
      <View style={styles.preview}>
        <ChildAvatar avatar={{ kind: 'photo', ...value }} size={PREVIEW} />
      </View>

      <View style={styles.section}>
        <AppText variant="heading">{strings.photo.frame}</AppText>
        <View style={styles.wrap}>
          {(avatarConfig.photoFrames as PhotoFrame[]).map((frame) => (
            <Chip key={frame} label={strings.photo.frames[frame]} selected={value.frame === frame} onPress={() => onChange({ ...value, frame })} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="heading">{strings.photo.backdrop}</AppText>
        <View style={styles.wrap}>
          {avatarConfig.photoBackdrops.map((color) => (
            <PressableScale
              key={color}
              onPress={() => onChange({ ...value, backdrop: color })}
              accessibilityRole="radio"
              accessibilityState={{ selected: value.backdrop === color }}
              style={[styles.swatch, { backgroundColor: color }, value.backdrop === color && styles.swatchOn]}
            />
          ))}
        </View>
      </View>

      <BigButton label={strings.photo.change} variant="secondary" onPress={pick} loading={loading} icon={<Icon name="image" size={20} />} />
      <AppText variant="caption" color="textMuted" align="center">
        {strings.child.photoNote}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  placeholder: {
    width: PREVIEW,
    height: PREVIEW,
    borderRadius: PREVIEW / 2,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  editor: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  preview: { alignItems: 'center', paddingVertical: spacing.sm },
  section: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatch: { width: 48, height: 48, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.surface },
  swatchOn: { borderColor: colors.primary },
});
