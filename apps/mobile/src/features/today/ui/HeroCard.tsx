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

/** 시안 01의 캐릭터 배치(카드 왼쪽 위 기준). 뒤에서 앞 순서로 그린다 */
const CAST = [
  { name: 'crocodile', size: 126, left: 219, top: 39, delay: 1250 },
  { name: 'rabbit', size: 99, left: 129, top: 162, delay: 2700 },
  { name: 'cat', size: 107, left: 259, top: 142, delay: 2100 },
  { name: 'chick', size: 148, left: 173, top: 138, delay: 400 },
] as const;

/** 오늘 탭의 노란 히어로 카드 (시안 01) */
export function HeroCard({ week, minutes, percent }: Props) {
  return (
    <View style={styles.hero}>
      <View style={styles.bubbleTop} />
      <View style={styles.bubbleBottom} />

      {CAST.map((c) => (
        <Character key={c.name} name={c.name} size={c.size} float delay={c.delay} shadow style={{ position: 'absolute', left: c.left, top: c.top }} />
      ))}

      <View style={styles.badge}>
        <AppText variant="micro">{fmt(strings.today.weekBadge, { week: week.week, theme: week.theme.toUpperCase() })}</AppText>
      </View>
      <AppText variant="heroTitle" style={styles.title}>
        {week.headline}
      </AppText>
      <AppText variant="label" color={colors.heroSub}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: sizes.heroHeight, borderRadius: radius.hero, paddingTop: 22, paddingHorizontal: 20, overflow: 'hidden', backgroundColor: colors.hero },
  bubbleTop: { position: 'absolute', width: 170, height: 170, left: 220, top: -21, borderRadius: 85, backgroundColor: colors.heroBubble },
  bubbleBottom: { position: 'absolute', width: 202, height: 116, left: 168, top: 124, borderRadius: 50, backgroundColor: colors.heroBlob },
  badge: { alignSelf: 'flex-start', height: 30, paddingHorizontal: 15, borderRadius: 15, justifyContent: 'center', backgroundColor: colors.heroBadge },
  title: { marginTop: 16, marginBottom: 4 },
  progress: { position: 'absolute', left: 20, right: 10, bottom: 17 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  track: { height: 11, borderRadius: 5.5, backgroundColor: colors.white, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5.5, backgroundColor: colors.brand },
});
