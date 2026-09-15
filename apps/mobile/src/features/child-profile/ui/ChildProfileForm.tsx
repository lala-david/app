import { StyleSheet, View } from 'react-native';

import type { AvatarConfig } from '@/entities/child/model/types';
import { ageBands, config } from '@/entities/content/content';
import type { AgeBand } from '@/entities/content/types';
import { ChildAvatar } from '@/features/avatar/ui/ChildAvatar';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Chip } from '@/shared/ui/Choice';
import { Icon } from '@/shared/ui/icons';
import { TextField } from '@/shared/ui/TextField';
import { colors, sizes, spacing } from '@/shared/theme/tokens';

interface Props {
  avatar: AvatarConfig;
  nickname: string;
  ageBand: AgeBand;
  nicknameError: string | null;
  onNicknameChange: (value: string) => void;
  onAgeChange: (value: AgeBand) => void;
  onDecorate: () => void;
  onPhoto: () => void;
}

export function ChildProfileForm({ avatar, nickname, ageBand, nicknameError, onNicknameChange, onAgeChange, onDecorate, onPhoto }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <ChildAvatar avatar={avatar} size={sizes.avatarLg} bordered />
        <View style={styles.avatarButtons}>
          <BigButton label={strings.child.decorate} variant="secondary" size="compact" fullWidth={false} icon={<Icon name="sparkle" size={18} color={colors.primary} />} onPress={onDecorate} />
          <BigButton label={strings.child.photo} variant="secondary" size="compact" fullWidth={false} icon={<Icon name="image" size={18} color={colors.textSoft} />} onPress={onPhoto} />
        </View>
      </View>

      <TextField
        nativeID="child-nickname"
        label={strings.child.nickname}
        placeholder={strings.child.nicknamePlaceholder}
        value={nickname}
        maxLength={config.nicknameMaxLength}
        onChangeText={onNicknameChange}
        error={nicknameError}
        returnKeyType="done"
      />

      <View style={styles.section}>
        <AppText variant="caption" color="textSoft">
          {strings.child.age}
        </AppText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {ageBands.map((band) => (
            <Chip key={band} label={fmt(strings.child.ageOption, { age: band })} selected={ageBand === band} onPress={() => onAgeChange(band)} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  avatar: { alignItems: 'center', gap: spacing.sm },
  avatarButtons: { flexDirection: 'row', gap: spacing.xs },
  section: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
