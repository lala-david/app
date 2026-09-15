import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/shared/theme/tokens';

import { imageSource } from '../assets';

interface Props {
  name: string | undefined;
  size?: number;
  width?: number;
  height?: number;
  fit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** 콘텐츠 키로 그림을 그린다. 파일이 없으면 자리만 차지하는 빈 타일 */
export function AssetImage({ name, size, width, height, fit = 'contain', style, accessibilityLabel }: Props) {
  const source = imageSource(name);
  const box = { width: width ?? size, height: height ?? size };

  if (!source) return <View style={[box, styles.placeholder, style]} accessibilityLabel={accessibilityLabel} />;

  return (
    <Image
      source={source}
      style={[box, style as object]}
      contentFit={fit}
      transition={120}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.surfaceSunken, borderRadius: radius.md },
});
