import { StyleSheet, View } from 'react-native';

import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import type { Tone } from '@/shared/theme/tokens';

interface Props {
  tone: Tone;
  onPress: () => void;
  size?: number;
  label: string;
}

/** 소리 다시 듣기 버튼 (글자 없이 스피커만) */
export function SpeakerButton({ tone, onPress, size = 96, label }: Props) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.center}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone.base, borderBottomColor: tone.dark }]}>
        <Icon name="speaker" size={size * 0.46} color={tone.ink} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6 },
});
