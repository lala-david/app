import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { strings } from '@/shared/i18n/strings.ko';
import { fmt, shortDate } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, tones } from '@/shared/theme/tokens';

import type { PathDay, Station } from '../model/todayState';

import { layoutPath, PATH, type PathItem } from './pathLayout';

interface Props {
  days: PathDay[];
  onStationPress: (station: Station) => void;
}

const toneOf = (station: Station) => tones[station.routine.tone];

function dayLabel(day: PathDay): string {
  if (day.offset === 0) return fmt(strings.today.todayLabel, { date: shortDate(day.date) });
  if (day.offset === 1) return strings.today.tomorrow;
  return fmt(strings.today.daysLater, { n: day.offset });
}

function DayHeader({ day }: { day: PathDay }) {
  const isToday = day.offset === 0;
  return (
    <View style={styles.header}>
      <View style={styles.rule} />
      <View style={[styles.dayPill, { backgroundColor: isToday ? colors.brand : '#EEE8DF' }]}>
        <AppText variant="captionStrong" color={isToday ? colors.white : '#897E75'}>
          {fmt(strings.today.day, { n: day.index })}
        </AppText>
      </View>
      <AppText variant="label" color={isToday ? colors.ink : '#52655F'}>
        {dayLabel(day)}
      </AppText>
      <View style={styles.rule} />
    </View>
  );
}

/** 길 위의 정거장: 파스텔 받침 위에 캐릭터가 서 있고, 번호표가 붙는다 */
function Stone({ station, big }: { station: Station; big: boolean }) {
  const tone = toneOf(station);
  const spec = big ? PATH.today : PATH.future;
  const done = station.state === 'done';
  const size = spec.stone;

  return (
    <View style={{ width: size, height: size + (big ? 10 : 6) }}>
      <View style={[styles.stoneBase, { width: size, height: size, borderRadius: size / 2, top: big ? 10 : 6, backgroundColor: tone.c, opacity: done ? 0.9 : 0.38 }]} />
      <View style={[styles.stoneTop, { width: size, height: size, borderRadius: size / 2, backgroundColor: done ? tone.c : tone.p, borderColor: station.state === 'running' ? tone.c : colors.white }]} />
      <Character name={station.routine.character} size={spec.character} float={big && station.state !== 'done'} delay={station.number * 350} style={{ position: 'absolute', left: (size - spec.character) / 2, top: big ? -12 : -6 }} />
      {big ? (
        <View style={[styles.number, { backgroundColor: done ? colors.brand : tone.c }]}>
          {done ? <Icon name="check" size={15} color={colors.white} strokeWidth={3.4} /> : <AppText variant="captionStrong" color={colors.white}>{station.number}</AppText>}
        </View>
      ) : null}
    </View>
  );
}

function StationRow({ item, onPress }: { item: Extract<PathItem, { kind: 'station' }>; onPress: (station: Station) => void }) {
  const { station, big, side } = item;
  const tone = toneOf(station);
  const done = station.state === 'done';
  const mirrored = side === 'right';

  const label = big ? (
    <View style={[styles.label, mirrored && styles.labelRight]}>
      <View style={[styles.minutes, mirrored && styles.rowReverse]}>
        <Icon name="clock" size={14} color={tone.c} strokeWidth={2.6} />
        <AppText variant="captionStrong" color={tone.c}>
          {fmt(strings.common.minutes, { n: station.routine.targetMinutes })}
        </AppText>
      </View>
      <AppText variant="cardTitle" numberOfLines={1}>
        {station.routine.title}
      </AppText>
      <AppText variant="caption" color="#6E7B77" numberOfLines={1}>
        {station.routine.titleEn}
      </AppText>
    </View>
  ) : (
    <View style={[styles.label, mirrored && styles.labelRight]}>
      <AppText variant="bodyStrong" numberOfLines={1}>
        {station.routine.title}
      </AppText>
      <AppText variant="caption" color={colors.inkMuted}>
        {fmt(strings.common.minutes, { n: station.routine.targetMinutes })}
      </AppText>
    </View>
  );

  const action = big ? (
    <View style={[styles.play, { backgroundColor: done ? colors.brand : tone.c }]}>
      <Icon name={done ? 'check' : 'play'} size={done ? 20 : 18} color={colors.white} strokeWidth={3.2} />
    </View>
  ) : (
    <View style={[styles.dashed, done && { borderStyle: 'solid', borderColor: tone.c, backgroundColor: tone.c }]}>
      {done ? <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} /> : null}
    </View>
  );

  const spec = big ? PATH.today : PATH.future;
  const edge = spec.inset - spec.stone / 2;

  return (
    <Pressy
      onPress={() => onPress(station)}
      disabled={!big}
      pressedScale={0.98}
      accessibilityLabel={`${station.number}. ${station.routine.title} ${fmt(strings.common.minutes, { n: station.routine.targetMinutes })}`}
      style={[styles.row, { top: item.y, height: item.height, paddingHorizontal: edge, opacity: big ? 1 : 0.68 }, mirrored && styles.rowReverse]}
    >
      <Stone station={station} big={big} />
      {label}
      {action}
    </Pressy>
  );
}

/**
 * 오늘의 소리 놀이를 번호 순서대로 잇는 길.
 * 1 → 2 → 3 → 4 가 좌우로 굽이지며 이어지고, 다음 날들이 작게 뒤따른다.
 */
export function RoutinePath({ days, onStationPress }: Props) {
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => layoutPath(days, width, (s) => toneOf(s).c), [days, width]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: width ? layout.height : undefined }}>
      {width > 0 ? (
        <>
          <Svg width={width} height={layout.height} style={StyleSheet.absoluteFill}>
            {layout.segments.map((segment) => (
              <Path key={segment.d} d={segment.d} stroke={segment.color ?? colors.line} strokeWidth={segment.color ? 7 : 6} strokeLinecap="round" strokeDasharray={segment.color ? undefined : '1 15'} fill="none" opacity={segment.color ? 0.55 : 1} />
            ))}
          </Svg>
          {layout.items.map((item) =>
            item.kind === 'header' ? (
              <View key={item.key} style={[styles.headerSlot, { top: item.y, height: item.height }]}>
                <DayHeader day={item.day} />
              </View>
            ) : (
              <StationRow key={item.key} item={item} onPress={onStationPress} />
            ),
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerSlot: { position: 'absolute', left: 0, right: 0, justifyContent: 'center', backgroundColor: colors.ground },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  dayPill: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20 },
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowReverse: { flexDirection: 'row-reverse' },
  stoneBase: { position: 'absolute', left: 0 },
  stoneTop: { position: 'absolute', left: 0, top: 0, borderWidth: 4 },
  number: { position: 'absolute', left: -4, top: -6, width: 26, height: 26, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ground },
  label: { flex: 1, gap: 1 },
  labelRight: { alignItems: 'flex-end' },
  minutes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  play: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dashed: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
});
