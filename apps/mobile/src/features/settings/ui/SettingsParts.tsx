import type { ReactNode } from 'react';
import { Children, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AppText } from '@/shared/ui/AppText';
import { Icon, type IconName } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, motion } from '@/shared/theme/tokens';

/** 시안 04의 토글: 44×25, 켜지면 청록 */
export function Toggle({ on }: { on: boolean }) {
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(on ? 19 : 0, { duration: motion.fast }) }] }));
  return (
    <View style={[styles.toggle, { backgroundColor: on ? colors.toggleOn : colors.toggleOff }]}>
      <Animated.View style={[styles.knob, knob]} />
    </View>
  );
}

interface RowProps {
  icon: IconName;
  title: string;
  desc?: string;
  danger?: boolean;
  onPress?: () => void;
  /** 주면 화살표 대신 토글을 그린다 */
  toggle?: boolean;
  value?: string;
}

export function SettingsRow({ icon, title, desc, danger, onPress, toggle, value }: RowProps) {
  const ink = danger ? colors.danger : colors.settingsInk;
  return (
    <Pressy
      onPress={onPress}
      disabled={!onPress}
      pressedScale={0.99}
      style={styles.row}
      accessibilityRole={toggle === undefined ? 'button' : 'switch'}
      accessibilityState={toggle === undefined ? undefined : { checked: toggle }}
      accessibilityLabel={title}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={21} color={ink} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={ink}>
          {title}
        </AppText>
        {desc ? (
          <AppText variant="micro" color={colors.settingsSoft} style={styles.desc}>
            {desc}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" color={colors.settingsSoft}>
          {value}
        </AppText>
      ) : null}
      {toggle !== undefined ? <Toggle on={toggle} /> : onPress && !danger ? <Icon name="chevronRight" size={16} color={colors.settingsSoft} strokeWidth={2.2} /> : null}
    </Pressy>
  );
}

/** 흰 묶음 카드. 줄 사이에 가는 선을 넣는다 */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View>
      <AppText variant="label" color={colors.settingsHeading} style={styles.groupTitle}>
        {title}
      </AppText>
      <View style={styles.group}>
        {rows.map((row, i) => (
          <View key={i} style={i < rows.length - 1 ? styles.divider : undefined}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 44, height: 25, padding: 3, borderRadius: 999 },
  knob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  row: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 15 },
  iconBox: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.settingsIconBg, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  desc: { marginTop: 3, fontWeight: '400' },
  groupTitle: { marginTop: 22, marginBottom: 9, marginHorizontal: 8 },
  group: { borderRadius: 24, backgroundColor: colors.surface, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.settingsLine },
});
