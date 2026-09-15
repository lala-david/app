import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import guides from '@/content/guides.json';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playMascot } from '@/entities/content/voice';
import { AppText } from '@/shared/ui/AppText';
import { Float } from '@/shared/ui/Motion';
import { colors, radius, shadows, sizes, spacing } from '@/shared/theme/tokens';

import { useFirstVisit } from '../model/useFirstVisit';

type SpotlightId = keyof typeof guides.spotlights;

interface Props {
  id: SpotlightId;
  enabled?: boolean;
}

/** 아이용 첫 방문 안내: 캐릭터가 말하고, 글은 한 줄만 */
export function MascotGuide({ id, enabled = true }: Props) {
  const guide = guides.spotlights[id];
  const { visible, dismiss } = useFirstVisit(`spotlight:${id}`, enabled);

  useEffect(() => {
    if (visible) playMascot(guide.voice);
  }, [visible, guide.voice]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Pressable style={styles.root} onPress={dismiss} accessibilityRole="button" accessibilityLabel={guide.text}>
        <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, styles.dim]} />
        <Animated.View entering={SlideInDown.springify().damping(16)} style={styles.stage}>
          <View style={styles.bubble}>
            <AppText variant="childTitle" align="center">
              {guide.text}
            </AppText>
            <View style={styles.tail} />
          </View>
          <Float distance={6}>
            <AssetImage name={guide.mascot} size={200} />
          </Float>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  dim: { backgroundColor: colors.overlay },
  stage: { width: '100%', maxWidth: sizes.appMaxWidth, alignItems: 'center', paddingBottom: spacing.xxl, gap: spacing.xs },
  bubble: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    boxShadow: shadows.raised,
  },
  tail: {
    position: 'absolute',
    bottom: -12,
    alignSelf: 'center',
    width: 24,
    height: 24,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
});
