import { StyleSheet, View } from 'react-native';

import type { AvatarConfig } from '@/entities/child/model/types';
import { ChildAvatar } from '@/features/avatar/ui/ChildAvatar';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, sizes, spacing } from '@/shared/theme/tokens';

interface Props {
  avatar: AvatarConfig;
  nickname: string;
  streak: number;
  stars: number;
  onAvatarPress: () => void;
  onAvatarLongPress: () => void;
  onStreakPress: () => void;
}

export function HomeHeader({ avatar, nickname, streak, stars, onAvatarPress, onAvatarLongPress, onStreakPress }: Props) {
  const lit = streak > 0;
  return (
    <View style={styles.bar}>
      <PressableScale onPress={onAvatarPress} onLongPress={onAvatarLongPress} accessibilityLabel={nickname} style={styles.avatar}>
        <ChildAvatar avatar={avatar} size={sizes.avatarSm} bordered />
      </PressableScale>

      <View style={styles.stats}>
        <PressableScale onPress={onStreakPress} style={[styles.pill, lit && styles.pillLit]} accessibilityLabel={`streak ${streak}`}>
          <Icon name="flame" size={24} color={lit ? colors.flame : colors.lockedDark} />
          <AppText variant="childBody" tint={lit ? colors.flame : colors.textMuted}>
            {streak}
          </AppText>
        </PressableScale>
        <View style={styles.pill} accessibilityLabel={`stars ${stars}`}>
          <Icon name="star" size={24} color={colors.star} />
          <AppText variant="childBody" tint={colors.starDark}>
            {stars}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  avatar: { borderRadius: radius.pill },
  stats: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.line,
  },
  pillLit: { borderColor: '#FFD2B3', backgroundColor: '#FFF1E6' },
});
