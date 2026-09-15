import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import help from '@/content/help.json';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Segmented } from '@/shared/ui/Choice';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Screen } from '@/shared/ui/Screen';
import { TopBar } from '@/shared/ui/TopBar';
import { colors, radius, spacing } from '@/shared/theme/tokens';

type Tab = 'guide' | 'faq';

export function HelpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'faq' ? 'faq' : 'guide');
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen mode="parent" scroll header={<TopBar title={strings.settings.help} onLeftPress={() => router.back()} />}>
      <View style={styles.stack}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'guide', label: strings.settings.guidebook },
            { value: 'faq', label: strings.settings.faq },
          ]}
        />

        {tab === 'guide'
          ? help.guidebook.map((item) => (
              <View key={item.title} style={styles.card}>
                <AppText variant="heading">{item.title}</AppText>
                <AppText variant="body" color="textSoft">
                  {item.body}
                </AppText>
              </View>
            ))
          : help.faq.map((item) => {
              const expanded = open === item.q;
              return (
                <PressableScale key={item.q} onPress={() => setOpen(expanded ? null : item.q)} style={styles.card} pressedScale={0.99} accessibilityState={{ expanded }}>
                  <View style={styles.question}>
                    <AppText variant="bodyStrong" style={styles.flex}>
                      Q. {item.q}
                    </AppText>
                    <Icon name={expanded ? 'minus' : 'plus'} size={20} color={colors.textMuted} />
                  </View>
                  {expanded ? (
                    <AppText variant="body" color="textSoft">
                      {item.a}
                    </AppText>
                  ) : null}
                </PressableScale>
              );
            })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm, paddingVertical: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  question: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
});
