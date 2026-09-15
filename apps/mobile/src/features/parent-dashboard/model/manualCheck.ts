import type { RoutineDef } from '@/entities/content/types';
import { progressActions } from '@/entities/progress/model/progressStore';
import { requireParent } from '@/features/parent-gate/model/gateStore';
import { track } from '@/shared/analytics/analytics';
import { confirmDialog, toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, shortDate } from '@/shared/lib/format';

import type { TableCell } from './dashboard';

/** 루틴표 칸을 눌렀을 때: 빈칸은 표시, 부모 표시는 지우기, 앱 기록은 잠김 */
export async function toggleCell(cell: TableCell, routine: RoutineDef, run: number): Promise<void> {
  if (!cell.key || cell.status === 'future' || cell.status === 'none' || cell.status === 'outside') return;
  if (!(await requireParent())) return;

  const identity = { key: cell.key, run, day: cell.dayIndex, date: cell.date, routine: routine.key };
  const label = { date: shortDate(cell.date), routine: routine.titleKo };

  if (cell.status === 'empty') {
    const ok = await confirmDialog({
      title: strings.parent.checkDialog.title,
      body: fmt(strings.parent.checkDialog.body, label),
      confirmLabel: strings.parent.checkDialog.confirm,
      cancelLabel: strings.common.cancel,
      image: routine.sticker,
    });
    if (!ok) return;
    progressActions.setParentCheck(identity, true, clock.now(), routine.targetMinutes);
    track('manual_check', { key: cell.key, checked: true });
    toast(strings.parent.checked);
    return;
  }

  if (cell.record?.source !== 'parentCheck') {
    toast(strings.parent.autoLocked);
    return;
  }

  const ok = await confirmDialog({
    title: strings.parent.uncheckDialog.title,
    body: fmt(strings.parent.uncheckDialog.body, label),
    confirmLabel: strings.parent.uncheckDialog.confirm,
    cancelLabel: strings.common.cancel,
    tone: 'danger',
  });
  if (!ok) return;
  progressActions.setParentCheck(identity, false, clock.now(), 0);
  track('manual_check', { key: cell.key, checked: false });
  toast(strings.parent.unchecked);
}
