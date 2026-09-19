import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import legal from '@/content/legal.json';
import { config } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { logIn, signUp } from '@/features/auth/model/authActions';
import { confirmError, emailError, passwordError } from '@/features/auth/model/validation';
import { confirmDialog, useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { BackBar, Checkbox, PrimaryButton, SoftButton, TextField } from '@/shared/ui/Form';
import { Pressy } from '@/shared/ui/Pressy';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius } from '@/shared/theme/tokens';

function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.hero}>
      <AssetImage name="brand/logo" width={190} height={44} />
      <View style={styles.cast}>
        <Character name="rabbit" size={64} float delay={200} />
        <Character name="chick" size={92} float delay={600} />
        <Character name="crocodile" size={84} float delay={1000} />
        <Character name="cat" size={60} float delay={1400} />
      </View>
      <AppText variant="greeting" align="center">
        {title}
      </AppText>
      <AppText variant="body" color={colors.inkSoft} align="center">
        {subtitle}
      </AppText>
    </View>
  );
}

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

  return (
    <Screen>
      <AuthHero title={strings.auth.loginTitle} subtitle={strings.auth.loginSubtitle} />
      <View style={styles.form}>
        <TextField nativeID="login-email" label={strings.auth.email} placeholder={strings.auth.emailPlaceholder} value={email} onChangeText={(v) => { setEmail(v); setError(null); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <TextField nativeID="login-password" label={strings.auth.password} value={password} onChangeText={(v) => { setPassword(v); setError(null); }} secure autoComplete="password" onSubmitEditing={submit} error={error} />
        <PrimaryButton label={strings.auth.login} onPress={submit} loading={loading} disabled={!email || !password} />
        <SoftButton label={strings.auth.toSignup} onPress={() => router.replace('/signup')} />
        <AppText variant="caption" color={colors.inkFaint} align="center">
          {strings.auth.localNotice}
        </AppText>
      </View>
    </Screen>
  );
}

type ConsentKey = 'terms' | 'privacy' | 'notify';

function showLegal(doc: keyof typeof legal) {
  void useFeedbackStore.getState().openDialog({ title: legal[doc].title, body: legal[doc].body, actions: [{ label: strings.common.close, value: 'close', tone: 'primary' }] });
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
  const all = Object.values(consents).every(Boolean);
  const show = (e: string | false | null) => (touched && e ? e : null);
  const toggle = (key: ConsentKey) => setConsents((c) => ({ ...c, [key]: !c[key] }));

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    const result = await signUp({ email, password, consentVersion: config.consentVersion, notifyConsent: consents.notify });
    setLoading(false);
    if (result.ok) return router.replace('/');
    const { duplicateDialog: d } = strings.auth;
    if (await confirmDialog({ title: d.title, body: d.body, confirmLabel: d.confirm, cancelLabel: d.cancel })) router.replace('/login');
  };

  const viewLink = (doc: keyof typeof legal) => (
    <Pressy onPress={() => showLegal(doc)} style={styles.viewLink}>
      <AppText variant="caption" color={colors.inkMuted} style={styles.underline}>
        {strings.auth.consent.view}
      </AppText>
    </Pressy>
  );

  return (
    <Screen>
      <BackBar title={strings.auth.signupTitle} onBack={() => router.replace('/login')} />
      <View style={styles.form}>
        <AppText variant="body" color={colors.inkSoft}>
          {strings.auth.signupSubtitle}
        </AppText>
        <TextField nativeID="signup-email" label={strings.auth.email} placeholder={strings.auth.emailPlaceholder} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={show(errors.email)} />
        <TextField nativeID="signup-password" label={strings.auth.password} placeholder={fmt(strings.auth.passwordPlaceholder, { n: config.passwordMinLength })} value={password} onChangeText={setPassword} secure autoComplete="new-password" error={show(errors.password)} />
        <TextField nativeID="signup-confirm" label={strings.auth.passwordConfirm} value={confirm} onChangeText={setConfirm} secure autoComplete="new-password" error={show(errors.confirm)} />

        <View style={styles.consents}>
          <Checkbox label={strings.auth.consent.all} checked={all} onToggle={() => setConsents({ terms: !all, privacy: !all, notify: !all })} />
          <View style={styles.rule} />
          <Checkbox label={strings.auth.consent.terms} checked={consents.terms} onToggle={() => toggle('terms')} trailing={viewLink('terms')} />
          <Checkbox label={strings.auth.consent.privacy} checked={consents.privacy} onToggle={() => toggle('privacy')} trailing={viewLink('privacy')} />
          <Checkbox label={strings.auth.consent.notify} checked={consents.notify} onToggle={() => toggle('notify')} />
          {show(errors.consent) ? (
            <AppText variant="caption" color={colors.danger}>
              {errors.consent}
            </AppText>
          ) : null}
        </View>

        <PrimaryButton label={strings.auth.signup} onPress={submit} loading={loading} />
        <AppText variant="caption" color={colors.inkFaint} align="center">
          {strings.auth.localNotice}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingTop: 18, paddingBottom: 22 },
  cast: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2, marginVertical: 10 },
  form: { gap: 14 },
  consents: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.lineSoft },
  rule: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 2 },
  viewLink: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
