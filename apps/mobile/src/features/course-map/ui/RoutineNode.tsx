import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { Icon } from '@/shared/ui/icons';
import { Float } from '@/shared/ui/Motion';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { colors, sizes, tones } from '@/shared/theme/tokens';

import type { NodeModel } from '../model/courseState';

interface Props {
  node: NodeModel;
  current: boolean;
  onPress: (node: NodeModel) => void;
}

const ICON_RATIO = 0.62;

/** 코스 맵의 동그라미 하나. 글자 없이 색·아이콘·모양으로 상태를 보여준다 */
export function RoutineNode({ node, current, onPress }: Props) {
  const tone = tones[node.routine.tone];
  const { state } = node;
  const size = sizes.node;

  const look = {
    done: { bg: tone.base, depth: tone.dark, border: tone.base, dashed: false, faded: false },
    open: { bg: colors.surface, depth: tone.dark, border: tone.base, dashed: false, faded: false },
    inProgress: { bg: colors.surface, depth: tone.dark, border: tone.base, dashed: false, faded: false },
    locked: { bg: colors.locked, depth: colors.lockedDark, border: colors.locked, dashed: false, faded: true },
    missed: { bg: colors.surfaceSunken, depth: colors.line, border: colors.lockedDark, dashed: true, faded: true },
  }[state];

  const circle = (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: look.bg,
          borderColor: look.border,
          borderStyle: look.dashed ? 'dashed' : 'solid',
          borderBottomColor: look.dashed ? look.border : look.depth,
        },
      ]}
    >
      {state === 'locked' ? (
        <Icon name="lock" size={30} color={colors.lockedDark} />
      ) : (
        <AssetImage name={node.routine.icon} size={size * ICON_RATIO} style={look.faded ? styles.faded : undefined} />
      )}
      {state === 'done' ? (
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Icon name="check" size={16} color={colors.textOnAccent} strokeWidth={3.2} />
        </View>
      ) : null}
    </View>
  );

  return (
    <PressableScale onPress={() => onPress(node)} accessibilityLabel={`${node.routine.titleKo} ${state}`} style={styles.hit}>
      <Float active={current}>
        <View style={styles.ringWrap}>
          {state === 'inProgress' || current ? (
            <View style={StyleSheet.absoluteFill}>
              <ProgressRing size={sizes.nodeRing} stroke={7} progress={state === 'inProgress' ? node.progress : 0} color={tone.base} track={tone.soft} />
            </View>
          ) : null}
          {circle}
        </View>
      </Float>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hit: { alignItems: 'center', justifyContent: 'center' },
  ringWrap: { width: sizes.nodeRing, height: sizes.nodeRing, alignItems: 'center', justifyContent: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderBottomWidth: 7 },
  faded: { opacity: 0.45 },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
