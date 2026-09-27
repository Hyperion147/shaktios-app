import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ShaktiLogo } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { isSupabaseConfigured } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Screen 2 — Login. Phone / Email tabs + Continue with Google.
 * Email tab signs in via Supabase Auth (email + password).
 * Phone tab collects a +91 number; OTP is not enabled on the backend yet,
 * so Continue validates the number and routes to the Email tab to finish
 * sign-in (notice shown). Google is stubbed with the same notice.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login, signUp } = useSession();
  const [tab, setTab] = React.useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submitEmail = async () => {
    setError(null);
    setNotice(null);
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

  const submitPhone = () => {
    setError(null);
    const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setNotice(
      'Phone OTP is not enabled yet — please finish signing in with Email (same account).',
    );
    setTab('email');
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

      <Tabs value={tab} onValueChange={(v) => {
        setTab(v as 'phone' | 'email');
        setError(null);
        setNotice(null);
      }}>
        <TabsList className="h-auto rounded-2xl bg-secondary/70 p-1.5">
          {(['phone', 'email'] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn('flex-1 rounded-xl py-2.5', tab === t && 'bg-primary')}>
              <Text
                className={cn(
                  'text-center text-[14px] font-bold capitalize',
                  tab === t ? 'text-primary-foreground' : 'text-muted-foreground',
                )}>
                {t === 'phone' ? 'Phone' : 'Email'}
              </Text>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <View className="mt-4 gap-3">
        {!isSupabaseConfigured() ? (
          <View className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <Text className="font-semibold">Supabase is not configured</Text>
            <Text variant="muted" className="mt-1 text-[13px]">
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart
              the app.
            </Text>
          </View>
        ) : null}

        {tab === 'phone' ? (
          <View className="gap-1.5">
            <Label>Phone Number</Label>
            <View
              className={cn(
                'flex-row items-center gap-2 rounded-2xl border bg-card px-4',
                error ? 'border-destructive' : 'border-border',
              )}>
              <Text className="text-[15px]">🇮🇳</Text>
              <Text className="text-[15px] font-semibold">+91</Text>
              <View className="h-6 w-px bg-border" />
              <Input
                placeholder="Enter your phone number"
                placeholderTextColor={THEME.light.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                className="h-14 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none"
              />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <View className="gap-1.5">
              <Label>Email</Label>
              <Input
                placeholder="you@mail.com"
                placeholderTextColor={THEME.light.mutedForeground}
                autoCapitalize="none"
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
                value={password}
                onChangeText={setPassword}
                className="h-14 rounded-2xl bg-card text-[15px]"
              />
            </View>
            <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text className="text-center text-[13px] text-muted-foreground">
                {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        )}

        {error ? <Text className="text-[13px] text-destructive">{error}</Text> : null}
        {notice ? (
          <View className="rounded-2xl bg-[#EEEDFF] p-3">
            <Text className="text-[12px] leading-5">{notice}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={busy ? 'Please wait…' : 'Continue'}
          onPress={tab === 'phone' ? submitPhone : submitEmail}
          loading={busy}
        />

        <View className="flex-row items-center gap-3 py-1">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-[12px] text-muted-foreground">or</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <Pressable
          onPress={() =>
            setNotice('Google sign-in is coming soon — please use Email to sign in.')
          }
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5">
          <Text className="text-[16px] font-bold text-primary">G</Text>
          <Text className="text-[14px] font-semibold">Continue with Google</Text>
        </Pressable>

        <Text className="mt-1 text-center text-[11px] leading-4 text-muted-foreground">
          By continuing, you agree to our{'\n'}
          <Text className="text-[11px] font-semibold text-primary">Terms & Privacy Policy</Text>
        </Text>
      </View>
    </ScreenContainer>
  );
}
