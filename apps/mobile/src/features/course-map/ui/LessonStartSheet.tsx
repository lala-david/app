import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { nextStep } from '@/entities/progress/lib/progress';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

import type { NodeModel } from '../model/courseState';

interface Props {
  node: NodeModel | null;
  onClose: () => void;
  onStart: (node: NodeModel) => void;
  onAlreadyListened: (node: NodeModel) => void;
  onReplay: (node: NodeModel) => void;
}

const thumbnail = (videoId?: string) => (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined);

export function LessonStartSheet({ node, onClose, onStart, onAlreadyListened, onReplay }: Props) {
  if (!node) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;

  const tone = tones[node.routine.tone];
  const done = node.state === 'done';
  const pending = nextStep(node.record, node.steps);
  const started = node.state === 'inProgress';
  const thumb = thumbnail(node.routine.video.videoId);

  return (
    <Sheet visible onClose={onClose}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: tone.soft }]}>
          <AssetImage name={done ? node.routine.sticker : node.routine.icon} size={72} />
        </View>
        <View style={styles.headText}>
          <AppText variant="childTitle">{node.routine.titleKo}</AppText>
          <View style={[styles.chip, { backgroundColor: tone.soft }]}>
            <Icon name="clock" size={16} color={tone.dark} strokeWidth={2.2} />
            <AppText variant="bodyStrong" tint={tone.dark}>
              {fmt(strings.common.minutes, { n: node.routine.targetMinutes })}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.video}>
        {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: tone.soft }]} />}
        <View style={styles.videoText}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {node.routine.video.title}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {node.routine.video.channel}
          </AppText>
        </View>
      </View>

      {node.steps.length > 1 ? (
        <View style={styles.steps}>
          {node.steps.map((step) => {
            const complete = node.record?.steps.includes(step);
            return (
              <View key={step} style={styles.step}>
                <View style={[styles.stepDot, complete ? { backgroundColor: colors.success } : { borderColor: tone.base, borderWidth: 3 }]}>
                  {complete ? <Icon name="check" size={16} color={colors.textOnAccent} strokeWidth={3} /> : null}
                </View>
                <AppText variant="caption" color="textSoft">
                  {strings.lessonSheet.steps[step]}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}

      <AppText variant="caption" color="textSoft" align="center">
        {node.routine.parentTip}
      </AppText>

      <View style={styles.actions}>
        {done ? (
          <BigButton label={strings.lessonSheet.again} tone={tone} size="child" onPress={() => onReplay(node)} />
        ) : (
          <BigButton
            label={started ? strings.lessonSheet.resume : strings.lessonSheet.start}
            tone={tone}
            size="child"
            icon={<Icon name="play" size={22} color={tone.ink} />}
            onPress={() => onStart(node)}
          />
        )}
        {!done && pending === 'video' ? (
          <BigButton label={strings.lessonSheet.alreadyListened} variant="ghost" size="compact" onPress={() => onAlreadyListened(node)} />
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 96, height: 96, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  video: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.surfaceSunken, borderRadius: radius.md, padding: spacing.xs },
  thumb: { width: 112, height: 63, borderRadius: radius.sm },
  videoText: { flex: 1, gap: 2 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  step: { alignItems: 'center', gap: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: spacing.xs },
});
