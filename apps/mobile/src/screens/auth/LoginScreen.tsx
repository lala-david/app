import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { config } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { logIn } from '@/features/auth/model/authActions';
import { emailError } from '@/features/auth/model/validation';
import { useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { mailto, openExternal } from '@/shared/platform/links';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { spacing } from '@/shared/theme/tokens';

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (emailError(email)) return setError(strings.auth.errors.invalidEmail);
    setLoading(true);
    const result = await logIn(email, password);
    setLoading(false);
    if (!result.ok) return setError(strings.auth.errors.wrongCredentials);
    router.replace('/');
  };

  const forgot = async () => {
    const choice = await useFeedbackStore.getState().openDialog({
      title: strings.auth.resetDialog.title,
      body: strings.auth.resetDialog.body,
      actions: [
        { label: strings.auth.resetDialog.confirm, value: 'contact', tone: 'primary' },
        { label: strings.common.close, value: 'close', tone: 'ghost' },
      ],
    });
    if (choice === 'contact') void openExternal(mailto(config.links.contactEmail, strings.auth.resetDialog.title));
  };

  return (
    <Screen mode="parent" scroll keyboard>
      <View style={styles.hero}>
        <AssetImage name="mascot/sori-wave" size={150} />
        <AppText variant="title" align="center">
          {strings.auth.loginTitle}
        </AppText>
        <AppText variant="body" color="textSoft" align="center">
          {strings.auth.loginSubtitle}
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField
          nativeID="login-email"
          label={strings.auth.email}
          placeholder={strings.auth.emailPlaceholder}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          nativeID="login-password"
          label={strings.auth.password}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          secure
          autoComplete="password"
          onSubmitEditing={submit}
          error={error}
        />
        <BigButton label={strings.auth.login} onPress={submit} loading={loading} disabled={!email || !password} />
        <BigButton label={strings.auth.forgot} variant="ghost" size="compact" onPress={forgot} />
      </View>

      <View style={styles.bottom}>
        <BigButton label={strings.auth.toSignup} variant="secondary" onPress={() => router.replace('/signup')} />
        <AppText variant="caption" color="textMuted" align="center">
          {strings.auth.localNotice}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  form: { gap: spacing.md },
  bottom: { gap: spacing.sm, marginTop: spacing.xl },
});
