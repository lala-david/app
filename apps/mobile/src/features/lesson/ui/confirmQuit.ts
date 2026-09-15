import { confirmDialog } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';

export function confirmQuitLesson(): Promise<boolean> {
  return confirmDialog({
    title: strings.quiz.quitDialog.title,
    body: strings.quiz.quitDialog.body,
    confirmLabel: strings.quiz.quitDialog.confirm,
    cancelLabel: strings.quiz.quitDialog.cancel,
    image: 'mascot/sori-hmm',
  });
}
