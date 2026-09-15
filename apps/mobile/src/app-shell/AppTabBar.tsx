import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, sizes, spacing } from '@/shared/theme/tokens';

import { TABS } from './tabs';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 하단 탭 3개: 홈(아이) · 부모 · 설정 */
export function AppTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <PressableScale
            key={route.key}
            onPress={() => !focused && navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={styles.item}
          >
            <View style={[styles.icon, focused && styles.iconActive]}>
              <Icon name={tab.icon} size={28} color={focused ? colors.primary : colors.textMuted} strokeWidth={focused ? 2.8 : 2.2} />
            </View>
            <AppText variant="micro" color={focused ? 'primaryDark' : 'textMuted'}>
              {tab.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.line,
    paddingTop: spacing.xs,
    minHeight: sizes.tabBar,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { width: 64, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: colors.primarySoft },
});
