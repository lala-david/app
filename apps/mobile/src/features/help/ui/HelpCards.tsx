import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CharacterKey } from '@/entities/content/types';
import { strings } from '@/shared/i18n/strings.ko';
import { persistStorage, storageKey } from '@/shared/lib/storage';
import { Appear } from '@/shared/ui/Appear';
import { AppText } from '@/shared/ui/AppText';
import { FitModalRoot } from '@/shared/ui/fit';
import { Character } from '@/shared/ui/Character';
import { PrimaryButton } from '@/shared/ui/Form';
import { colors, radius, sizes } from '@/shared/theme/tokens';

interface HelpState {
  seen: boolean;
  markSeen: () => void;
  reset: () => void;
}

/** 첫 방문 도움말을 봤는지 (기기 단위). 설정의 ‘도움말 다시 보기’가 reset 을 부른다 */
export const useHelpStore = create<HelpState>()(
  persist((set) => ({ seen: false, markSeen: () => set({ seen: true }), reset: () => set({ seen: false }) }), { name: storageKey('help'), storage: persistStorage }),
);

const SHOW_DELAY_MS = 500;

/** 오늘 탭에 처음 들어오면 한 번 보여주는 4장짜리 도움말 */
export function HelpCards({ enabled }: { enabled: boolean }) {
  const seen = useHelpStore((s) => s.seen);
  const markSeen = useHelpStore((s) => s.markSeen);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || seen) return;
    const timer = setTimeout(() => {
      setIndex(0);
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, seen]);

  if (!visible || seen) return null;
  const cards = strings.help.cards;
  const card = cards[index];
  const last = index === cards.length - 1;
  const close = () => {
    setVisible(false);
    markSeen();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <FitModalRoot>
      <View style={styles.backdrop}>
        <Appear style={styles.card}>
          <Character name={card.character as CharacterKey} size={132} float />
          <AppText variant="sectionTitle" align="center">
            {card.title}
          </AppText>
          <AppText variant="body" color={colors.inkSoft} align="center" style={styles.body}>
            {card.body}
          </AppText>
          <View style={styles.dots}>
            {cards.map((c, i) => (
              <View key={c.title} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
          <PrimaryButton label={last ? strings.help.gotIt : strings.common.next} onPress={() => (last ? close() : setIndex(index + 1))} />
        </Appear>
      </View>
      </FitModalRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.shade, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: colors.ground, borderRadius: radius.sheet, padding: 24, gap: 10, alignItems: 'stretch' },
  body: { minHeight: 66 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.brand },
});
