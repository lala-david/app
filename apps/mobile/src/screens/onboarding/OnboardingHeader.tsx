import { StyleSheet, View } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { colors, spacing } from '@/shared/theme/tokens';

export const ONBOARDING_STEPS = 3;

export function OnboardingHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack ? (
          <PressableScale onPress={onBack} style={styles.back} accessibilityLabel={strings.common.back}>
            <Icon name="back" size={26} color={colors.textSoft} />
          </PressableScale>
        ) : null}
      </View>
      <ProgressBar progress={step / ONBOARDING_STEPS} color={colors.primary} height={12} />
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs, minHeight: 56 },
  side: { width: 44 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
