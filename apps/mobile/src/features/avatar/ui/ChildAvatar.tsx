import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AvatarConfig } from '@/entities/child/model/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { colors } from '@/shared/theme/tokens';

import { avatarSvg } from '../lib/avatarOptions';

import { AvatarSvg } from './AvatarSvg';

interface Props {
  avatar: AvatarConfig;
  size: number;
  bordered?: boolean;
}

const FRAME_SCALE = 1.32;

function ChildAvatarBase({ avatar, size, bordered = false }: Props) {
  const border = bordered ? { borderWidth: Math.max(2, size * 0.05), borderColor: colors.surface } : null;

  if (avatar.kind === 'photo') {
    const hasFrame = avatar.frame !== 'none';
    const frameSize = size * FRAME_SCALE;
    return (
      <View style={[styles.center, { width: hasFrame ? frameSize : size, height: hasFrame ? frameSize : size }]}>
        {hasFrame ? <AssetImage name={`frames/frame-${avatar.frame}`} size={frameSize} style={StyleSheet.absoluteFill} /> : null}
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatar.backdrop }, border]}>
          <Image source={{ uri: avatar.dataUri }} style={{ width: size, height: size }} contentFit="cover" />
        </View>
      </View>
    );
  }

  return <BuilderAvatar seed={avatar.seed} options={avatar.options} size={size} border={border} />;
}

function BuilderAvatar({ seed, options, size, border }: { seed: string; options: Record<string, string>; size: number; border: object | null }) {
  const xml = useMemo(() => avatarSvg(seed, options), [seed, options]);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, border]}>
      <AvatarSvg xml={xml} size={size} />
    </View>
  );
}

export const ChildAvatar = memo(ChildAvatarBase);

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  circle: { overflow: 'hidden', backgroundColor: colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
});
