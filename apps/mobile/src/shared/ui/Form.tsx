import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { colors, radius, sizes, type } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './icons';
import { Pressy } from './Pressy';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  nativeID: string;
  error?: string | null;
  secure?: boolean;
}

export function TextField({ label, nativeID, error, secure = false, ...input }: FieldProps) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText variant="label" color={colors.inkSoft} nativeID={`${nativeID}-label`}>
        {label}
      </AppText>
      <View style={[styles.inputWrap, focused && styles.inputFocused, !!error && styles.inputError]}>
        <TextInput
          {...input}
          id={nativeID}
          accessibilityLabelledBy={`${nativeID}-label`}
          secureTextEntry={hidden}
          placeholderTextColor={colors.inkFaint}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={styles.input}
        />
        {secure ? (
          <Pressy onPress={() => setHidden((v) => !v)} style={styles.toggle}>
            <AppText variant="caption" color={colors.inkSoft}>
              {hidden ? strings.auth.show : strings.auth.hide}
            </AppText>
          </Pressy>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  ink?: string;
  disabled?: boolean;
  loading?: boolean;
}

/** 시안의 큰 버튼: 높이 58, 모서리 21 */
export function PrimaryButton({ label, onPress, color = colors.brand, ink = colors.white, disabled, loading, soft }: ButtonProps & { soft?: boolean }) {
  const inactive = disabled || loading;
  return (
    <Pressy onPress={onPress} disabled={inactive} accessibilityLabel={label} style={[styles.button, { backgroundColor: inactive ? colors.dayIdle : color }]}>
      {loading ? <ActivityIndicator color={ink} /> : <AppText variant={soft ? 'buttonSoft' : 'button'} color={inactive ? colors.inkFaint : ink}>{label}</AppText>}
    </Pressy>
  );
}

export function SoftButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <PrimaryButton label={label} onPress={onPress} color={colors.completeBg} ink={colors.completeInk} soft />;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressy onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipOn]}>
      <AppText variant="bodyStrong" color={selected ? colors.white : colors.ink}>
        {label}
      </AppText>
    </Pressy>
  );
}

export function Checkbox({ label, checked, onToggle, trailing }: { label: string; checked: boolean; onToggle: () => void; trailing?: ReactNode }) {
  return (
    <View style={styles.checkRow}>
      <Pressy onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.checkPress} pressedScale={0.99}>
        <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Icon name="check" size={16} color={colors.white} strokeWidth={3} /> : null}</View>
        <AppText variant="body" style={styles.flex}>
          {label}
        </AppText>
      </Pressy>
      {trailing}
    </View>
  );
}

export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.backBar}>
      <Pressy onPress={onBack} style={styles.backButton} accessibilityLabel={strings.common.back}>
        <Icon name="back" size={24} color={colors.inkSoft} strokeWidth={2.4} />
      </Pressy>
      <AppText variant="cardTitle">{title}</AppText>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 54, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.lineSoft, backgroundColor: colors.surface, paddingLeft: 16 },
  inputFocused: { borderColor: colors.brand },
  inputError: { borderColor: colors.danger },
  input: { flex: 1, ...type.body, color: colors.ink, paddingVertical: 12, outlineStyle: 'none' } as object,
  toggle: { paddingHorizontal: 16, height: 50, justifyContent: 'center' },
  button: { height: sizes.button, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 46, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.lineSoft, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  backBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginHorizontal: -8 },
  backButton: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
});
