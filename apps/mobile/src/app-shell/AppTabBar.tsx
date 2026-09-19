import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Icon, type IconName } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, shadows, sizes } from '@/shared/theme/tokens';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TABS: { name: 'today' | 'journey' | 'parent' | 'settings'; label: string; icon: IconName }[] = [
  { name: 'today', label: strings.tabs.today, icon: 'today' },
  { name: 'journey', label: strings.tabs.journey, icon: 'journey' },
  { name: 'parent', label: strings.tabs.parent, icon: 'parent' },
  { name: 'settings', label: strings.tabs.settings, icon: 'settings' },
];

/** 시안의 떠 있는 하단 탭: 좌우·아래 12 띄움, 높이 76, 모서리 27 */
export function AppTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { bottom: sizes.navInset + insets.bottom }, Platform.OS === 'web' ? ({ boxShadow: shadows.nav } as object) : styles.nativeShadow]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const on = state.index === index;
        return (
          <Pressy key={route.key} onPress={() => !on && navigation.navigate(route.name)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={tab.label} style={[styles.item, on && styles.itemOn]}>
            <Icon name={tab.icon} size={23} color={on ? colors.navActive : colors.navIdle} strokeWidth={2.25} />
            <AppText variant="micro" color={on ? colors.navActive : colors.navIdle}>
              {tab.label}
            </AppText>
          </Pressy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: sizes.navInset, right: sizes.navInset, height: sizes.navHeight, flexDirection: 'row', padding: 7, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.95)' },
  nativeShadow: { shadowColor: '#2D3E38', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 20 },
  itemOn: { backgroundColor: colors.navActiveBg },
});
