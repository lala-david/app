import type { ReactElement, ReactNode } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AppText } from '@/shared/ui/AppText';
import { Icon, type IconName } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, motion } from '@/shared/theme/tokens';

/** 시안 04의 토글: 42×24 */
export function Toggle({ on }: { on: boolean }) {
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(on ? 18 : 0, { duration: motion.fast }) }] }));
  return (
    <View style={[styles.toggle, { backgroundColor: on ? colors.toggleOn : colors.toggleOff }]}>
      <Animated.View style={[styles.knob, knob]} />
    </View>
  );
}

/** 시안의 세 묶음은 줄 높이와 선이 다르다: 설명이 있는 줄 68, 안내 53(선 있음), 계정 54 */
export type RowKind = 'detail' | 'plain' | 'account';
const ROW_HEIGHT: Record<RowKind, number> = { detail: 68, plain: 53, account: 54 };

interface RowProps {
  icon: IconName;
  title: string;
  desc?: string;
  danger?: boolean;
  onPress?: () => void;
  /** 주면 화살표 대신 토글을 그린다 */
  toggle?: boolean;
  /** SettingsGroup 이 채운다 */
  kind?: RowKind;
  divider?: boolean;
}

export function SettingsRow({ icon, title, desc, danger, onPress, toggle, kind = 'detail', divider = false }: RowProps) {
  const ink = danger ? colors.streak : colors.settingsInk;
  const iconInk = danger ? colors.streak : kind === 'account' ? colors.settingsInk : colors.settingsIcon;
  return (
    <Pressy
      onPress={onPress}
      disabled={!onPress}
      pressedScale={0.99}
      style={[styles.row, { height: ROW_HEIGHT[kind] }]}
      accessibilityRole={toggle === undefined ? 'button' : 'switch'}
      accessibilityState={toggle === undefined ? undefined : { checked: toggle }}
      accessibilityLabel={title}
    >
      {divider ? <View style={styles.divider} /> : null}
      <View style={styles.iconBox}>
        <Icon name={icon} size={23} color={iconInk} />
      </View>
      <View style={styles.texts}>
        <AppText variant="rowTitle" color={ink} numberOfLines={1}>
          {title}
        </AppText>
        {desc ? (
          <AppText variant="microSoft" color={colors.settingsSoft} style={styles.desc} numberOfLines={2}>
            {desc}
          </AppText>
        ) : null}
      </View>
      {toggle !== undefined ? <Toggle on={toggle} /> : onPress && kind !== 'account' ? <Icon name="chevronRight" size={13} color={colors.settingsSoft} strokeWidth={2.4} /> : null}
    </Pressy>
  );
}

/** 흰 묶음 카드 */
export function SettingsGroup({ title, kind, children }: { title: string; kind: RowKind; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<RowProps>[];
  return (
    <View>
      <AppText variant="labelSoft" color={colors.settingsSoft} style={styles.groupTitle}>
        {title}
      </AppText>
      <View style={[styles.group, groupPadding[kind]]}>{rows.map((row, i) => cloneElement(row, { kind, divider: kind === 'plain' && i > 0 }))}</View>
    </View>
  );
}

const groupPadding = StyleSheet.create({
  detail: { paddingBottom: 8 },
  plain: { paddingBottom: 19 },
  account: { paddingTop: 2, paddingBottom: 20 },
});

const styles = StyleSheet.create({
  toggle: { width: 42, height: 24, padding: 3, borderRadius: 12 },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 17 },
  divider: { position: 'absolute', left: 66, right: 32, top: 3, height: 1, backgroundColor: colors.parentLine },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.parentSunken, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  desc: { marginTop: 2 },
  groupTitle: { marginTop: 27, marginBottom: 7, marginLeft: 9 },
  group: { borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden' },
});
