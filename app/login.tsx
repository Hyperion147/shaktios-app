import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppInput } from '@/src/components/AppInput';
import { useSession } from '@/src/store/session';
import { API_BASE_URL, isSupabaseConfigured } from '@/src/constants/config';

/** Citizen sign-in via Supabase Auth (email + password). */
export default function LoginScreen() {
  const router = useRouter();
  const { login, signUp } = useSession();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="justify-center">
      <View className="gap-2">
        <Text variant="h1" className="text-left">ShaktiOS</Text>
        <Text variant="muted">Citizen reporting — signals for event safety.</Text>
      </View>

      <View className="mt-8 gap-4">
        {!isSupabaseConfigured() ? (
          <View className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <Text className="font-semibold">Supabase is not configured</Text>
            <Text variant="muted" className="mt-1 text-sm">
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then
              restart the app.
            </Text>
          </View>
        ) : null}
        <AppInput
          label="Email"
          placeholder="you@mail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error}
        />
        <AppInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          hint={mode === 'signup' ? 'Min. 6 characters.' : 'Your Supabase account password.'}
        />
        <Pressable
          onPress={submit}
          disabled={busy}
          className="rounded-lg bg-primary py-3.5 disabled:opacity-50">
          <Text className="text-center font-semibold text-primary-foreground">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          <Text className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </Text>
        </Pressable>
        <Text variant="muted" className="text-center text-xs">
          API: {API_BASE_URL}
        </Text>
      </View>
    </ScreenContainer>
  );
}
