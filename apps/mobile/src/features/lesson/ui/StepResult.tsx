import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx } from '@/entities/content/voice';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { Float, Pop } from '@/shared/ui/Motion';
import { colors, radius, spacing } from '@/shared/theme/tokens';

interface Props {
  title: string;
  score: string;
  stars: number;
  mascot?: string;
}

/** 단계가 끝났을 때 보여주는 짧은 결과 */
export function StepResult({ title, score, stars, mascot = 'mascot/sori-clap' }: Props) {
  useEffect(() => playSfx('star'), []);

  return (
    <View style={styles.root}>
      <Float distance={6}>
        <AssetImage name={mascot} size={200} />
      </Float>
      <AppText variant="childTitle" align="center">
        {title}
      </AppText>
      <View style={styles.row}>
        <Pop>
          <View style={styles.stat}>
            <Icon name="check" size={26} color={colors.success} strokeWidth={3} />
            <AppText variant="number">{score}</AppText>
          </View>
        </Pop>
        <Pop delay={180}>
          <View style={styles.stat}>
            <Icon name="star" size={28} color={colors.star} />
            <AppText variant="number" tint={colors.starDark}>
              +{stars}
            </AppText>
          </View>
        </Pop>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.line,
  },
});
