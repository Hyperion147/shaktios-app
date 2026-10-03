import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ShaktiLogo } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { isSupabaseConfigured } from '@/src/constants/config';
import { THEME } from '@/lib/theme';

/** Email/password authentication backed by Supabase Auth. */
export default function LoginScreen() {
  const router = useRouter();
  const { login, signUp, sessionError } = useSession();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim().includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') await login(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} className="self-start rounded-full p-1.5">
        <ChevronLeft size={24} color={THEME.light.foreground} />
      </Pressable>

      <View className="mt-2 items-center gap-2">
        <View className="flex-row items-center gap-2">
          <ShaktiLogo size={36} />
          <Text className="text-[22px] font-extrabold tracking-tight text-primary">ShaktiOS</Text>
        </View>
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          Sign in to report incidents{'\n'}and keep your community safe.
        </Text>
      </View>

      <View className="mt-6 gap-3">
        {!isSupabaseConfigured() ? (
          <View className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <Text className="font-semibold">Supabase is not configured</Text>
            <Text variant="muted" className="mt-1 text-[13px]">
              Set the public Supabase URL and publishable key, then restart the app.
            </Text>
          </View>
        ) : null}

        <View className="gap-1.5">
          <Label>Email</Label>
          <Input
            placeholder="you@mail.com"
            placeholderTextColor={THEME.light.mutedForeground}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="h-14 rounded-2xl bg-card text-[15px]"
          />
        </View>
        <View className="gap-1.5">
          <Label>Password</Label>
          <Input
            placeholder="••••••••"
            placeholderTextColor={THEME.light.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            className="h-14 rounded-2xl bg-card text-[15px]"
          />
        </View>

        {error || sessionError ? <Text className="text-[13px] text-destructive">{error ?? sessionError}</Text> : null}

        <PrimaryButton
          title={busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          onPress={submit}
          loading={busy}
          disabled={!isSupabaseConfigured()}
        />

        <Pressable
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}>
          <Text className="text-center text-[13px] text-muted-foreground">
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
