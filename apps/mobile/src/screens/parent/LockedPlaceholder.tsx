import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';

/** 부모 확인 전에 잠깐 보이는 자리 */
export function LockedPlaceholder() {
  return (
    <Screen mode="parent">
      <View style={styles.body}>
        <AssetImage name="guides/parent-hold" size={160} />
        <View style={styles.row}>
          <Icon name="lock" size={22} color={colors.textSoft} />
          <AppText variant="heading" color="textSoft">
            {strings.gate.title}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
