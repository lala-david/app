import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Float } from '@/shared/ui/Motion';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, sizes, spacing } from '@/shared/theme/tokens';

import type { CourseState, NodeModel } from '../model/courseState';

import { DayBanner } from './DayBanner';
import { RoutineNode } from './RoutineNode';

interface Props {
  state: CourseState;
  week: number;
  header: ReactNode;
  onNodePress: (node: NodeModel) => void;
  onRepeatWeek: () => void;
}

/** 굽이진 길의 좌우 흔들림 (노드 지름 대비 비율) */
const PATH_SWAY = [0, 0.7, 0.95, 0.7, 0, -0.7, -0.95, -0.7];
const MASCOT_SIZE = 96;
const SCROLL_OFFSET = 120;

export function CourseMap({ state, week, header, onNodePress, onRepeatWeek }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const todayY = useRef<number | null>(null);
  const scrolled = useRef(false);

  const currentKey = state.todayNodes.find((n) => n.state === 'open' || n.state === 'inProgress')?.key;
  let swayIndex = 0;

  useEffect(() => {
    scrolled.current = false;
  }, [state.todayIndex]);

  const scrollToToday = () => {
    if (scrolled.current || todayY.current == null) return;
    scrolled.current = true;
    scrollRef.current?.scrollTo({ y: Math.max(0, todayY.current - SCROLL_OFFSET), animated: true });
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {header}
      {state.days.map((day) => (
        <View
          key={day.index}
          style={styles.day}
          onLayout={(event) => {
            if (!day.isToday) return;
            todayY.current = event.nativeEvent.layout.y;
            scrollToToday();
          }}
        >
          <DayBanner day={day} past={day.index < state.todayIndex} />
          <View style={styles.path}>
            {day.nodes.map((node) => {
              const sway = PATH_SWAY[swayIndex++ % PATH_SWAY.length] * sizes.node;
              const isCurrent = node.key === currentKey;
              return (
                <View key={node.key} style={[styles.nodeRow, { transform: [{ translateX: sway }] }]}>
                  <RoutineNode node={node} current={isCurrent} onPress={onNodePress} />
                  {isCurrent ? (
                    <Float style={[styles.mascot, sway > 0 ? styles.mascotLeft : styles.mascotRight]} distance={5}>
                      <AssetImage name="mascot/sori-point" size={MASCOT_SIZE} style={sway > 0 ? undefined : styles.flip} />
                    </Float>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.finish}>
        <AssetImage name="celebrate/week-trophy" size={140} style={state.weekFinished ? undefined : styles.faded} />
        {state.weekFinished ? (
          <>
            <AppText variant="childTitle" align="center">
              {fmt(strings.home.weekComplete, { n: week })}
            </AppText>
            <PressableScale onPress={onRepeatWeek} style={styles.repeat} accessibilityLabel={strings.home.again}>
              <AppText variant="childBody" color="textOnAccent">
                {strings.home.again}
              </AppText>
            </PressableScale>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  day: { gap: spacing.md },
  path: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  nodeRow: { alignItems: 'center', justifyContent: 'center' },
  mascot: { position: 'absolute', top: -8 },
  mascotLeft: { right: sizes.nodeRing - 4 },
  mascotRight: { left: sizes.nodeRing - 4 },
  flip: { transform: [{ scaleX: -1 }] },
  finish: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  faded: { opacity: 0.35 },
  repeat: {
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    minHeight: sizes.buttonChild,
    justifyContent: 'center',
  },
});
