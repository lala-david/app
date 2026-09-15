import { StyleSheet, View } from 'react-native';

import { config } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { HoldButton } from '@/shared/ui/HoldButton';
import { Sheet } from '@/shared/ui/Sheet';
import { spacing } from '@/shared/theme/tokens';

import { useGateStore } from '../model/gateStore';

export function ParentGateHost() {
  const open = useGateStore((s) => s.open);
  const settle = useGateStore((s) => s.settle);

  return (
    <Sheet visible={open} onClose={() => settle(false)}>
      <View style={styles.body}>
        <AssetImage name="guides/parent-hold" size={132} />
        <AppText variant="title" align="center">
          {strings.gate.title}
        </AppText>
        <AppText variant="body" color="textSoft" align="center">
          {strings.gate.body}
        </AppText>
        {open ? (
          <HoldButton
            durationMs={config.parentGate.holdMs}
            size={148}
            label={strings.gate.hold}
            releasedLabel={strings.gate.keepHolding}
            onComplete={() => settle(true)}
          />
        ) : null}
        <BigButton label={strings.common.cancel} variant="ghost" onPress={() => settle(false)} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xs },
});
