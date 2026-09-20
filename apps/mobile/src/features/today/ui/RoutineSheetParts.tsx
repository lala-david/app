import { StyleSheet, View } from 'react-native';

import type { RoutineDef } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { formatClock } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, sizes, tones } from '@/shared/theme/tokens';

import type { RoutineTimer } from '../model/useRoutineTimer';

/** 시작 전 머리: 시안 05A~D 그대로 큰 캐릭터 타일과 안내 글 */
export function RoutineHead({ routine, float }: { routine: RoutineDef; float: boolean }) {
  const tone = tones[routine.tone];
  return (
    <View style={styles.head}>
      <View style={[styles.tile, { backgroundColor: tone.p }]}>
        <Character name={routine.character} size={101} float={float} />
      </View>
      <View style={styles.headText}>
        <AppText variant="smallStrong" color={tone.c}>
          {routine.titleEn.toUpperCase()}
        </AppText>
        <AppText variant="sheetTitle" style={styles.title}>
          {routine.title}
        </AppText>
        <AppText variant="guide" color={colors.sheetGuide}>
          {routine.guide}
        </AppText>
      </View>
    </View>
  );
}

/** 보는 중 머리: 영상에 자리를 내주고 한 줄로 줄어든다 */
export function WatchingHead({ routine, onFullscreen }: { routine: RoutineDef; onFullscreen: () => void }) {
  const tone = tones[routine.tone];
  return (
    <View style={styles.watching}>
      <View style={[styles.watchTile, { backgroundColor: tone.p }]}>
        <Character name={routine.character} size={40} />
      </View>
      <View style={styles.watchText}>
        <AppText variant="micro" color={tone.c}>
          {routine.titleEn.toUpperCase()}
        </AppText>
        <AppText variant="captionButton" numberOfLines={1}>
          {routine.title} · {routine.video.title}
        </AppText>
      </View>
      <Pressy onPress={onFullscreen} style={[styles.fullscreen, { backgroundColor: tone.p }]} accessibilityLabel={strings.sheet.fullscreen}>
        <Icon name="expand" size={20} color={colors.ink} strokeWidth={2.2} />
      </Pressy>
    </View>
  );
}

export function SentenceCard({ routine }: { routine: RoutineDef }) {
  const tone = tones[routine.tone];
  return (
    <View style={styles.sentence}>
      <View style={[styles.dot, { borderColor: tone.c }]}>
        <View style={[styles.dotCore, { backgroundColor: tone.c }]} />
      </View>
      <View style={styles.sentenceText}>
        <AppText variant="micro" color={colors.dayLabel}>
          {strings.sheet.sentence}
        </AppText>
        <AppText variant="captionButton">{routine.sentence}</AppText>
      </View>
    </View>
  );
}

export function TimerBar({ timer, done, color }: { timer: RoutineTimer; done: boolean; color: string }) {
  const progress = done ? 1 : timer.progress;
  return (
    <View>
      <View style={styles.timerRow}>
        <AppText variant="captionStrong" color={colors.sheetTimer}>
          {formatClock(done ? timer.target : timer.elapsed)}
        </AppText>
        <AppText variant="captionStrong" color={colors.sheetTimer}>
          {formatClock(timer.target)}
        </AppText>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  tile: { width: sizes.playerTile, height: sizes.playerTile, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, paddingTop: 9 },
  title: { marginTop: 8, marginBottom: 7 },
  watching: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  watchTile: { width: sizes.watchTile, height: sizes.watchTile, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  watchText: { flex: 1, gap: 4 },
  fullscreen: { width: sizes.watchTile, height: sizes.watchTile, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sentence: { flexDirection: 'row', alignItems: 'flex-start', gap: 21, minHeight: 83, paddingTop: 12, paddingBottom: 12, paddingLeft: 17, paddingRight: 16, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 20, backgroundColor: colors.surface },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  dotCore: { width: 8, height: 8, borderRadius: 4 },
  sentenceText: { flex: 1, gap: 8 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginHorizontal: 2 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
});
