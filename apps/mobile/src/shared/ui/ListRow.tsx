import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { colors, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './icons';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  leading?: ReactNode;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  trailing?: ReactNode;
  chevron?: boolean;
}

/** 설정 목록 한 줄. 부모 화면용이라 글자를 크게 둔다 */
export function ListRow({ title, subtitle, icon, iconColor, leading, value, onPress, danger, trailing, chevron = !!onPress }: Props) {
  const content = (
    <View style={styles.row}>
      {leading ?? (icon ? <View style={styles.iconWrap}><Icon name={icon} size={22} color={danger ? colors.danger : iconColor ?? colors.textSoft} /></View> : null)}
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" color="textSoft">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {chevron ? <Icon name="chevronRight" size={20} color={colors.textMuted} /> : null}
    </View>
  );

  return onPress ? (
    <PressableScale onPress={onPress} pressedScale={0.99} accessibilityLabel={title}>
      {content}
    </PressableScale>
  ) : (
    content
  );
}

interface SwitchRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ title, subtitle, icon, value, onChange, disabled }: SwitchRowProps) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      icon={icon}
      chevron={false}
      trailing={
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ true: colors.success, false: colors.locked }}
          thumbColor={colors.surface}
          accessibilityLabel={title}
        />
      }
    />
  );
}

export function ListDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, paddingVertical: spacing.xs },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 52 },
});
