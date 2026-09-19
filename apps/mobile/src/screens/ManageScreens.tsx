import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import help from '@/content/help.json';
import { updateChild, useChild } from '@/entities/child/model/childStore';
import { config, coreRoutineOrder, getWeek } from '@/entities/content/content';
import type { RoutineDef, RoutineKey } from '@/entities/content/types';
import { displayTime, findOrderViolation, shiftTime, type RoutineSchedule } from '@/entities/schedule/schedule';
import { Segments } from '@/features/parent/ui/ParentParts';
import { Toggle } from '@/features/settings/ui/SettingsParts';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { BackBar, PrimaryButton } from '@/shared/ui/Form';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { Screen } from '@/shared/ui/Screen';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, radius, tones } from '@/shared/theme/tokens';

const HOUR = 60;

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressy onPress={onMinus} style={styles.stepButton} accessibilityLabel={`${label} -`}>
        <Icon name="minus" size={24} strokeWidth={2.8} />
      </Pressy>
      <AppText variant="bodyStrong" color={colors.inkSoft} align="center" style={styles.flex}>
        {label}
      </AppText>
      <Pressy onPress={onPlus} style={styles.stepButton} accessibilityLabel={`${label} +`}>
        <Icon name="plus" size={24} strokeWidth={2.8} />
      </Pressy>
    </View>
  );
}

/** 설정 › 알림 시간 */
export function ManageNotificationsScreen() {
  const router = useRouter();
  const child = useChild();
  const week = getWeek();
  const [schedules, setSchedules] = useState<RoutineSchedule[]>(child?.schedules ?? []);
  const [editing, setEditing] = useState<RoutineDef | null>(null);
  const [draft, setDraft] = useState('00:00');

  if (!child) return null;
  const routines = [...week.routines, ...(child.faithEnabled ? week.weekendExtras : [])].sort((a, b) => a.order - b.order);
  const title = (key: RoutineKey) => routines.find((r) => r.key === key)?.title ?? key;
  const violation = findOrderViolation(schedules, coreRoutineOrder(week));
  const update = (key: RoutineKey, patch: Partial<RoutineSchedule>) => setSchedules((list) => list.map((s) => (s.routine === key ? { ...s, ...patch } : s)));

  const save = () => {
    updateChild({ schedules });
    toast(strings.settings.scheduleSaved);
    router.back();
  };

  return (
    <Screen ground={colors.groundParent} footer={<PrimaryButton label={strings.common.save} onPress={save} disabled={!!violation} />}>
      <BackBar title={strings.settings.notificationTimes} onBack={() => router.back()} />
      <View style={styles.list}>
        {routines.map((routine) => {
          const schedule = schedules.find((s) => s.routine === routine.key);
          if (!schedule) return null;
          return (
            <View key={routine.key} style={styles.scheduleRow}>
              <View style={[styles.scheduleIcon, { backgroundColor: tones[routine.tone].p }]}>
                <Character name={routine.character} size={42} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{routine.title}</AppText>
                <AppText variant="caption" color={colors.inkMuted}>
                  {fmt(strings.common.minutes, { n: routine.targetMinutes })}
                </AppText>
              </View>
              <Pressy onPress={() => { setDraft(schedule.time); setEditing(routine); }} style={[styles.time, !schedule.enabled && styles.dim]} accessibilityLabel={`${routine.title} ${schedule.time}`}>
                <AppText variant="bodyStrong">{displayTime(schedule.time, strings.common)}</AppText>
              </Pressy>
              <Pressy onPress={() => update(routine.key, { enabled: !schedule.enabled })} accessibilityRole="switch" accessibilityState={{ checked: schedule.enabled }} accessibilityLabel={routine.title} style={styles.toggleHit}>
                <Toggle on={schedule.enabled} />
              </Pressy>
            </View>
          );
        })}
        {violation ? (
          <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
            {fmt(strings.settings.orderError, { routine: title(violation.routine), previous: title(violation.previous) })}
          </AppText>
        ) : null}
      </View>

      <Sheet visible={!!editing} onClose={() => setEditing(null)}>
        <AppText variant="sheetTitle" align="center">
          {editing?.title}
        </AppText>
        <AppText variant="screenTitle" align="center" style={styles.draft}>
          {displayTime(draft, strings.common)}
        </AppText>
        <View style={styles.steppers}>
          <Stepper label={strings.settings.hourStep} onMinus={() => setDraft(shiftTime(draft, -HOUR))} onPlus={() => setDraft(shiftTime(draft, HOUR))} />
          <Stepper label={fmt(strings.common.minutes, { n: config.timeStepMinutes })} onMinus={() => setDraft(shiftTime(draft, -config.timeStepMinutes))} onPlus={() => setDraft(shiftTime(draft, config.timeStepMinutes))} />
          <PrimaryButton label={strings.common.save} onPress={() => { if (editing) update(editing.key, { time: draft }); setEditing(null); }} />
        </View>
      </Sheet>
    </Screen>
  );
}

type GuideTab = 'guide' | 'faq';

/** 설정 › 소리노출 가이드 · 자주 묻는 질문 */
export function GuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: GuideTab }>();
  const [tab, setTab] = useState<GuideTab>(params.tab === 'faq' ? 'faq' : 'guide');
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen ground={colors.groundParent}>
      <BackBar title={strings.help.title} onBack={() => router.back()} />
      <Segments<GuideTab> value={tab} onChange={setTab} options={[{ value: 'guide', label: strings.settings.guidebook }, { value: 'faq', label: strings.settings.faq }]} />
      <View style={styles.list}>
        {tab === 'guide'
          ? help.guidebook.map((item) => (
              <View key={item.title} style={styles.helpCard}>
                <AppText variant="cardTitle" color={colors.parentInk}>
                  {item.title}
                </AppText>
                <AppText variant="body" color={colors.parentSoft}>
                  {item.body}
                </AppText>
              </View>
            ))
          : help.faq.map((item) => {
              const expanded = open === item.q;
              return (
                <Pressy key={item.q} onPress={() => setOpen(expanded ? null : item.q)} pressedScale={0.99} style={styles.helpCard} accessibilityState={{ expanded }}>
                  <View style={styles.question}>
                    <AppText variant="bodyStrong" color={colors.parentInk} style={styles.flex}>
                      {item.q}
                    </AppText>
                    <Icon name={expanded ? 'minus' : 'plus'} size={18} color={colors.parentSoft} />
                  </View>
                  {expanded ? (
                    <AppText variant="body" color={colors.parentSoft}>
                      {item.a}
                    </AppText>
                  ) : null}
                </Pressy>
              );
            })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 10 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12 },
  scheduleIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  time: { backgroundColor: colors.settingsIconBg, borderRadius: 14, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  toggleHit: { minHeight: 44, justifyContent: 'center' },
  dim: { opacity: 0.45 },
  draft: { marginVertical: 14 },
  steppers: { gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 8, borderWidth: 1, borderColor: colors.lineSoft },
  stepButton: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.completeBg, alignItems: 'center', justifyContent: 'center' },
  helpCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8 },
  question: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
