import { StyleSheet, View } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { PrimaryButton, SoftButton } from '@/shared/ui/Form';
import { Pressy } from '@/shared/ui/Pressy';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, sizes, tones } from '@/shared/theme/tokens';

import type { Station } from '../model/todayState';
import { useRoutinePlayback } from '../model/useRoutinePlayback';
import { RoutinePlayer } from './RoutinePlayer';
import { RoutineHead, SentenceCard, TimerBar, WatchingHead } from './RoutineSheetParts';

interface Props {
  station: Station | null;
  onClose: () => void;
}

function SheetBody({ station, onClose }: { station: Station; onClose: () => void }) {
  const { routine } = station;
  const tone = tones[routine.tone];
  const playback = useRoutinePlayback(station, onClose);
  const { timer, done, watching } = playback;
  const active = playback.wantPlay || timer.running;
  const showPlayer = watching && !done;

  return (
    <View>
      {showPlayer ? (
        <>
          <RoutinePlayer
            routine={routine}
            phase={playback.phase}
            wantPlay={playback.wantPlay}
            onState={playback.onPlayerState}
            onError={playback.onPlayerError}
            onPlay={playback.toggle}
            onOpenOutside={playback.openOutside}
          />
          <WatchingHead routine={routine} />
        </>
      ) : (
        <RoutineHead routine={routine} float={timer.running} />
      )}

      <View style={showPlayer ? styles.sentenceWatching : styles.sentence}>
        <SentenceCard routine={routine} />
      </View>
      <View style={styles.timer}>
        <TimerBar timer={timer} done={done} color={tone.c} />
      </View>

      {showPlayer && playback.phase !== 'blocked' ? (
        <Pressy onPress={playback.openOutside} style={styles.outside}>
          <AppText variant="caption" color={colors.inkSoft} style={styles.underline}>
            {strings.sheet.watchOutside}
          </AppText>
        </Pressy>
      ) : null}

      <View style={showPlayer ? styles.actionsWatching : styles.actions}>
        {done ? (
          <PrimaryButton label={strings.sheet.completed} onPress={onClose} color={colors.brand} />
        ) : (
          <>
            <PrimaryButton label={active ? strings.sheet.pause : timer.started ? strings.sheet.resume : strings.sheet.start} onPress={playback.toggle} color={tone.c} />
            <SoftButton label={strings.sheet.complete} onPress={playback.completeNow} />
          </>
        )}
      </View>
    </View>
  );
}

/** 루틴 팝업 (시안 05A~D). 시작을 누르면 머리 자리가 영상으로 바뀐다 */
export function RoutineSheet({ station, onClose }: Props) {
  return (
    <Sheet visible={!!station} onClose={onClose} minHeight={sizes.sheetHeight}>
      {station ? <SheetBody key={station.id} station={station} onClose={onClose} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sentence: { marginTop: 23 },
  sentenceWatching: { marginTop: 16 },
  timer: { marginTop: 23 },
  outside: { alignSelf: 'center', paddingVertical: 10 },
  underline: { textDecorationLine: 'underline' },
  actions: { marginTop: 29, gap: 11 },
  actionsWatching: { marginTop: 8, gap: 11 },
});
