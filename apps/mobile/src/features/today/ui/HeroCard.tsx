import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { WeekDef } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { colors, radius, sizes } from '@/shared/theme/tokens';

interface Props {
  week: WeekDef;
  minutes: number;
  percent: number;
}

/** 시안 01의 캐릭터 배치. 뒤에서 앞 순서로 그린다 */
const CAST = [
  { name: 'crocodile', size: 122, right: 4, bottom: 138, delay: 1250 },
  { name: 'rabbit', size: 88, right: 130, bottom: 42, delay: 2700 },
  { name: 'cat', size: 96, right: -8, bottom: 54, delay: 2100 },
  { name: 'chick', size: 132, right: 50, bottom: 18, delay: 400 },
] as const;

/** 오늘 탭의 노란 히어로 카드 (시안 01) */
export function HeroCard({ week, minutes, percent }: Props) {
  return (
    <LinearGradient colors={[colors.heroFrom, colors.heroTo]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.hero}>
      <View style={styles.bubbleTop} />
      <View style={styles.bubbleBottom} />

      {CAST.map((c) => (
        <Character key={c.name} name={c.name} size={c.size} float delay={c.delay} shadow style={{ position: 'absolute', right: c.right, bottom: c.bottom }} />
      ))}

      <View style={styles.badge}>
        <AppText variant="micro">{fmt(strings.today.weekBadge, { week: week.week, theme: week.theme.toUpperCase() })}</AppText>
      </View>
      <AppText variant="heroTitle" style={styles.title}>
        {week.headline}
      </AppText>
      <AppText variant="label" color={colors.inkSoft}>
        {week.subline}
      </AppText>

      <View style={styles.progress}>
        <View style={styles.progressLabels}>
          <AppText variant="captionStrong">{fmt(strings.today.minutes, { n: minutes })}</AppText>
          <AppText variant="captionStrong">{percent}%</AppText>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { height: sizes.heroHeight, borderRadius: radius.hero, padding: 22, overflow: 'hidden' },
  bubbleTop: { position: 'absolute', width: 190, height: 190, right: -47, top: -66, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.3)' },
  bubbleBottom: { position: 'absolute', width: 225, height: 165, right: -24, bottom: 25, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.46)', transform: [{ rotate: '-7deg' }] },
  badge: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)' },
  title: { marginTop: 12, marginBottom: 7 },
  progress: { position: 'absolute', left: 20, right: 20, bottom: 14 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  track: { height: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.72)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colors.brand },
});
