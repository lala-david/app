import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import legal from '@/content/legal.json';
import { config } from '@/entities/content/content';
import { signUp } from '@/features/auth/model/authActions';
import { confirmError, emailError, passwordError } from '@/features/auth/model/validation';
import { confirmDialog, useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Checkbox } from '@/shared/ui/Choice';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { TopBar } from '@/shared/ui/TopBar';
import { colors, radius, spacing } from '@/shared/theme/tokens';

type ConsentKey = 'terms' | 'privacy' | 'notify';

function showLegal(doc: keyof typeof legal) {
  void useFeedbackStore.getState().openDialog({
    title: legal[doc].title,
    body: legal[doc].body,
    actions: [{ label: strings.common.close, value: 'close', tone: 'primary' }],
  });
}

export function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({ terms: false, privacy: false, notify: true });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = {
    email: emailError(email) && strings.auth.errors.invalidEmail,
    password: passwordError(password, config.passwordMinLength) && fmt(strings.auth.errors.shortPassword, { n: config.passwordMinLength }),
    confirm: confirmError(password, confirm) && strings.auth.errors.mismatch,
    consent: !(consents.terms && consents.privacy) && strings.auth.errors.consentRequired,
  };
  const valid = !Object.values(errors).some(Boolean);
  const allChecked = Object.values(consents).every(Boolean);

  const toggle = (key: ConsentKey) => setConsents((c) => ({ ...c, [key]: !c[key] }));

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    const result = await signUp({ email, password, consentVersion: config.consentVersion, notifyConsent: consents.notify });
    setLoading(false);
    if (result.ok) return router.replace('/');
    const goLogin = await confirmDialog({
      title: strings.auth.duplicateDialog.title,
      body: strings.auth.duplicateDialog.body,
      confirmLabel: strings.auth.duplicateDialog.confirm,
      cancelLabel: strings.auth.duplicateDialog.cancel,
    });
    if (goLogin) router.replace('/login');
  };

  const show = (error: string | false | null) => (touched && error ? error : null);

  return (
    <Screen mode="parent" scroll keyboard header={<TopBar title={strings.auth.signupTitle} onLeftPress={() => router.back()} />}>
      <View style={styles.form}>
        <AppText variant="body" color="textSoft">
          {strings.auth.signupSubtitle}
        </AppText>
        <TextField nativeID="signup-email" label={strings.auth.email} placeholder={strings.auth.emailPlaceholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={show(errors.email)} />
        <TextField nativeID="signup-password" label={strings.auth.password} placeholder={fmt(strings.auth.passwordPlaceholder, { n: config.passwordMinLength })} value={password} onChangeText={setPassword} secure autoComplete="new-password" error={show(errors.password)} />
        <TextField nativeID="signup-confirm" label={strings.auth.passwordConfirm} value={confirm} onChangeText={setConfirm} secure autoComplete="new-password" error={show(errors.confirm)} />

        <View style={styles.consents}>
          <Checkbox
            label={<AppText variant="bodyStrong">{strings.auth.consent.all}</AppText>}
            checked={allChecked}
            onToggle={() => setConsents({ terms: !allChecked, privacy: !allChecked, notify: !allChecked })}
          />
          <View style={styles.divider} />
          <Checkbox label={strings.auth.consent.terms} checked={consents.terms} onToggle={() => toggle('terms')} trailing={<ViewLink onPress={() => showLegal('terms')} />} />
          <Checkbox label={strings.auth.consent.privacy} checked={consents.privacy} onToggle={() => toggle('privacy')} trailing={<ViewLink onPress={() => showLegal('privacy')} />} />
          <Checkbox label={strings.auth.consent.notify} checked={consents.notify} onToggle={() => toggle('notify')} />
          {show(errors.consent) ? (
            <AppText variant="caption" color="danger">
              {errors.consent}
            </AppText>
          ) : null}
        </View>

        <BigButton label={strings.auth.signup} onPress={submit} loading={loading} />
        <BigButton label={strings.auth.toLogin} variant="ghost" onPress={() => router.replace('/login')} />
        <AppText variant="caption" color="textMuted" align="center">
          {strings.auth.localNotice}
        </AppText>
      </View>
    </Screen>
  );
}

function ViewLink({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.viewLink} haptic={false}>
      <AppText variant="caption" color="textMuted" style={styles.underline}>
        {strings.auth.consent.view}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  consents: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, gap: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.xxs },
  viewLink: { paddingHorizontal: spacing.xs, minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
