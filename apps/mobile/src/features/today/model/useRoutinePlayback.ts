import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { playSfx } from '@/entities/content/voice';
import { progressActions } from '@/entities/progress/model/progressStore';
import { track } from '@/shared/analytics/analytics';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { openExternal, youtubeUrl } from '@/shared/platform/links';
import { notificationScheduler } from '@/shared/platform/notifications';
import type { PlayerState } from '@/shared/platform/youtube/youtubeEmbed';
import { tones } from '@/shared/theme/tokens';

import type { Station } from './todayState';
import { TIME_SCALE, useRoutineTimer, type RoutineTimer } from './useRoutineTimer';

/** 화면 안 플레이어가 지금 보여 줄 모습 */
export type PlayerPhase = 'loading' | 'manual' | 'playing' | 'paused' | 'ended' | 'blocked';

/** 재생 명령 뒤 이만큼 기다려도 시작되지 않으면 자동재생이 막힌 것으로 본다 */
const AUTOPLAY_WAIT_MS = 1800;

/** 플레이어가 이만큼 지나도 준비되지 않으면 덮개를 걷어 안에서 무슨 일이 있는지 보이게 한다 */
const READY_WAIT_MS = 9000;

export interface RoutinePlayback {
  timer: RoutineTimer;
  done: boolean;
  /** 시작을 눌러 플레이어가 열려 있다 */
  watching: boolean;
  /** 플레이어에 내리는 재생 명령 */
  wantPlay: boolean;
  phase: PlayerPhase;
  toggle: () => void;
  onPlayerState: (state: PlayerState) => void;
  onPlayerError: () => void;
  openOutside: () => Promise<void>;
  completeNow: () => void;
}

const timerNotificationId = (station: Station) => `timer:${station.id}`;

/**
 * 루틴 하나의 듣기: 영상이 실제로 재생되는 동안만 시간이 흐른다.
 * 끼워 넣기가 막힌 영상은 유튜브로 나가서 보고, 그동안은 예전처럼 시계로 시간을 잰다.
 */
export function useRoutinePlayback(station: Station, onClose: () => void): RoutinePlayback {
  const { routine, date, record } = station;
  const timer = useRoutineTimer(record, routine.targetMinutes);
  const done = station.state === 'done';

  const [watching, setWatching] = useState(false);
  const [wantPlay, setWantPlay] = useState(false);
  const [phase, setPhase] = useState<PlayerPhase>('loading');
  const [playerReady, setPlayerReady] = useState(false);
  const outside = useRef(false);

  const startClock = (away = false) => {
    progressActions.startTimer(date, routine.key, clock.now(), away);
    void notificationScheduler.scheduleIn(timerNotificationId(station), Math.ceil((timer.target - timer.elapsed) / TIME_SCALE), {
      title: fmt(strings.notifications.timerTitle, { n: routine.targetMinutes }),
      body: strings.notifications.timerBody,
      url: '/today',
      art: 'star',
      color: tones[routine.tone].c,
    });
  };

  const stopClock = () => {
    progressActions.pauseTimer(date, routine.key, clock.now());
    void notificationScheduler.cancel(timerNotificationId(station));
  };

  const clockRef = useRef({ startClock, stopClock });
  useEffect(() => {
    clockRef.current = { startClock, stopClock };
  });

  // 목표 시간을 다 채우면 저절로 완료된다
  useEffect(() => {
    if (!timer.reached || done) return;
    progressActions.complete(date, routine.key, 'timer', routine.targetMinutes, clock.now());
    track('lesson_done', { routine: routine.key, date, kind: 'timer' });
    playSfx('fanfare');
    haptics.success();
    toast(fmt(strings.sheet.reached, { n: routine.targetMinutes }));
  }, [timer.reached, done, date, routine]);

  // 브라우저와 휴대폰은 소리 나는 자동재생을 막곤 한다. 그때는 덮개를 걷어 유튜브의 재생 버튼을 직접 누르게 한다
  useEffect(() => {
    if (!playerReady || !wantPlay || phase === 'playing' || phase === 'blocked') return;
    const timeout = setTimeout(() => setPhase('manual'), AUTOPLAY_WAIT_MS);
    return () => clearTimeout(timeout);
  }, [playerReady, wantPlay, phase]);

  useEffect(() => {
    if (!watching || playerReady) return;
    const timeout = setTimeout(() => setPhase((current) => (current === 'loading' ? 'manual' : current)), READY_WAIT_MS);
    return () => clearTimeout(timeout);
  }, [watching, playerReady]);

  // 시트를 열 때: 유튜브로 나가 있던 중이면 이어 가고, 앱이 꺼지며 남은 헛도는 시계는 버린다
  useEffect(() => {
    if (record?.runOutside) outside.current = true;
    else progressActions.dropStaleRun(date, routine.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시트를 닫거나 앱을 내리면 화면 안 영상은 멈추므로 시간도 멈춘다
  useEffect(() => {
    const halt = () => {
      if (outside.current) return;
      setWantPlay(false);
      clockRef.current.stopClock();
    };
    const subscription = AppState.addEventListener('change', (state) => state !== 'active' && halt());
    return () => {
      subscription.remove();
      halt();
    };
  }, []);

  const onPlayerState = (state: PlayerState) => {
    if (state === 'buffering') {
      // 받아 오는 중이면 이미 재생이 시작된 것이다. 덮개와 안내를 걷는다
      setPhase('playing');
      return;
    }
    if (state === 'ready') {
      // 준비가 끝났을 뿐이다. 시작을 눌러 둔 재생 명령은 그대로 둔다
      setPlayerReady(true);
      if (!wantPlay) setPhase('paused');
      return;
    }
    if (state === 'playing') {
      setWantPlay(true);
      setPhase('playing');
      startClock();
      return;
    }
    setWantPlay(false);
    setPhase(state);
    stopClock();
  };

  const toggle = () => {
    if (!watching) {
      track('video_open', { routine: routine.key, date, where: 'embed' });
      setWatching(true);
      setWantPlay(true);
      return;
    }
    if (outside.current) {
      outside.current = false;
      stopClock();
      return;
    }
    setWantPlay(!wantPlay);
  };

  const openOutside = async () => {
    track('video_open', { routine: routine.key, date, where: 'youtube' });
    if (!(await openExternal(youtubeUrl(routine.video)))) return toast(strings.sheet.openFailed);
    outside.current = true;
    setWantPlay(false);
    stopClock();
    startClock(true);
  };

  const completeNow = () => {
    progressActions.complete(date, routine.key, 'manual', routine.targetMinutes, clock.now());
    void notificationScheduler.cancel(timerNotificationId(station));
    track('lesson_done', { routine: routine.key, date, kind: 'manual' });
    playSfx('sticker');
    haptics.success();
    onClose();
  };

  return { timer, done, watching, wantPlay, phase, toggle, onPlayerState, onPlayerError: () => setPhase('blocked'), openOutside, completeNow };
}
