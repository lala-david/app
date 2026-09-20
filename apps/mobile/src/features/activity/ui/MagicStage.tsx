import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, sizes } from '@/shared/theme/tokens';

import type { SpeakRound } from '../model/speakGame';

interface Props {
  round: SpeakRound;
  /** 색을 입혔거나(단어) 도장을 받았으면(문장) true */
  solved: boolean;
  /** 말풍선에 보일 말 */
  prompt: string;
  /** 문장 단계에서 따라 말할 문장 */
  answer?: string;
  listening: boolean;
  onReplay: () => void;
}

const STAGE_HEIGHT = 306;
const CANVAS = 176;
const PICTURE = 136;
const STARS = [
  { x: -78, y: -92, delay: 0, size: 26 },
  { x: 0, y: -118, delay: 90, size: 34 },
  { x: 80, y: -88, delay: 180, size: 24 },
] as const;

function FlyingStar({ play, x, y, delay, size }: { play: boolean; x: number; y: number; delay: number; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = play ? withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })) : 0;
  }, [play, delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - Math.max(0, t.value - 0.7) / 0.3,
    transform: [{ translateX: x * t.value }, { translateY: y * t.value }, { scale: 0.4 + 0.8 * t.value }, { rotate: `${t.value * 40}deg` }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.star, style]}>
      <Icon name="star" size={size} color={colors.star} />
    </Animated.View>
  );
}

/**
 * ‘색깔 마법’의 무대: 미술실에서 악어가 캔버스 앞에 서 있다.
 * 단어 단계는 회색 밑그림에 색이 번지고, 문장 단계는 완성된 그림에 칭찬 도장이 찍힌다.
 */
export function MagicStage({ round, solved, prompt, answer, listening, onReplay }: Props) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const paint = useSharedValue(0);
  const splash = useSharedValue(0);
  const stamp = useSharedValue(0);
  const pop = useSharedValue(1);
  const isWord = round.mode === 'word';
  const swatch = getWord(round.color).swatch ?? colors.brand;

  // 차례가 바뀌면 그림을 처음 상태로: 단어는 밑그림, 문장은 이미 색칠된 그림
  useEffect(() => {
    paint.value = isWord ? 0 : 1;
    splash.value = 0;
    stamp.value = 0;
  }, [round.id, isWord, paint, splash, stamp]);

  useEffect(() => {
    if (!solved) return;
    const quick = reduceMotion ? 0 : 1;
    if (isWord) {
      splash.value = withSequence(withTiming(1, { duration: 520 * quick, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 1 }));
      paint.value = withDelay(140 * quick, withTiming(1, { duration: 620 * quick }));
    } else {
      stamp.value = withTiming(1, { duration: 320 * quick, easing: Easing.out(Easing.cubic) });
    }
    pop.value = withSequence(withTiming(1.04, { duration: 140 * quick, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 220 * quick, easing: Easing.inOut(Easing.quad) }));
  }, [solved, isWord, reduceMotion, paint, splash, stamp, pop]);

  const colorStyle = useAnimatedStyle(() => ({ opacity: paint.value }));
  const splashStyle = useAnimatedStyle(() => ({ opacity: splash.value === 0 ? 0 : 0.95 * (1 - splash.value), transform: [{ scale: 0.35 + 1.5 * splash.value }] }));
  const stampStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, stamp.value * 2), transform: [{ scale: 1.35 - 0.35 * Math.min(1, stamp.value) }, { rotate: '-14deg' }] }));
  const canvasStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const sceneHeight = width * (16 / 9);

  return (
    <View style={styles.stage} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? <AssetImage name="scenes/studio" width={width} height={sceneHeight} fit="cover" style={[styles.scene, { top: -sceneHeight * 0.13 }]} /> : null}
      <View style={styles.floorShade} />

      <Animated.View style={[styles.canvas, { borderColor: solved ? swatch : colors.canvasWood }, canvasStyle]}>
        <AssetImage name={`gray/${round.paint}`} size={PICTURE} />
        <Animated.View style={[styles.layer, colorStyle]}>
          <AssetImage name={getWord(round.paint).image} size={PICTURE} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.layer, splashStyle]}>
          <AssetImage name={getWord(round.color).image} size={CANVAS} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, stampStyle]}>
          <AssetImage name="game/medal" size={74} />
        </Animated.View>
        {STARS.map((s) => (
          <FlyingStar key={s.delay} play={solved} {...s} />
        ))}
      </Animated.View>

      <AssetImage name="game/brush" size={84} style={styles.brush} />
      <Character name="crocodile" size={138} float={!solved} style={styles.croc} />

      <Pressy onPress={onReplay} style={styles.bubble} accessibilityLabel={prompt} pressedScale={0.96}>
        <View style={[styles.bubbleIcon, { backgroundColor: listening ? colors.line : swatch }]}>
          <Icon name="speaker" size={17} color={colors.white} />
        </View>
        <AppText variant={isWord ? 'sheetTitle' : 'bodyStrong'} numberOfLines={1}>
          {prompt}
        </AppText>
        <View style={styles.bubbleTail} />
      </Pressy>

      {answer ? (
        <View style={[styles.answer, { borderColor: swatch }]}>
          <AppText variant="cardTitle">{answer}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: STAGE_HEIGHT, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.stageWall },
  scene: { position: 'absolute', left: 0 },
  floorShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, backgroundColor: colors.stageFloor, opacity: 0.55 },
  canvas: { position: 'absolute', right: 22, top: 58, width: CANVAS, height: CANVAS, borderRadius: 26, borderWidth: 7, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute', right: -16, bottom: -18 },
  star: { position: 'absolute' },
  brush: { position: 'absolute', left: 104, bottom: 40, transform: [{ rotate: '18deg' }] },
  croc: { position: 'absolute', left: 2, bottom: 4 },
  bubble: { position: 'absolute', left: 14, top: 16, maxWidth: 220, minHeight: sizes.touch + 4, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 8, paddingRight: 16, borderRadius: 24, backgroundColor: colors.surface },
  bubbleIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bubbleTail: { position: 'absolute', left: 34, bottom: -7, width: 16, height: 16, borderRadius: 4, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },
  answer: { position: 'absolute', right: 22, bottom: 14, width: CANVAS, height: 40, borderRadius: 16, borderWidth: 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
