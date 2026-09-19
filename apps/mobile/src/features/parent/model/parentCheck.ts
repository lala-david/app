import type { RoutineDef } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import { progressActions } from '@/entities/progress/model/progressStore';
import type { CellStatus } from '@/entities/progress/model/types';
import { track } from '@/shared/analytics/analytics';
import { confirmDialog, toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, shortDate } from '@/shared/lib/format';

/** 부모 탭에서 칸을 눌렀을 때: 빈칸은 표시, 부모 표시는 지우기, 앱 기록은 그대로 */
export async function toggleCheck(date: DateKey, routine: RoutineDef, status: CellStatus): Promise<void> {
  const label = { date: shortDate(date), routine: routine.title };

  if (status === 'empty') {
    const ok = await confirmDialog({ title: strings.parent.check.title, body: fmt(strings.parent.check.body, label), confirmLabel: strings.parent.check.confirm, cancelLabel: strings.common.cancel });
    if (!ok) return;
    progressActions.complete(date, routine.key, 'parent', routine.targetMinutes, clock.now());
    track('manual_check', { date, routine: routine.key, checked: true });
    toast(strings.parent.checked);
    return;
  }

  if (status === 'app') {
    toast(strings.parent.appLocked);
    return;
  }

  if (status === 'parent') {
    const ok = await confirmDialog({ title: strings.parent.uncheck.title, body: fmt(strings.parent.uncheck.body, label), confirmLabel: strings.parent.uncheck.confirm, cancelLabel: strings.common.cancel, tone: 'danger' });
    if (!ok) return;
    progressActions.clearParentCheck(date, routine.key);
    track('manual_check', { date, routine: routine.key, checked: false });
    toast(strings.parent.unchecked);
  }
}
