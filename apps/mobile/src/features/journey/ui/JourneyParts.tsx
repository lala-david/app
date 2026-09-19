import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { journey } from '@/entities/content/content';
import type { WeekDef } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, sizes, stageColors } from '@/shared/theme/tokens';

/** 노란 주차 카드 (시안 02 상단) */
export function WeekCard({ week, percent }: { week: WeekDef; percent: number }) {
  return (
    <View style={styles.week}>
      <View style={styles.weekBubble} />
      <AppText variant="micro" color={colors.weekLabel}>
        {fmt(strings.journey.weekNow, { n: week.week })}
      </AppText>
      <AppText variant="weekTitle" style={styles.weekTitle}>
        {week.theme}
      </AppText>
      <AppText variant="label" style={styles.weekPercent}>
        {fmt(strings.journey.todayPercent, { n: percent })}
      </AppText>
      <Character name={week.routines[0].character} size={142} float shadow style={styles.weekCharacter} />
    </View>
  );
}

/** 이번 주 소리활동 카드: 단어 맞추기·말하기로 들어가는 곳 */
export function ActivityCard({ week, done, onStart }: { week: WeekDef; done: boolean; onStart: () => void }) {
  return (
    <View style={styles.activity}>
      <View style={styles.activityText}>
        <AppText variant="micro" color={colors.activityLabel}>
          {strings.journey.activityLabel}
        </AppText>
        <AppText variant="activityTitle" style={styles.activityTitle}>
          {week.activity.title}
        </AppText>
        <AppText variant="small" color={colors.heroSub}>
          {week.activity.focusWords.join(' · ')}
        </AppText>
      </View>
      <Pressy onPress={onStart} style={styles.activityButton} accessibilityLabel={week.activity.title}>
        <AppText variant="smallStrong" color={colors.activityButtonInk}>
          {done ? strings.journey.again : strings.journey.start}
        </AppText>
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
            {cell.state === 'done' ? <Icon name="star" size={15} color={colors.white} /> : null}
            {cell.state === 'now' ? (
              <AppText variant="dayCount" color={colors.white}>
                {cell.count}
              </AppText>
            ) : null}
          </View>
          <AppText variant="micro" color={colors.dayLabel}>
            {cell.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const THEME_SEPARATOR = ' · ';

/** 지금 단계 카드: 아이콘, 주제 칩(이번 주 주제 강조), 12주 눈금 */
function CurrentStage({ index, currentWeek }: { index: number; currentWeek: number }) {
  const stage = journey.stages[index];
  const color = stageColors[index % stageColors.length];
  const themes = stage.themes.split(THEME_SEPARATOR);
  const total = stage.toWeek - stage.fromWeek + 1;
  const weeksPerTheme = total / themes.length;
  const weekInStage = currentWeek - stage.fromWeek + 1;
  const currentTheme = Math.min(themes.length - 1, Math.floor((weekInStage - 1) / weeksPerTheme));

  return (
    <View style={[styles.stage, styles.stageNow, { borderColor: color }]}>
      <View style={styles.stageHead}>
        <View style={styles.stageIconTile}>
          <AssetImage name={stage.icon} size={46} />
          <View style={[styles.stageBadge, styles.stageBadgeCorner, { backgroundColor: color }]}>
            <AppText variant="smallStrong" color={colors.white}>
              {index + 1}
            </AppText>
          </View>
        </View>
        <View style={styles.stageText}>
          <AppText variant="micro" color={colors.stageWeeks}>
            {stage.weeks}
          </AppText>
          <AppText variant="stageName" color={color} style={styles.stageName}>
            {stage.name}
          </AppText>
          <AppText variant="microSoft" color={colors.stageNote} style={styles.stageNote}>
            {stage.note}
          </AppText>
        </View>
        <View style={styles.now}>
          <AppText variant="tiny" color={colors.weekLabel}>
            {strings.journey.now}
          </AppText>
        </View>
      </View>

      <View style={styles.themeChips}>
        {themes.map((theme, i) => {
          const on = i === currentTheme;
          const from = stage.fromWeek + i * weeksPerTheme;
          return (
            <View key={theme} style={[styles.themeChip, on && { backgroundColor: color, borderColor: color }]}>
              <AppText variant="smallStrong" color={on ? colors.white : colors.stageThemes}>
                {theme}
              </AppText>
              <AppText variant="tiny" color={on ? colors.white : colors.stageWeeks}>
                {fmt(strings.journey.themeWeeks, { from, to: from + weeksPerTheme - 1 })}
              </AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.weekMeter}>
        <View style={styles.weekTicks}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.weekTick, i < weekInStage && { backgroundColor: color }, i === weekInStage - 1 && styles.weekTickNow]} />
          ))}
        </View>
        <AppText variant="micro" color={colors.stageWeeks}>
          {fmt(strings.journey.weekOf, { n: weekInStage, total })}
        </AppText>
      </View>
    </View>
  );
}

/** 아직 오지 않은(또는 지난) 단계: 아이콘과 주제만 간단히 */
function OtherStage({ index, done }: { index: number; done: boolean }) {
  const stage = journey.stages[index];
  const color = stageColors[index % stageColors.length];
  return (
    <View style={styles.stage}>
      <View style={styles.stageHead}>
        <View style={[styles.stageIconTile, !done && styles.stageIconLocked]}>
          <AssetImage name={stage.icon} size={46} />
          <View style={[styles.stageBadge, styles.stageBadgeCorner, { backgroundColor: color }]}>
            <AppText variant="smallStrong" color={colors.white}>
              {index + 1}
            </AppText>
          </View>
        </View>
        <View style={styles.stageText}>
          <AppText variant="micro" color={colors.stageWeeks}>
            {stage.weeks}
          </AppText>
          <AppText variant="stageName" color={color} style={styles.stageName}>
            {stage.name}
          </AppText>
          <AppText variant="smallStrong" color={colors.stageThemes} style={styles.stageThemes}>
            {stage.themes}
          </AppText>
          <AppText variant="microSoft" color={colors.stageNote} style={styles.stageNote}>
            {stage.note}
          </AppText>
        </View>
        <View style={styles.stageState}>
          <Icon name={done ? 'check' : 'lock'} size={13} color={done ? colors.brand : colors.inkFaint} strokeWidth={2.6} />
        </View>
      </View>
    </View>
  );
}

/** 48주 여정의 4단계 */
export function StageList({ currentWeek }: { currentWeek: number }) {
  return (
    <View style={styles.stages}>
      {journey.stages.map((stage, i) =>
        currentWeek >= stage.fromWeek && currentWeek <= stage.toWeek ? <CurrentStage key={stage.name} index={i} currentWeek={currentWeek} /> : <OtherStage key={stage.name} index={i} done={currentWeek > stage.toWeek} />,
      )}
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
      <View style={styles.previewHead}>
        <View style={styles.previewIcon}>
          <View style={styles.previewIconDot} />
        </View>
        <View style={styles.previewText}>
          <AppText variant="tiny" color={colors.previewLabel}>
            {preview.label}
          </AppText>
          <AppText variant="bodyStrong" color={colors.previewQuestion} style={styles.previewQuestion}>
            {answer ? (answer.correct ? preview.correctMessage : preview.wrongMessage) : preview.question}
          </AppText>
        </View>
      </View>
      <View style={styles.previewOptions}>
        {preview.options.map((option, i) => (
          <Pressy
            key={option.text}
            onPress={() => setPicked(i)}
            style={[styles.previewButton, picked === i && { borderColor: option.correct ? colors.brand : colors.danger }]}
            accessibilityState={{ selected: picked === i }}
          >
            <AppText variant="captionButton" color={colors.previewInk}>
              {option.text}
            </AppText>
          </Pressy>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { height: sizes.weekHeight, borderRadius: radius.hero, paddingTop: 25, paddingLeft: 24, overflow: 'hidden', backgroundColor: colors.week },
  weekBubble: { position: 'absolute', width: 170, height: 170, left: 208, top: -18, borderRadius: 85, backgroundColor: colors.heroBubble },
  weekTitle: { marginTop: 9 },
  weekPercent: { marginTop: 6 },
  weekCharacter: { position: 'absolute', left: 210, top: 8 },
  activity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, minHeight: 92, paddingLeft: 17, paddingRight: 16, borderWidth: 2, borderColor: colors.activityBorder, borderRadius: radius.lg, backgroundColor: colors.surface },
  activityText: { flex: 1 },
  activityTitle: { marginTop: 3, marginBottom: 5 },
  activityButton: { width: 58, height: 46, borderRadius: 15, backgroundColor: colors.activityButton, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 11, borderRadius: 24, borderWidth: 1, borderColor: colors.daysBorder, backgroundColor: colors.surface },
  dayCell: { width: 37, alignItems: 'center', gap: 4 },
  dayBox: { width: 37, height: 37, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dayIdle },
  stages: { gap: 11, marginTop: 21 },
  stage: { paddingVertical: 13, paddingLeft: 12, paddingRight: 14, borderWidth: 1, borderColor: colors.stageBorder, borderRadius: radius.lg, backgroundColor: colors.surface },
  stageNow: { backgroundColor: colors.stageNowBg, paddingBottom: 14 },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  stageIconTile: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.stageBorder },
  stageIconLocked: { backgroundColor: colors.dayIdle, opacity: 0.85 },
  stageBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stageBadgeCorner: { position: 'absolute', left: -6, top: -6, borderWidth: 2, borderColor: colors.surface, width: 24, height: 24, borderRadius: 12 },
  stageText: { flex: 1 },
  stageName: { marginTop: 2 },
  stageThemes: { marginTop: 3 },
  stageNote: { marginTop: 3 },
  stageState: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dayIdle },
  now: { alignSelf: 'flex-start', width: 36, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.stageNowChip },
  themeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  themeChip: { flexGrow: 1, minWidth: 70, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.activityBorder, backgroundColor: colors.surface, gap: 1 },
  weekMeter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  weekTicks: { flex: 1, flexDirection: 'row', gap: 4 },
  weekTick: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surface },
  weekTickNow: { height: 9, marginTop: -1 },
  preview: { marginTop: 24, paddingTop: 17, paddingHorizontal: 18, paddingBottom: 20, borderRadius: radius.xl, backgroundColor: colors.previewBg },
  previewHead: { flexDirection: 'row', gap: 15 },
  previewIcon: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.previewLabel, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  previewIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.previewLabel },
  previewText: { flex: 1 },
  previewQuestion: { marginTop: 4, marginBottom: 17 },
  previewOptions: { flexDirection: 'row', gap: 12 },
  previewButton: { flex: 1, height: 48, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
