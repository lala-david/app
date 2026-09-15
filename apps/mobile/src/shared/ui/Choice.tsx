import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: string;
}

export function Chip({ label, selected, onPress, accent = colors.primary }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && { backgroundColor: accent, borderColor: accent }]}
    >
      <AppText variant="bodyStrong" tint={selected ? colors.textOnAccent : colors.text}>
        {label}
      </AppText>
    </PressableScale>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
            pressedScale={0.98}
          >
            <AppText variant="bodyStrong" color={active ? 'text' : 'textMuted'}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}

export function Checkbox({ label, checked, onToggle, trailing }: CheckboxProps) {
  return (
    <View style={styles.checkRow}>
      <PressableScale onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.checkPress} haptic={false}>
        <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Icon name="check" size={18} color={colors.textOnAccent} strokeWidth={3} /> : null}</View>
        <View style={styles.flex}>{typeof label === 'string' ? <AppText>{label}</AppText> : label}</View>
      </PressableScale>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceSunken, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface, boxShadow: '0px 1px 4px rgba(59,47,42,0.12)' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  flex: { flex: 1 },
});
