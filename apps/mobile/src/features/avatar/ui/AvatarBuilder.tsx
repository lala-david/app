import { memo, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, sizes, spacing } from '@/shared/theme/tokens';

import { avatarParts, avatarSvg, isColorValue, NONE, randomSelection, type AvatarPart, type AvatarSelection } from '../lib/avatarOptions';

import { AvatarSvg } from './AvatarSvg';

interface Props {
  seed: string;
  selection: AvatarSelection;
  onChange: (selection: AvatarSelection) => void;
}

const COLUMNS = 4;
const TILE = 72;

export function AvatarBuilder({ seed, selection, onChange }: Props) {
  const [activeKey, setActiveKey] = useState(avatarParts[0].key);
  const part = avatarParts.find((p) => p.key === activeKey) ?? avatarParts[0];
  const previewXml = useMemo(() => avatarSvg(seed, selection), [seed, selection]);

  const select = (value: string) => onChange({ ...selection, [part.key]: value });

  return (
    <View style={styles.root}>
      <View style={styles.previewRow}>
        <View style={styles.preview}>
          <AvatarSvg xml={previewXml} size={sizes.avatarLg + 40} />
        </View>
        <PressableScale onPress={() => onChange(randomSelection(Date.now()))} style={styles.random} accessibilityLabel={strings.avatar.random}>
          <Icon name="dice" size={26} color={colors.primaryDark} />
          <AppText variant="caption" color="primaryDark" weight="700">
            {strings.avatar.random}
          </AppText>
        </PressableScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {avatarParts.map((p) => {
          const active = p.key === part.key;
          return (
            <PressableScale
              key={p.key}
              onPress={() => setActiveKey(p.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <AppText variant="bodyStrong" color={active ? 'textOnAccent' : 'textSoft'}>
                {strings.avatar.parts[p.key as keyof typeof strings.avatar.parts] ?? p.key}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>

      <FlatList
        key={part.key}
        data={part.options}
        numColumns={COLUMNS}
        keyExtractor={(item) => item}
        initialNumToRender={16}
        windowSize={5}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <OptionTile part={part} value={item} seed={seed} selection={selection} selected={(selection[part.key] ?? '') === item} onPress={() => select(item)} />
        )}
      />
    </View>
  );
}

interface TileProps {
  part: AvatarPart;
  value: string;
  seed: string;
  selection: AvatarSelection;
  selected: boolean;
  onPress: () => void;
}

const OptionTile = memo(function OptionTile({ part, value, seed, selection, selected, onPress }: TileProps) {
  const xml = useMemo(
    () => (part.kind === 'variant' && value !== NONE ? avatarSvg(seed, { ...selection, [part.key]: value }) : ''),
    // 다른 부위가 바뀌어도 미리보기를 맞추기 위해 selection 전체를 본다
    [part, value, seed, selection],
  );

  return (
    <PressableScale onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.tile, selected && styles.tileSelected]}>
      {value === NONE ? (
        <Icon name="close" size={28} color={colors.textMuted} />
      ) : part.kind === 'color' && isColorValue(value) ? (
        <View style={[styles.swatch, { backgroundColor: `#${value}` }]} />
      ) : (
        <AvatarSvg xml={xml} size={TILE - 8} />
      )}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.sm },
  previewRow: { alignItems: 'center', justifyContent: 'center' },
  preview: {
    width: sizes.avatarLg + 40,
    height: sizes.avatarLg + 40,
    borderRadius: (sizes.avatarLg + 40) / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  random: {
    position: 'absolute',
    right: spacing.md,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: { gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, alignItems: 'center' },
  tab: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surface, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.primary },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  gridRow: { gap: spacing.xs },
  tile: {
    flex: 1,
    maxWidth: `${100 / COLUMNS}%`,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.line },
});
