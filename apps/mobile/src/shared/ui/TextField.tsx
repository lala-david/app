import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { colors, radius, spacing, type } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  secure?: boolean;
  nativeID: string;
}

export function TextField({ label, error, secure = false, nativeID, ...input }: Props) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="textSoft" nativeID={`${nativeID}-label`}>
        {label}
      </AppText>
      <View style={[styles.field, focused && styles.focused, !!error && styles.errorBorder]}>
        <TextInput
          {...input}
          id={nativeID}
          accessibilityLabelledBy={`${nativeID}-label`}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
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
          <PressableScale onPress={() => setHidden((v) => !v)} style={styles.toggle} haptic={false}>
            <AppText variant="caption" color="textSoft">
              {hidden ? strings.auth.show : strings.auth.hide}
            </AppText>
          </PressableScale>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
  },
  focused: { borderColor: colors.primary },
  errorBorder: { borderColor: colors.danger },
  input: { flex: 1, ...type.body, color: colors.text, paddingVertical: spacing.sm, outlineStyle: 'none' } as object,
  toggle: { paddingHorizontal: spacing.md, height: 50, justifyContent: 'center' },
});
