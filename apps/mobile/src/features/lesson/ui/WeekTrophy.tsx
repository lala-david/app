import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx } from '@/entities/content/voice';
import type { Reward } from '@/entities/progress/model/types';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Confetti, Float, Pop } from '@/shared/ui/Motion';
import { Screen } from '@/shared/ui/Screen';
import { spacing } from '@/shared/theme/tokens';

interface Props {
  week: number;
  stickers: Reward[];
  onHome: () => void;
}

export function WeekTrophy({ week, stickers, onHome }: Props) {
  useEffect(() => playSfx('fanfare'), []);

  return (
    <Screen footer={<BigButton label={strings.trophy.home} variant="success" size="child" onPress={onHome} />}>
      <Confetti count={40} />
      <View style={styles.body}>
        <Float distance={8}>
          <AssetImage name="celebrate/week-trophy" size={230} />
        </Float>
        <AppText variant="hero" align="center">
          {fmt(strings.trophy.title, { n: week })}
        </AppText>
        <AppText variant="childBody" color="textSoft" align="center">
          {fmt(strings.trophy.subtitle, { n: stickers.length })}
        </AppText>
        <View style={styles.mosaic}>
          {stickers.map((sticker, i) => (
            <Pop key={sticker.id} delay={Math.min(i * 40, 1200)}>
              <AssetImage name={sticker.image} size={40} />
            </Pop>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  mosaic: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 340 },
});
