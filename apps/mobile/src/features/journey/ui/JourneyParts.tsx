import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { journey } from '@/entities/content/content';
import type { WeekDef } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, sizes, stageColors } from '@/shared/theme/tokens';

/** 노란 주차 카드 (시안 02 상단) */
export function WeekCard({ week, percent }: { week: WeekDef; percent: number }) {
  return (
    <LinearGradient colors={[colors.weekFrom, colors.weekTo]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.week}>
      <View style={styles.weekBubble} />
      <View>
        <AppText variant="captionStrong">{fmt(strings.journey.weekNow, { n: week.week })}</AppText>
        <AppText variant="weekTitle" style={styles.weekTitle}>
          {week.theme}
        </AppText>
        <AppText variant="bodyStrong">{fmt(strings.journey.todayPercent, { n: percent })}</AppText>
      </View>
      <Character name={week.routines[0].character} size={142} float shadow />
    </LinearGradient>
  );
}

/** 이번 주 소리활동 카드: 단어 맞추기·말하기로 들어가는 곳 */
export function ActivityCard({ week, done, onStart }: { week: WeekDef; done: boolean; onStart: () => void }) {
  return (
    <View style={styles.activity}>
      <View style={styles.activityText}>
        <AppText variant="captionStrong" color="#8A6D00">
          {strings.journey.activityLabel}
        </AppText>
        <AppText variant="bodyStrong" style={styles.activityTitle}>
          {week.activity.title}
        </AppText>
        <AppText variant="caption" color={colors.inkSoft}>
          {week.activity.focusWords.join(' · ')}
        </AppText>
      </View>
      <Pressy onPress={onStart} style={styles.activityButton} accessibilityLabel={week.activity.title}>
        <AppText variant="bodyStrong">{done ? strings.journey.again : strings.journey.start}</AppText>
      </Pressy>
    </View>
  );
}

export interface WeekdayCell {
  label: string;
  state: 'done' | 'now' | 'idle';
  count: number;
}

/** 요일별 별: 하루를 다 채운 날은 별, 오늘은 끝낸 개수 */
export function WeekdayRow({ cells }: { cells: WeekdayCell[] }) {
  return (
    <View style={styles.days}>
      {cells.map((cell) => (
        <View key={cell.label} style={styles.dayCell}>
          <View style={[styles.dayBox, cell.state === 'done' && { backgroundColor: colors.star }, cell.state === 'now' && { backgroundColor: colors.dayNow }]}>
            {cell.state === 'done' ? <Icon name="star" size={16} color={colors.white} /> : null}
            {cell.state === 'now' ? (
              <AppText variant="bodyStrong" color={colors.white}>
                {cell.count}
              </AppText>
            ) : null}
          </View>
          <AppText variant="caption" color={colors.inkSoft}>
            {cell.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** 48주 여정의 4단계 */
export function StageList({ currentWeek }: { currentWeek: number }) {
  return (
    <View style={styles.stages}>
      {journey.stages.map((stage, i) => {
        const current = currentWeek >= stage.fromWeek && currentWeek <= stage.toWeek;
        const color = stageColors[i % stageColors.length];
        return (
          <View key={stage.name} style={[styles.stage, current && { backgroundColor: '#FFF8D9', borderColor: color }]}>
            <View style={[styles.stageBadge, { backgroundColor: color }]}>
              <AppText variant="captionStrong" color={colors.white}>
                {i + 1}
              </AppText>
            </View>
            <View style={styles.stageText}>
              <AppText variant="caption" color={colors.inkMuted}>
                {stage.weeks}
              </AppText>
              <AppText variant="bodyStrong" color={color} style={styles.stageName}>
                {stage.name}
              </AppText>
              <AppText variant="label">{stage.themes}</AppText>
              <AppText variant="caption" color={colors.inkSoft} style={styles.stageNote}>
                {stage.note}
              </AppText>
            </View>
            {current ? (
              <View style={styles.now}>
                <AppText variant="micro" color="#5B4B12">
                  {strings.journey.now}
                </AppText>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** 다음 단계 맛보기 (Week 13) */
export function PreviewCard() {
  const [picked, setPicked] = useState<number | null>(null);
  const { preview } = journey;
  const answer = picked == null ? null : preview.options[picked];

  return (
    <View style={styles.preview}>
      <AppText variant="micro" color={colors.previewInk}>
        {preview.label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.previewQuestion}>
        {answer ? (answer.correct ? preview.correctMessage : preview.wrongMessage) : preview.question}
      </AppText>
      <View style={styles.previewOptions}>
        {preview.options.map((option, i) => (
          <Pressy
            key={option.text}
            onPress={() => setPicked(i)}
            style={[styles.previewButton, picked === i && { borderColor: option.correct ? colors.brand : colors.danger }]}
            accessibilityState={{ selected: picked === i }}
          >
            <AppText variant="bodyStrong" color={colors.previewInk}>
              {option.text}
            </AppText>
          </Pressy>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { height: sizes.weekHeight, borderRadius: radius.hero, paddingLeft: 24, paddingRight: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  weekBubble: { position: 'absolute', width: 158, height: 158, right: -22, top: -48, borderRadius: 79, backgroundColor: 'rgba(255,255,255,0.34)' },
  weekTitle: { marginVertical: 5 },
  activity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, padding: 17, borderWidth: 2, borderColor: colors.activityBorder, borderRadius: radius.lg, backgroundColor: colors.surface },
  activityText: { flex: 1 },
  activityTitle: { marginTop: 4, marginBottom: 5 },
  activityButton: { borderRadius: 15, backgroundColor: colors.activityButton, paddingHorizontal: 14, minHeight: 46, justifyContent: 'center' },
  days: { flexDirection: 'row', marginTop: 15, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 24, backgroundColor: colors.surface },
  dayCell: { flex: 1, alignItems: 'center', gap: 5 },
  dayBox: { width: 37, height: 37, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dayIdle },
  stages: { gap: 10, marginTop: 18 },
  stage: { flexDirection: 'row', gap: 10, paddingVertical: 15, paddingLeft: 8, paddingRight: 12, borderWidth: 1, borderColor: '#E8E5DF', borderRadius: radius.lg, backgroundColor: colors.surface },
  stageBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  stageText: { flex: 1 },
  stageName: { marginVertical: 3 },
  stageNote: { marginTop: 4 },
  now: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF4B7' },
  preview: { marginTop: 16, padding: 18, borderRadius: radius.xl, backgroundColor: colors.previewBg },
  previewQuestion: { marginTop: 6, marginBottom: 14 },
  previewOptions: { flexDirection: 'row', gap: 8 },
  previewButton: { flex: 1, height: 48, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
