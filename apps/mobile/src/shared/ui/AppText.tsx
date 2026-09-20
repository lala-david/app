import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type as typeScale, type TypeVariant } from '@/shared/theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', color = colors.ink, align, style, ...rest }: AppTextProps) {
  return <Text allowFontScaling={false} {...rest} style={[typeScale[variant] as TextStyle, { color, textAlign: align }, style]} />;
}
