import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

import guides from '@/content/guides.json';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { colors, radius, shadows, sizes, spacing } from '@/shared/theme/tokens';

import { useFirstVisit } from '../model/useFirstVisit';

type CardsId = keyof typeof guides.cards;

/** 부모용 첫 방문 안내 카드 (넘겨 보기) */
export function CardsGuide({ id, enabled = true }: { id: CardsId; enabled?: boolean }) {
  const cards = guides.cards[id];
  const { visible, dismiss } = useFirstVisit(`cards:${id}`, enabled);
  const [index, setIndex] = useState(0);

  if (!visible) return null;
  const card = cards[index];
  const last = index === cards.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Animated.View entering={FadeIn} style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.View key={index} entering={FadeInRight.duration(220)} style={styles.page}>
            <AssetImage name={card.image} size={150} />
            <AppText variant="title" align="center">
              {card.title}
            </AppText>
            <AppText variant="body" color="textSoft" align="center">
              {card.body}
            </AppText>
          </Animated.View>

          <View style={styles.dots}>
            {cards.map((c, i) => (
              <View key={c.title} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>

          <BigButton label={last ? strings.common.gotIt : strings.common.next} onPress={() => (last ? dismiss() : setIndex(index + 1))} />
          {!last ? <BigButton label={strings.welcome.skip} variant="ghost" onPress={dismiss} /> : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: sizes.appMaxWidth - spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    boxShadow: shadows.raised,
  },
  page: { alignItems: 'center', gap: spacing.sm, minHeight: 280 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.primary },
});
