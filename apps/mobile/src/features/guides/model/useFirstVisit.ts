import { useCallback, useEffect, useState } from 'react';

import { useGuideStore } from '@/entities/guide/model/guideStore';
import { track } from '@/shared/analytics/analytics';

const SHOW_DELAY_MS = 450;

/** 화면 첫 방문에 한 번만 가이드를 보여준다 */
export function useFirstVisit(id: string, enabled = true) {
  const seen = useGuideStore((s) => s.seen.includes(id));
  const markSeen = useGuideStore((s) => s.markSeen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || seen) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, seen]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markSeen(id);
    track('guide_seen', { id });
  }, [id, markSeen]);

  return { visible: visible && !seen, dismiss };
}
