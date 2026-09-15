import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import type { Reward } from '@/entities/progress/model/types';
import { shortDate } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { colors, radius, spacing } from '@/shared/theme/tokens';

interface Props {
  rewards: Reward[];
  slots: number;
  columns?: number;
}

/** 모은 스티커 판. 아직 못 받은 칸은 빈 원 */
export function StickerBoard({ rewards, slots, columns = 7 }: Props) {
  const stickers = rewards.filter((r) => r.kind === 'sticker').sort((a, b) => a.earnedAt - b.earnedAt);
  const cells = Array.from({ length: Math.max(slots, stickers.length) }, (_, i) => stickers[i]);

  return (
    <View style={styles.grid}>
      {cells.map((sticker, i) => (
        <View key={sticker?.id ?? `empty-${i}`} style={[styles.cell, { width: `${100 / columns}%` }]}>
          {sticker ? (
            <View style={styles.slot} accessibilityLabel={shortDate(sticker.date)}>
              <AssetImage name={sticker.image} size={38} />
            </View>
          ) : (
            <View style={[styles.slot, styles.empty]} />
          )}
        </View>
      ))}
      {stickers.length === 0 ? null : (
        <AppText variant="micro" color="textMuted" style={styles.count}>
          {stickers.length} / {Math.max(slots, stickers.length)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xs },
  cell: { alignItems: 'center' },
  slot: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  empty: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line },
  count: { width: '100%', textAlign: 'right', marginTop: spacing.xxs },
});
