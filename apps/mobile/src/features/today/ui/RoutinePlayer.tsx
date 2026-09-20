import { Image } from 'expo-image';
import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RoutineDef } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { YoutubePlayer, type YoutubePlayerHandle } from '@/shared/platform/youtube/YoutubePlayer';
import { thumbnailUrl, type PlayerState } from '@/shared/platform/youtube/youtubeEmbed';
import { AppText } from '@/shared/ui/AppText';
import { Appear } from '@/shared/ui/Appear';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, sizes, tones } from '@/shared/theme/tokens';

import type { PlayerPhase } from '../model/useRoutinePlayback';

interface Props {
  playerRef: Ref<YoutubePlayerHandle>;
  routine: RoutineDef;
  phase: PlayerPhase;
  wantPlay: boolean;
  onState: (state: PlayerState) => void;
  onError: () => void;
  onPlay: () => void;
  onOpenOutside: () => void;
  onFullscreenDenied: () => void;
}

const COVER_TEXT: Record<Exclude<PlayerPhase, 'playing' | 'manual'>, string> = {
  loading: strings.sheet.loading,
  paused: strings.sheet.tapToPlay,
  ended: strings.sheet.ended,
  blocked: strings.sheet.blocked,
};

/**
 * 시트 안의 영상 칸. 재생 중에만 유튜브 화면이 드러나고,
 * 멈추면 우리 덮개가 위를 가려서 유튜브의 추천 영상이 아이에게 보이지 않는다.
 */
export function RoutinePlayer({ playerRef, routine, phase, wantPlay, onState, onError, onPlay, onOpenOutside, onFullscreenDenied }: Props) {
  const tone = tones[routine.tone];
  const thumbnail = thumbnailUrl(routine.video);
  const blocked = phase === 'blocked';
  // 멈춘 동안에는 덮개 어디를 눌러도 이어진다
  const tappable = phase === 'paused' || phase === 'ended';
  const uncovered = phase === 'playing' || phase === 'manual';

  return (
    <Appear style={[styles.frame, { borderColor: tone.p }]}>
      {blocked ? null : <YoutubePlayer ref={playerRef} source={routine.video} playing={wantPlay} onState={onState} onError={onError} onFullscreenDenied={onFullscreenDenied} />}

      {uncovered ? (
        phase === 'manual' ? (
          <View style={styles.hint} pointerEvents="none">
            <Icon name="play" size={12} color={colors.surface} />
            <AppText variant="micro" color={colors.surface}>
              {strings.sheet.tapVideo}
            </AppText>
          </View>
        ) : null
      ) : (
        <Pressy onPress={onPlay} disabled={!tappable} pressedScale={1} style={[styles.cover, { backgroundColor: tone.p }]} accessibilityLabel={COVER_TEXT[phase as keyof typeof COVER_TEXT]}>
          {thumbnail && !blocked ? <Image source={thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <View style={styles.dim} />
          {phase === 'loading' || blocked ? (
            <Character name={routine.character} size={72} float={phase === 'loading'} />
          ) : (
            <View style={[styles.play, { backgroundColor: tone.c }]}>
              <Icon name="play" size={26} color={colors.surface} />
            </View>
          )}
          <AppText variant="captionStrong" color={colors.surface} style={styles.coverText}>
            {COVER_TEXT[phase as keyof typeof COVER_TEXT]}
          </AppText>
          {blocked ? (
            <Pressy onPress={onOpenOutside} style={styles.outside}>
              <AppText variant="captionButton" color={tone.c}>
                {strings.sheet.openYoutube}
              </AppText>
            </Pressy>
          ) : null}
        </Pressy>
      )}
    </Appear>
  );
}

const fillParent = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: sizes.videoRadius, borderWidth: 2, overflow: 'hidden', backgroundColor: colors.ink },
  cover: { ...fillParent, alignItems: 'center', justifyContent: 'center', gap: 10 },
  dim: { ...fillParent, backgroundColor: colors.videoDim },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  coverText: { textAlign: 'center', paddingHorizontal: 24 },
  hint: { position: 'absolute', alignSelf: 'center', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.videoChip },
  outside: { minHeight: sizes.touch, paddingHorizontal: 20, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
