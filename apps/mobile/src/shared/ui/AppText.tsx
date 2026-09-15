import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type as typeScale, type TypeVariant } from '@/shared/theme/tokens';

type ColorName = keyof typeof colors;

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: ColorName;
  tint?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
}

export function AppText({ variant = 'body', color = 'text', tint, align, weight, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typeScale[variant] as TextStyle,
        { color: tint ?? colors[color], textAlign: align },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
}
