import { StyleSheet, View } from 'react-native';

import type { RoutineDef } from '@/entities/content/types';
import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

import type { DayDetailRow } from '../model/dashboard';

interface Props {
  rows: DayDetailRow[];
  words: string[];
  editable: boolean;
  onMark?: (routine: RoutineDef) => void;
}

/** 하루치 루틴 상태 목록 (오늘 보기·날짜 상세 공용) */
export function DayPanel({ rows, words, editable, onMark }: Props) {
  return (
    <View style={styles.root}>
      {rows.map(({ routine, record, done }) => {
        const tone = tones[routine.tone];
        const manual = done && (record?.source === 'parentCheck' || record?.videoStatus === 'manual');
        return (
          <View key={routine.key} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: tone.soft }]}>
              <AssetImage name={routine.icon} size={36} />
            </View>
            <View style={styles.texts}>
              <AppText variant="bodyStrong">{routine.titleKo}</AppText>
              <AppText variant="caption" color="textMuted">
                {fmt(strings.parent.minutesShort, { n: record?.listenedMin ?? 0 })} / {fmt(strings.parent.minutesShort, { n: routine.targetMinutes })}
                {record?.stars ? `  ·  ★ ${record.stars}` : ''}
              </AppText>
            </View>
            {done ? (
              <View style={[styles.status, { backgroundColor: manual ? tone.soft : tone.base }]}>
                <Icon name="check" size={16} color={manual ? tone.dark : tone.ink} strokeWidth={3} />
                <AppText variant="micro" tint={manual ? tone.dark : tone.ink}>
                  {manual ? strings.parent.status.manual : strings.parent.status.done}
                </AppText>
              </View>
            ) : editable && onMark ? (
              <PressableScale onPress={() => onMark(routine)} style={styles.markButton} accessibilityLabel={strings.parent.checkDialog.confirm}>
                <AppText variant="caption" color="primaryDark" weight="700">
                  {strings.parent.checkDialog.confirm}
                </AppText>
              </PressableScale>
            ) : (
              <AppText variant="caption" color="textMuted">
                {strings.parent.status.pending}
              </AppText>
            )}
          </View>
        );
      })}

      {words.length ? (
        <View style={styles.words}>
          <AppText variant="caption" color="textSoft">
            {strings.parent.words}
          </AppText>
          <View style={styles.wordList}>
            {words.map((id) => (
              <View key={id} style={styles.word}>
                <AssetImage name={getWord(id).image} size={24} />
                <AppText variant="caption">{id}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  markButton: { borderRadius: radius.pill, borderWidth: 2, borderColor: colors.primary, paddingHorizontal: spacing.sm, minHeight: 40, justifyContent: 'center' },
  words: { paddingTop: spacing.sm, gap: spacing.xs },
  wordList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceSunken, borderRadius: radius.pill, paddingRight: spacing.sm, paddingLeft: 4, paddingVertical: 2 },
});
